using AccountingService.Data;
using AccountingService.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Hosting;
using System.IO;
using System.Numerics;
using System.Threading;

namespace AccountingService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountingController : ControllerBase
    {
        private readonly AccountingDbContext _context;
        private readonly PcgePlanContable _pcgeData;
        private readonly IWebHostEnvironment _env;

        public AccountingController(AccountingDbContext context, PcgePlanContable pcgeData, IWebHostEnvironment env)
        {
            _context = context;
            _pcgeData = pcgeData;
            _env = env;
        }

        [HttpGet("accounts")]
        public IActionResult GetPcgeAccounts([FromQuery] string? q, [FromQuery] int? limit)
        {
            if (_pcgeData == null || _pcgeData.Cuentas == null)
            {
                return NotFound(new { message = "PCGE data not loaded." });
            }

            // If no search term, return the original PCGE structure for compatibility (tests, tooling)
            if (string.IsNullOrWhiteSpace(q))
            {
                return Ok(_pcgeData.Cuentas);
            }

            // Flatten the hierarchical PCGE into a list of simple account items (typed)
            var items = new List<AccountItemDto>();

            void AddAccount(string code, string name, string? description)
            {
                items.Add(new AccountItemDto { Code = code ?? string.Empty, Name = name ?? string.Empty, Description = description ?? string.Empty });
            }

            foreach (var category in _pcgeData.Cuentas)
            {
                // category contains top-level code/name and a list of cuentas
                if (category.Cuentas != null)
                {
                    foreach (var cuenta in category.Cuentas)
                    {
                        AddAccount(cuenta.Codigo, cuenta.Nombre, category.Nombre);
                        if (cuenta.Subcuentas != null)
                        {
                            foreach (var sub in cuenta.Subcuentas)
                            {
                                AddAccount(sub.Codigo, sub.Nombre, cuenta.Nombre);
                                if (sub.Divisionarias != null)
                                {
                                    foreach (var div in sub.Divisionarias)
                                    {
                                        AddAccount(div.Codigo, div.Nombre, sub.Nombre);
                                        if (div.Subdivisionarias != null)
                                        {
                                            foreach (var sdiv in div.Subdivisionarias)
                                            {
                                                AddAccount(sdiv.Codigo, sdiv.Nombre, div.Nombre);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Filter by q (code or name) case-insensitive; also allow numeric matching on codes
            var qLower = q.Trim().ToLowerInvariant();
            var qDigits = new string(qLower.Where(char.IsDigit).ToArray());

            var filtered = items.Where(it =>
            {
                var code = it.Code ?? string.Empty;
                var name = it.Name ?? string.Empty;

                // direct contains on code or name (case-insensitive)
                if (code.IndexOf(qLower, StringComparison.InvariantCultureIgnoreCase) >= 0) return true;
                if (name.IndexOf(qLower, StringComparison.InvariantCultureIgnoreCase) >= 0) return true;

                // if query has digits, match against digits-only version of code (handles formatting)
                if (!string.IsNullOrEmpty(qDigits))
                {
                    var codeDigits = new string(code.Where(char.IsDigit).ToArray());
                    if (!string.IsNullOrEmpty(codeDigits) && codeDigits.Contains(qDigits)) return true;
                }

                return false;
            });

            // Apply limit default
            var max = limit.HasValue && limit.Value > 0 ? limit.Value : 10;
            var result = filtered.Take(max).ToList();

            return Ok(new { items = result });
        }

        // Helper: compute path to pcge.json (same logic as Program.cs)
        private string GetPcgeFilePath()
        {
            // The Program.cs loads ../.. /pcge.json relative to ContentRootPath
            return Path.Combine(_env.ContentRootPath, "..", "..", "pcge.json");
        }

        private async Task SavePcgeToFileAsync(CancellationToken ct = default)
        {
            try
            {
                if (_pcgeData == null) return;
                var path = GetPcgeFilePath();
                var options = new JsonSerializerOptions { WriteIndented = true };
                var json = JsonSerializer.Serialize(_pcgeData, options);
                await System.IO.File.WriteAllTextAsync(path, json, ct);
            }
            catch
            {
                // Best-effort persist; ignore failures to avoid breaking the API.
            }
        }

        // Natural-ish comparer for account codes: prefer numeric digit comparison when possible
        private static int CompareCodes(string a, string b)
        {
            if (a == null) a = string.Empty;
            if (b == null) b = string.Empty;

            var aDigits = new string(a.Where(char.IsDigit).ToArray());
            var bDigits = new string(b.Where(char.IsDigit).ToArray());

            if (!string.IsNullOrEmpty(aDigits) && !string.IsNullOrEmpty(bDigits))
            {
                if (BigInteger.TryParse(aDigits, out var an) && BigInteger.TryParse(bDigits, out var bn))
                {
                    var cmp = an.CompareTo(bn);
                    if (cmp != 0) return cmp;
                }
            }

            return string.Compare(a, b, StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Add a new top-level category to the PCGE (codigo + nombre).
        /// The new category will be inserted and the list re-ordered by code.
        /// Persisted back to pcge.json on success (best-effort).
        /// </summary>
        [HttpPost("category")]
        public async Task<IActionResult> AddCategory([FromBody] AddCategoryRequest req, CancellationToken ct)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Codigo) || string.IsNullOrWhiteSpace(req.Nombre))
                return BadRequest(new { message = "Codigo and Nombre are required." });

            if (_pcgeData.Cuentas == null) _pcgeData.Cuentas = new List<PcgeCategory>();

            if (_pcgeData.Cuentas.Any(c => string.Equals(c.Codigo, req.Codigo, StringComparison.OrdinalIgnoreCase)))
                return Conflict(new { message = "Category with the same codigo already exists." });

            var cat = new PcgeCategory { Codigo = req.Codigo, Nombre = req.Nombre, Descripcion = req.Descripcion ?? string.Empty, Cuentas = new List<PcgeCuenta>() };
            _pcgeData.Cuentas.Add(cat);

            // reorder
            _pcgeData.Cuentas = _pcgeData.Cuentas.OrderBy(c => c.Codigo, StringComparer.Create(System.Globalization.CultureInfo.InvariantCulture, true)).ToList();

            await SavePcgeToFileAsync(ct);

            return CreatedAtAction(nameof(GetPcgeAccounts), new { }, cat);
        }

        /// <summary>
        /// Add a new cuenta under an existing category.
        /// </summary>
        [HttpPost("cuenta")]
        public async Task<IActionResult> AddCuenta([FromBody] AddCuentaRequest req, CancellationToken ct)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.CategoryCodigo) || string.IsNullOrWhiteSpace(req.Codigo) || string.IsNullOrWhiteSpace(req.Nombre))
                return BadRequest(new { message = "CategoryCodigo, Codigo and Nombre are required." });

            var category = _pcgeData.Cuentas?.FirstOrDefault(c => string.Equals(c.Codigo, req.CategoryCodigo, StringComparison.OrdinalIgnoreCase));
            if (category == null) return NotFound(new { message = "Category not found." });

            if (category.Cuentas == null) category.Cuentas = new List<PcgeCuenta>();
            if (category.Cuentas.Any(x => string.Equals(x.Codigo, req.Codigo, StringComparison.OrdinalIgnoreCase)))
                return Conflict(new { message = "Cuenta with the same codigo already exists in this category." });

            var cuenta = new PcgeCuenta { Codigo = req.Codigo, Nombre = req.Nombre, Descripcion = req.Descripcion ?? string.Empty, Subcuentas = new List<PcgeSubcuenta>() };
            category.Cuentas.Add(cuenta);

            // reorder by Codigo using numeric-aware comparison
            category.Cuentas = category.Cuentas.OrderBy(x => x.Codigo, StringComparer.Create(System.Globalization.CultureInfo.InvariantCulture, true)).ToList();

            await SavePcgeToFileAsync(ct);

            return CreatedAtAction(nameof(GetPcgeAccounts), new { }, cuenta);
        }

        /// <summary>
        /// Add a new subcuenta under an existing cuenta (within a category).
        /// </summary>
        [HttpPost("subcuenta")]
        public async Task<IActionResult> AddSubcuenta([FromBody] AddSubcuentaRequest req, CancellationToken ct)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.CategoryCodigo) || string.IsNullOrWhiteSpace(req.CuentaCodigo) || string.IsNullOrWhiteSpace(req.Codigo) || string.IsNullOrWhiteSpace(req.Nombre))
                return BadRequest(new { message = "CategoryCodigo, CuentaCodigo, Codigo and Nombre are required." });

            var category = _pcgeData.Cuentas?.FirstOrDefault(c => string.Equals(c.Codigo, req.CategoryCodigo, StringComparison.OrdinalIgnoreCase));
            if (category == null) return NotFound(new { message = "Category not found." });

            var cuenta = category.Cuentas?.FirstOrDefault(x => string.Equals(x.Codigo, req.CuentaCodigo, StringComparison.OrdinalIgnoreCase));
            if (cuenta == null) return NotFound(new { message = "Cuenta not found." });

            if (cuenta.Subcuentas == null) cuenta.Subcuentas = new List<PcgeSubcuenta>();
            if (cuenta.Subcuentas.Any(x => string.Equals(x.Codigo, req.Codigo, StringComparison.OrdinalIgnoreCase)))
                return Conflict(new { message = "Subcuenta with the same codigo already exists in this cuenta." });

            var sub = new PcgeSubcuenta { Codigo = req.Codigo, Nombre = req.Nombre, Descripcion = req.Descripcion ?? string.Empty, Divisionarias = new List<PcgeDivisionaria>() };
            cuenta.Subcuentas.Add(sub);

            cuenta.Subcuentas = cuenta.Subcuentas.OrderBy(x => x.Codigo, StringComparer.Create(System.Globalization.CultureInfo.InvariantCulture, true)).ToList();

            await SavePcgeToFileAsync(ct);

            return CreatedAtAction(nameof(GetPcgeAccounts), new { }, sub);
        }

        [HttpPost("register-invoice")]
        public async Task<IActionResult> RegisterInvoice([FromBody] RegisterInvoiceRequest request)
        {
            // Basic validation
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Create RegisteredInvoice
            var registeredInvoice = new RegisteredInvoice
            {
                DocumentType = request.DocumentType,
                DocumentNumber = request.DocumentNumber,
                Date = request.Date,
                Ruc = request.Ruc,
                PartyName = request.PartyName,
                TotalAmount = request.TotalAmount,
                TaxAmount = request.TaxAmount,
                Currency = request.Currency,
                InvoiceType = request.InvoiceType,
                OcrData = request.OcrData != null ? JsonSerializer.Serialize(request.OcrData) : null
            };

            _context.RegisteredInvoices.Add(registeredInvoice);

            // Generate Journal Entries (simplified example)
            // This is where the core accounting logic and "amarres" would go.
            // For a real system, this would be much more complex, involving rules
            // based on invoice type, items, taxes, etc., and mapping to PCGE accounts.

            var journalEntry = new JournalEntry
            {
                RegisteredInvoice = registeredInvoice,
                EntryDate = DateTime.UtcNow,
                Description = $"Registro de factura {request.DocumentType} {request.DocumentNumber}"
            };

            // Example: Simple entry for a purchase invoice
            if (request.InvoiceType.ToLower() == "purchase")
            {
                // Debit: Expense/Asset account (e.g., 60 - Compras, or 20 - Mercaderías)
                // Credit: Accounts Payable (e.g., 42 - Cuentas por Pagar Comerciales - Terceros)

                journalEntry.EntryLines.Add(new JournalEntryLine
                {
                    AccountCode = "60", // Example: Compras
                    AccountName = "Compras",
                    Debit = request.TotalAmount - request.TaxAmount,
                    Credit = 0
                });
                journalEntry.EntryLines.Add(new JournalEntryLine
                {
                    AccountCode = "40", // Example: Tributos por Pagar
                    AccountName = "Tributos por Pagar",
                    Debit = request.TaxAmount,
                    Credit = 0
                });
                journalEntry.EntryLines.Add(new JournalEntryLine
                {
                    AccountCode = "42", // Example: Cuentas por Pagar Comerciales - Terceros
                    AccountName = "Cuentas por Pagar Comerciales - Terceros",
                    Debit = 0,
                    Credit = request.TotalAmount
                });
            }
            else if (request.InvoiceType.ToLower() == "sale")
            {
                // Debit: Accounts Receivable (e.g., 12 - Cuentas por Cobrar Comerciales - Terceros)
                // Credit: Revenue (e.g., 70 - Ventas)

                journalEntry.EntryLines.Add(new JournalEntryLine
                {
                    AccountCode = "12", // Example: Cuentas por Cobrar Comerciales - Terceros
                    AccountName = "Cuentas por Cobrar Comerciales - Terceros",
                    Debit = request.TotalAmount,
                    Credit = 0
                });
                journalEntry.EntryLines.Add(new JournalEntryLine
                {
                    AccountCode = "70", // Example: Ventas
                    AccountName = "Ventas",
                    Debit = 0,
                    Credit = request.TotalAmount - request.TaxAmount
                });
                journalEntry.EntryLines.Add(new JournalEntryLine
                {
                    AccountCode = "40", // Example: Tributos por Pagar (IGV)
                    AccountName = "Tributos por Pagar (IGV)",
                    Debit = 0,
                    Credit = request.TaxAmount
                });
            }

            _context.JournalEntries.Add(journalEntry);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Invoice registered and journal entries created successfully.", invoiceId = registeredInvoice.Id });
        }

        [HttpGet("journal-entries")]
        public async Task<IActionResult> GetJournalEntries()
        {
            var entries = await _context.JournalEntries
                .Include(je => je.RegisteredInvoice)
                .Include(je => je.EntryLines)
                .ToListAsync();

            return Ok(entries);
        }
    }

    // DTO for flattened account items
    public class AccountItemDto
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    // Request DTOs
    public class RegisterInvoiceRequest
    {
        [Required]
        public string DocumentType { get; set; } = string.Empty;
        [Required]
        public string DocumentNumber { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        [Required]
        public string Ruc { get; set; } = string.Empty;
        public string PartyName { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public decimal TaxAmount { get; set; }
        public string Currency { get; set; } = string.Empty;
        [Required]
        public string InvoiceType { get; set; } = string.Empty; // "Sale" or "Purchase"
        public JsonElement? OcrData { get; set; }
    }

    // Add/modify PCGE requests
    public class AddCategoryRequest
    {
        public string Codigo { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
    }

    public class AddCuentaRequest
    {
        public string CategoryCodigo { get; set; } = string.Empty;
        public string Codigo { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
    }

    public class AddSubcuentaRequest
    {
        public string CategoryCodigo { get; set; } = string.Empty;
        public string CuentaCodigo { get; set; } = string.Empty;
        public string Codigo { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
    }
}
