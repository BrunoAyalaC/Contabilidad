using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text;
using OcrService.Models;

namespace OcrService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ImportController : ControllerBase
    {
        private readonly IHttpClientFactory _httpFactory;
        private readonly ILogger<ImportController> _logger;
        private readonly OcrService.Data.OcrDbContext _db;

        public ImportController(IHttpClientFactory httpFactory, ILogger<ImportController> logger, OcrService.Data.OcrDbContext db)
        {
            _httpFactory = httpFactory;
            _logger = logger;
            _db = db;
        }

        [HttpPost("invoices/import")]
        public async Task<IActionResult> ImportInvoice([FromBody] InvoiceImportDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Missing body" });

            // Basic validation with explicit missing-field diagnostics to help frontend avoid 400s
            var missingFields = new List<string>();
            if (string.IsNullOrWhiteSpace(dto.Ruc)) missingFields.Add(nameof(dto.Ruc));
            if (string.IsNullOrWhiteSpace(dto.DocumentNumber)) missingFields.Add(nameof(dto.DocumentNumber));
            if (dto.TotalAmount <= 0) missingFields.Add(nameof(dto.TotalAmount));

            if (missingFields.Any())
            {
                return BadRequest(new { message = "Required fields missing or invalid.", missingFields });
            }

            try
            {
                var client = _httpFactory.CreateClient("Accounting");

                var registerReq = new
                {
                    DocumentType = dto.DocumentType ?? "FACTURA",
                    DocumentNumber = dto.DocumentNumber,
                    Date = dto.Date,
                    Ruc = dto.Ruc,
                    PartyName = dto.PartyName,
                    TotalAmount = dto.TotalAmount,
                    TaxAmount = dto.TaxAmount,
                    Currency = dto.Currency ?? "PEN",
                    InvoiceType = dto.InvoiceType ?? "Purchase",
                    OcrData = dto.OcrData
                };

                var json = JsonSerializer.Serialize(registerReq);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                // Use correlation id as idempotency
                var idempotencyKey = dto.CorrelationId ?? Guid.NewGuid().ToString();
                content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

                var request = new HttpRequestMessage(HttpMethod.Post, "/api/accounting/register-invoice")
                {
                    Content = content
                };
                request.Headers.Add("Idempotency-Key", idempotencyKey);

                try
                {
                    var resp = await client.SendAsync(request);
                    var respBody = await resp.Content.ReadAsStringAsync();

                    if (!resp.IsSuccessStatusCode)
                    {
                        _logger.LogWarning("Accounting call failed: {Status} {Body}. Queuing import.", resp.StatusCode, respBody);

                        // Persist the payload to DB for retry by background worker
                        try
                        {
                            var pending = new OcrService.Models.PendingImport
                            {
                                Id = Guid.NewGuid(),
                                CorrelationId = idempotencyKey,
                                Payload = json,
                                CreatedAt = DateTime.UtcNow,
                                AttemptCount = 0
                            };
                            _db.PendingImports.Add(pending);
                            await _db.SaveChangesAsync();

                            var location = $"/api/imports/pending/{pending.Id}";
                            return Accepted(location, new { message = "Accounting currently unavailable. Import queued for retry.", queuedId = pending.Id });
                        }
                        catch (Exception exPersist)
                        {
                            _logger.LogError(exPersist, "Failed to persist queued import payload to DB.");
                            return StatusCode(503, new { message = "Accounting unavailable and could not queue import." });
                        }
                    }

                    var parsed = JsonSerializer.Deserialize<JsonElement>(respBody);

                    return Ok(new { message = "Imported and sent to Accounting", accountingResponse = parsed });
                }
                catch (HttpRequestException httpEx)
                {
                    _logger.LogWarning(httpEx, "Accounting HTTP request failed (network/connection). Queuing import.");
                    // Persist and queue similarly as above
                    try
                    {
                        var pending = new OcrService.Models.PendingImport
                        {
                            Id = Guid.NewGuid(),
                            CorrelationId = idempotencyKey,
                            Payload = json,
                            CreatedAt = DateTime.UtcNow,
                            AttemptCount = 0
                        };
                        _db.PendingImports.Add(pending);
                        await _db.SaveChangesAsync();

                        var location = $"/api/imports/pending/{pending.Id}";
                        return Accepted(location, new { message = "Accounting unreachable (network). Import queued for retry.", queuedId = pending.Id });
                    }
                    catch (Exception exPersist)
                    {
                        _logger.LogError(exPersist, "Failed to persist queued import payload to DB after network failure.");
                        return StatusCode(503, new { message = "Accounting unreachable and could not queue import." });
                    }
                }
                catch (TaskCanceledException tce)
                {
                    // Timeout
                    _logger.LogWarning(tce, "Accounting request timed out. Queuing import.");
                    try
                    {
                        var pending = new OcrService.Models.PendingImport
                        {
                            Id = Guid.NewGuid(),
                            CorrelationId = idempotencyKey,
                            Payload = json,
                            CreatedAt = DateTime.UtcNow,
                            AttemptCount = 0
                        };
                        _db.PendingImports.Add(pending);
                        await _db.SaveChangesAsync();

                        var location = $"/api/imports/pending/{pending.Id}";
                        return Accepted(location, new { message = "Accounting request timed out. Import queued for retry.", queuedId = pending.Id });
                    }
                    catch (Exception exPersist)
                    {
                        _logger.LogError(exPersist, "Failed to persist queued import payload to DB after timeout.");
                        return StatusCode(503, new { message = "Accounting timeout and could not queue import." });
                    }
                }
                catch (Polly.CircuitBreaker.BrokenCircuitException bce)
                {
                    // Circuit open: treat as transient/unavailable and queue the import
                    _logger.LogWarning(bce, "Circuit breaker open for Accounting. Queuing import.");
                    try
                    {
                        var pending = new OcrService.Models.PendingImport
                        {
                            Id = Guid.NewGuid(),
                            CorrelationId = idempotencyKey,
                            Payload = json,
                            CreatedAt = DateTime.UtcNow,
                            AttemptCount = 0
                        };
                        _db.PendingImports.Add(pending);
                        await _db.SaveChangesAsync();

                        var location = $"/api/imports/pending/{pending.Id}";
                        return Accepted(location, new { message = "Accounting circuit open. Import queued for retry.", queuedId = pending.Id });
                    }
                    catch (Exception exPersist)
                    {
                        _logger.LogError(exPersist, "Failed to persist queued import payload to DB after circuit opened.");
                        return StatusCode(503, new { message = "Accounting unavailable and could not queue import." });
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing invoice to accounting");
                return StatusCode(500, new { message = "Internal error", detail = ex.Message });
            }
        }

        // List pending queued imports (from DB)
        [HttpGet("pending")]
        public async Task<IActionResult> ListPending()
        {
            try
            {
                var items = await _db.PendingImports.OrderBy(p => p.CreatedAt).Select(p => new { p.Id, p.CorrelationId, p.CreatedAt, p.AttemptCount }).ToListAsync();
                return Ok(new { pending = items });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing pending imports");
                return StatusCode(500, new { message = "Error listing pending imports" });
            }
        }

        [HttpGet("pending/{id:guid}")]
        public async Task<IActionResult> GetPending(Guid id)
        {
            try
            {
                var item = await _db.PendingImports.FindAsync(id);
                if (item == null) return NotFound();
                return Ok(new { item.Id, item.CorrelationId, item.Payload, item.CreatedAt, item.AttemptCount });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading pending import {id}", id);
                return StatusCode(500, new { message = "Error reading pending import" });
            }
        }
    }

    public class InvoiceImportDto
    {
        public string? CorrelationId { get; set; }
        public string? DocumentType { get; set; }
        public string? DocumentNumber { get; set; }
        public DateTime Date { get; set; }
        public string? Ruc { get; set; }
        public string? PartyName { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal TaxAmount { get; set; }
        public string? Currency { get; set; }
        public string? InvoiceType { get; set; }
        public JsonElement? OcrData { get; set; }
    }
}
