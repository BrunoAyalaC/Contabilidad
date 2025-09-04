using Microsoft.AspNetCore.Mvc;

using OcrService.Models;
using System.Diagnostics;
using System.Text.Json;
using UglyToad.PdfPig;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Linq; // added for ordering
using UglyToad.PdfPig.Content;

namespace OcrService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Secure the OCR endpoints
    public class OcrController : ControllerBase
    {
        private readonly string _tempUploadPath;
        private readonly ILogger<OcrController> _logger;

        public OcrController(string tempUploadPath, ILogger<OcrController> logger)
        {
            _tempUploadPath = tempUploadPath;
            _logger = logger;
        }

        [HttpPost("invoices")]
        public async Task<IActionResult> UploadInvoiceForOcr(IFormFile file)
        {
            string allText = string.Empty; // visual-ordered text
            string rawTextCrudo = string.Empty; // raw text straight from PdfPig pages (no reordering)
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file uploaded." });
            }

            if (Path.GetExtension(file.FileName).ToLower() != ".pdf")
            {
                return BadRequest(new { message = "Only PDF files are allowed." });
            }

            var fileName = file.FileName;
            var filePath = Path.Combine(_tempUploadPath, fileName);

            // Save the file temporarily
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Fast-path: try to extract text directly from PDF (no OCR) using PdfPig.
            try
            {
                using (var pdf = PdfDocument.Open(filePath))
                {
                    foreach (var page in pdf.GetPages())
                    {
                        // Prefer visual ordering: top->bottom, left->right
                        var pageLines = new List<string>();

                        // Capture raw page text (as provided by PdfPig) for diagnostic / crudo view
                        rawTextCrudo += page.Text + "\n";

                        // Try to get words with bounding boxes; fallback to page.Text if words empty
                        var words = page.GetWords().ToList();
                        if (words == null || words.Count == 0)
                        {
                            allText += page.Text + "\n";
                            continue;
                        }

                        // Sort words primarily by Y (top coordinate) descending, then by X (left) ascending
                        var sorted = words.OrderByDescending(w => w.BoundingBox.Top)
                                          .ThenBy(w => w.BoundingBox.Left)
                                          .ToList();

                        // Bucket words into lines by proximity in Y
                        var buckets = new List<List<Word>>();
                        const double yTolerance = 3.0; // points; tune if needed
                        foreach (var w in sorted)
                        {
                            bool placed = false;
                            foreach (var b in buckets)
                            {
                                if (Math.Abs(b[0].BoundingBox.Top - w.BoundingBox.Top) <= yTolerance)
                                {
                                    b.Add(w);
                                    placed = true;
                                    break;
                                }
                            }
                            if (!placed)
                            {
                                buckets.Add(new List<Word> { w });
                            }
                        }

                        // For each bucket (line), sort by X and build the text
                        foreach (var b in buckets)
                        {
                            var line = string.Join(" ", b.OrderBy(w => w.BoundingBox.Left).Select(w => w.Text));
                            pageLines.Add(line);
                        }

                        allText += string.Join("\n", pageLines) + "\n";
                    }
                }

                // Local helper: try parse a monetary string with flexible separators
                decimal? TryParseMoney(string s)
                {
                    if (string.IsNullOrWhiteSpace(s)) return null;
                    s = s.Trim();

                    // Remove currency symbols and whitespace
                    s = Regex.Replace(s, @"[A-Za-z\s\$S/]+", "", RegexOptions.None);

                    // Try parsing with es-PE culture (comma as thousands, dot as decimal)
                    if (Decimal.TryParse(s, System.Globalization.NumberStyles.Any, new System.Globalization.CultureInfo("es-PE"), out var v)) return v;

                    // Fallback: remove all non-digit/non-dot/non-comma, then try invariant culture (might be ambiguous)
                    var fallback = Regex.Replace(s, @"[^0-9\.,]", "");
                    // If it contains both, assume last one is decimal, others are thousands
                    if (fallback.Contains('.') && fallback.Contains(','))
                    {
                        var lastDot = fallback.LastIndexOf('.');
                        var lastComma = fallback.LastIndexOf(',');
                        if (lastDot > lastComma) // e.g., 1.234,56 -> 1234.56
                        {
                            fallback = fallback.Replace(",", "");
                        }
                        else // e.g., 1,234.56 -> 1234.56
                        {
                            fallback = fallback.Replace(".", "");
                            fallback = fallback.Replace(",", ".");
                        }
                    }
                    else if (fallback.Contains(',')) // Only comma, assume it's decimal if 1 or 2 digits after
                    {
                        var parts = fallback.Split(',');
                        if (parts.Length == 2 && parts[1].Length <= 2)
                        {
                            fallback = fallback.Replace(",", ".");
                        }
                        else // Assume comma is thousands
                        {
                            fallback = fallback.Replace(",", "");
                        }
                    }
                    // If only dot, assume it's decimal

                    if (Decimal.TryParse(fallback, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var vf)) return vf;

                    return null;
                }

                // Prepare parsed container
                var parsed = new Dictionary<string, object?>();

                // 1) RUC detection: several flavors
                var rucPatterns = new[] {
                    @"R\.?U\.?C\.?[:\s]*([0-9]{8,11})",
                    @"RUC[:\s]*([0-9]{8,11})",
                    @"Registro\s*RUC[:\s]*([0-9]{8,11})"
                };
                foreach (var pat in rucPatterns)
                {
                    var m = Regex.Match(allText, pat, RegexOptions.IgnoreCase);
                    if (m.Success)
                    {
                        parsed["ruc"] = m.Groups[1].Value.Trim();
                        break;
                    }
                }

                // 2) Fecha: try multiple common formats
                var dateMatch = Regex.Match(allText, @"Fecha[\s\w]*[:\s]*([0-3]?\d[\/\-]\d{1,2}[\/\-]\d{2,4})", RegexOptions.IgnoreCase);
                if (!dateMatch.Success)
                {
                    dateMatch = Regex.Match(allText, @"(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})");
                }
                if (dateMatch.Success) parsed["date"] = dateMatch.Groups[1].Value.Trim();

                // Split lines for line-oriented heuristics
                var lines = allText.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);

                // 3) Total: first try labels near the value by scanning lines
                foreach (var line in lines)
                {
                    if (Regex.IsMatch(line, @"TOTAL|IMPORTE TOTAL|TOTAL A PAGAR|IMPORTE:", RegexOptions.IgnoreCase))
                    {
                        var m = Regex.Match(line, @"([0-9\.,]+)");
                        if (m.Success)
                        {
                            var val = TryParseMoney(m.Value);
                            if (val.HasValue)
                            {
                                parsed["total"] = val.Value.ToString(System.Globalization.CultureInfo.InvariantCulture);
                                break;
                            }
                        }
                    }
                }

                // 4) If not found yet, search for the largest monetary-like token in whole text
                if (!parsed.ContainsKey("total"))
                {
                    var moneyMatches = Regex.Matches(allText, @"\b[0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,][0-9]{1,2})?\b");
                    decimal largest = 0;
                    foreach (Match m in moneyMatches)
                    {
                        var candidate = TryParseMoney(m.Value);
                        if (candidate.HasValue && candidate.Value > largest)
                        {
                            largest = candidate.Value;
                        }
                    }
                    if (largest > 0) parsed["total"] = largest.ToString(System.Globalization.CultureInfo.InvariantCulture);
                }

                // --- NEW: additional minimal heuristics ---
                // invoice number (serie-number) - look near the header with FACTURA or fallback to first token matching pattern
                string? invoiceNumber = null;
                foreach (var l in lines)
                {
                    if (Regex.IsMatch(l, @"FACTURA", RegexOptions.IgnoreCase))
                    {
                        var mInv = Regex.Match(l, @"([A-Z0-9]{1,4})[-\s]?(\d{1,7})", RegexOptions.IgnoreCase);
                        if (mInv.Success)
                        {
                            invoiceNumber = mInv.Value.Trim();
                            break;
                        }
                    }
                }
                if (string.IsNullOrEmpty(invoiceNumber))
                {
                    var mInv2 = Regex.Match(allText, @"\b([A-Z0-9]{1,4})[-\s]?(\d{1,7})\b", RegexOptions.IgnoreCase);
                    if (mInv2.Success) invoiceNumber = mInv2.Value.Trim();
                }
                if (!string.IsNullOrEmpty(invoiceNumber)) parsed["invoiceNumber"] = invoiceNumber;

                // collect all RUC occurrences and decide issuer vs recipient by appearance order
                var rucMatchesAll = Regex.Matches(allText, @"\bRUC[:\s]*([0-9]{8,11})\b", RegexOptions.IgnoreCase);
                var rucList = new List<string>();
                foreach (Match rm in rucMatchesAll)
                {
                    var v = rm.Groups[1].Value.Trim();
                    if (!rucList.Contains(v)) rucList.Add(v);
                }
                if (rucList.Count > 0)
                {
                    parsed["issuerRuc"] = rucList[0];
                    if (rucList.Count > 1) parsed["recipientRuc"] = rucList[1];
                }

                // party / customer name: try capture after 'Señor(es):'
                var partyMatch = Regex.Match(allText, @"Señor\(es\)\s*[:\s]*([A-Z0-9ÁÉÍÓÚÑñ\s\.,\-]+)", RegexOptions.IgnoreCase);
                if (partyMatch.Success)
                {
                    parsed["partyName"] = partyMatch.Groups[1].Value.Trim();
                }
                else
                {
                    // fallback: try 'Señor(es):' without parentheses
                    partyMatch = Regex.Match(allText, @"Señor(es)?\s*[:\s]*([A-Z0-9ÁÉÍÓÚÑñ\s\.,\-]+)", RegexOptions.IgnoreCase);
                    if (partyMatch.Success) parsed["partyName"] = partyMatch.Groups[2].Value.Trim();
                }

                // IGV / tax amount
                var igvMatch = Regex.Match(allText, @"IGV\s*[:\s]*S?\/?\s*([0-9\.,]+)", RegexOptions.IgnoreCase);
                if (igvMatch.Success)
                {
                    var igvVal = TryParseMoney(igvMatch.Groups[1].Value);
                    if (igvVal.HasValue) parsed["igv"] = igvVal.Value.ToString(System.Globalization.CultureInfo.InvariantCulture);
                }

                // currency detection
                var currencyMatch = Regex.Match(allText, @"Tipo de Moneda[:\s]*([A-Za-z]+)", RegexOptions.IgnoreCase);
                if (currencyMatch.Success)
                {
                    parsed["currency"] = currencyMatch.Groups[1].Value.Trim();
                }
                else if (allText.Contains("S/"))
                {
                    parsed["currency"] = "PEN"; // common fallback
                }

                // --- END NEW heuristics ---

                // If we found at least total or RUC, consider parsed successful (loosened condition for text-only PDFs)
                if (parsed.ContainsKey("total") || parsed.ContainsKey("ruc") || parsed.ContainsKey("issuerRuc"))
                {
                    var structured = new ParsedInvoiceData();
                    if (parsed.ContainsKey("ruc")) structured.Ruc = parsed["ruc"]?.ToString();
                    // prefer issuerRuc if available
                    if (parsed.ContainsKey("issuerRuc")) structured.Ruc = parsed["issuerRuc"]?.ToString();
                    if (parsed.ContainsKey("date") && DateTime.TryParse(parsed["date"]?.ToString(), out var dt)) structured.InvoiceDate = dt;
                    if (parsed.ContainsKey("total") && Decimal.TryParse(parsed["total"]?.ToString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var totalVal)) structured.TotalAmount = totalVal;

                    structured.ConfidenceScores = new Dictionary<string, decimal>
                    {
                        { "Overall", 1.0m }
                    };

                    // Prepare extras to return additional fields without changing the model
                    var extras = new Dictionary<string, object?>();
                    if (parsed.ContainsKey("invoiceNumber")) extras["invoiceNumber"] = parsed["invoiceNumber"];
                    if (parsed.ContainsKey("issuerRuc")) extras["issuerRuc"] = parsed["issuerRuc"];
                    if (parsed.ContainsKey("recipientRuc")) extras["recipientRuc"] = parsed["recipientRuc"];
                    if (parsed.ContainsKey("partyName")) extras["partyName"] = parsed["partyName"];
                    if (parsed.ContainsKey("igv")) extras["igv"] = parsed["igv"];
                    if (parsed.ContainsKey("currency")) extras["currency"] = parsed["currency"];

                    // Clean up the uploaded file immediately after processing
                    if (System.IO.File.Exists(filePath))
                    {
                        System.IO.File.Delete(filePath);
                    }

                    return Ok(new { ParsedData = structured, RawText = allText, RawTextCrudo = rawTextCrudo, Extras = extras }); // Directly return the parsed data, visual-ordered raw text, raw page text and extras
                }
            }
            catch (Exception exFast)
            {
                _logger.LogError(exFast, "Error during fast-path PDF text extraction.");
            }
            finally
            {
                // Ensure the uploaded file is cleaned up even if parsing fails
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }
            }

            // If parsing failed or no relevant data found, return both visual-ordered and raw page text for debugging
            return Ok(new { ParsedData = (ParsedInvoiceData?)null, RawText = allText, RawTextCrudo = rawTextCrudo });
        }

        /// <summary>
        /// Allow anonymous OPTIONS preflight for the invoices endpoint so browsers can perform CORS preflight.
        /// </summary>
        [AllowAnonymous]
        [HttpOptions("invoices")]
        public IActionResult PreflightInvoices()
        {
            // Return NoContent; CORS middleware will add the necessary headers when configured globally.
            return NoContent();
        }
    }
}
