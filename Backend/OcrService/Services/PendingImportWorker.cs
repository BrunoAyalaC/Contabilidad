using Microsoft.Extensions.Hosting;
using System.Threading;
using System.Threading.Tasks;
using System.Text.Json;
using System.Text;
using System.Net.Http;
using Microsoft.Extensions.Logging;
using System.IO;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace OcrService.Services
{
    /// <summary>
    /// Background worker that scans the PendingImports directory for queued import files
    /// and retries sending them to the Accounting service. Files are JSON payloads produced by ImportController.
    /// </summary>
    public class PendingImportWorker : BackgroundService
    {
        private readonly ILogger<PendingImportWorker> _logger;
        private readonly IHttpClientFactory _httpFactory;
        private readonly IServiceScopeFactory _scopeFactory;

        public PendingImportWorker(ILogger<PendingImportWorker> logger, IHttpClientFactory httpFactory, IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _httpFactory = httpFactory;
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("PendingImportWorker started, processing DB queued imports");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Create a scope per sweep so we can use scoped DbContext instances safely
                    using (var scope = _scopeFactory.CreateScope())
                    {
                        var db = scope.ServiceProvider.GetRequiredService<OcrService.Data.OcrDbContext>();
                        var pending = await db.PendingImports.OrderBy(p => p.CreatedAt).Take(20).ToListAsync(stoppingToken);
                        foreach (var p in pending)
                        {
                            if (stoppingToken.IsCancellationRequested) break;
                            try
                            {
                                var json = p.Payload;
                                using var doc = JsonDocument.Parse(json);

                                var client = _httpFactory.CreateClient("Accounting");
                                var req = new HttpRequestMessage(HttpMethod.Post, "/api/accounting/register-invoice")
                                {
                                    Content = new StringContent(json, Encoding.UTF8, "application/json")
                                };

                                if (!string.IsNullOrWhiteSpace(p.CorrelationId))
                                {
                                    req.Headers.Add("Idempotency-Key", p.CorrelationId);
                                }

                                var resp = await client.SendAsync(req, stoppingToken);
                                if (resp.IsSuccessStatusCode)
                                {
                                    _logger.LogInformation("Pending import {id} sent successfully, removing from queue.", p.Id);
                                    db.PendingImports.Remove(p);
                                    await db.SaveChangesAsync(stoppingToken);
                                }
                                else
                                {
                                    p.AttemptCount += 1;
                                    _logger.LogWarning("Pending import {id} failed with {status}, attempt {a}", p.Id, resp.StatusCode, p.AttemptCount);
                                    await db.SaveChangesAsync(stoppingToken);
                                }
                            }
                            catch (Exception exFile)
                            {
                                // If we couldn't parse or send, increment attempt count and persist
                                try
                                {
                                    p.AttemptCount += 1;
                                    _logger.LogError(exFile, "Error processing pending import {id}", p.Id);
                                    await db.SaveChangesAsync(stoppingToken);
                                }
                                catch (Exception exSave)
                                {
                                    _logger.LogError(exSave, "Failed to update attempt count for pending import {id}", p.Id);
                                }
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing pending imports from DB");
                }

                // Sleep between sweeps; frequency tuned to 30s for retrying transient failures
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
        }
    }
}
