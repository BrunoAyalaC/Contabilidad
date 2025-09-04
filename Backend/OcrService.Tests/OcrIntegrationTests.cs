using Xunit;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;
using System.Text;
using OcrService.Controllers;
using OcrService.Models;
using System.Net;
using System.IO;
using Microsoft.AspNetCore.Http;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using OcrService.Data;

namespace OcrService.Tests
{
    public class OcrIntegrationTests : IClassFixture<CustomWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory<Program> _factory;

        public OcrIntegrationTests(CustomWebApplicationFactory<Program> factory)
        {
            _factory = factory;
            _client = _factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false
            });
        }

        [Fact]
        public async Task UploadInvoiceForOcr_Endpoint_ReturnsOk_AndCreatesJob()
        {
            // Arrange
            var filePath = Path.Combine(Path.GetTempPath(), "test_invoice.pdf");
            await File.WriteAllBytesAsync(filePath, Encoding.UTF8.GetBytes("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R>>endobj 4 0 obj<</Length 11>>stream\nBT/F1 12 Tf 100 700 Td(Hello World)Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000059 00000 n\n0000000110 00000 n\n0000000200 00000 n\ntrailer<</Size 5/Root 1 0 R>>startxref\n290\n%%EOF")); // Create a dummy PDF file

            using (var fileStream = File.OpenRead(filePath))
            {
                using var form = new MultipartFormDataContent();
                form.Add(new StreamContent(fileStream), "file", "test_invoice.pdf");

                // Act
                var response = await _client.PostAsync("/api/Ocr/invoices", form);

                // Assert
                response.EnsureSuccessStatusCode();
                var responseString = await response.Content.ReadAsStringAsync();
                dynamic result = JsonConvert.DeserializeObject(responseString);
                Assert.NotNull(result.jobId);
                Assert.Equal("Pending", (string)result.status);
            }

            // Clean up
            File.Delete(filePath);
        }

        [Fact]
        public async Task GetOcrJobStatus_Endpoint_ReturnsJobDetails()
        {
            // Arrange: Create a job directly in the in-memory database
            var jobId = Guid.NewGuid();
            var ocrJob = new OcrJob
            {
                Id = jobId,
                FileName = "test.pdf",
                FilePath = "/path/to/test.pdf",
                Status = "Completed",
                ParsedData = System.Text.Json.JsonSerializer.Serialize(new ParsedInvoiceData { InvoiceNumber = "INV-001" }, new System.Text.Json.JsonSerializerOptions { WriteIndented = true }),
                Confidence = 0.9m
            };

            using (var scope = _factory.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<OcrDbContext>();
                dbContext.OcrJobs.Add(ocrJob);
                await dbContext.SaveChangesAsync();
            }

            // Act
            var response = await _client.GetAsync($"/api/Ocr/invoices/{jobId}");

            // Assert
            response.EnsureSuccessStatusCode();
            var responseString = await response.Content.ReadAsStringAsync();
            var result = System.Text.Json.JsonSerializer.Deserialize<OcrJobStatusResponse>(responseString, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            Assert.NotNull(result);
            Assert.Equal(jobId.ToString(), result.JobId.ToString());
            Assert.Equal("Completed", result.Status);
            Assert.Equal("INV-001", result.ParsedData?.InvoiceNumber);
        }
    }
}