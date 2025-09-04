using Xunit;
using OcrService.Controllers;
using OcrService.Data;
using OcrService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using System.IO;
using System.Threading.Tasks;
using System;
using Microsoft.AspNetCore.Http;
using System.Text.Json;
using System.Diagnostics;

namespace OcrService.Tests
{
    public class OcrControllerTests
    {
        private OcrDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<OcrDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new OcrDbContext(options);
        }

        private OcrController CreateOcrController(OcrDbContext context, string tempUploadPath, ILogger<OcrController> logger = null)
        {
            if (logger == null)
            {
                var mockLogger = new Mock<ILogger<OcrController>>();
                logger = mockLogger.Object;
            }
            return new OcrController(context, tempUploadPath, logger);
        }

        [Fact]
        public async Task UploadInvoiceForOcr_ShouldReturnOkAndCreateJob()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var tempPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
            Directory.CreateDirectory(tempPath);
            var controller = CreateOcrController(context, tempPath);

            var mockFile = new Mock<IFormFile>();
            var fileName = "test.pdf";
            var content = "This is a test PDF content.";
            var ms = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(content));
            mockFile.Setup(f => f.FileName).Returns(fileName);
            mockFile.Setup(f => f.Length).Returns(ms.Length);
            mockFile.Setup(f => f.OpenReadStream()).Returns(ms);
            mockFile.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), System.Threading.CancellationToken.None))
                    .Returns((Stream stream, System.Threading.CancellationToken token) => ms.CopyToAsync(stream));

            // Act
            var result = await controller.UploadInvoiceForOcr(mockFile.Object);

            // Assert
            var okResult = Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
            Assert.Equal("Pending", (okResult.Value as dynamic).status);
            Assert.True(await context.OcrJobs.AnyAsync(j => j.FileName == fileName));

            // Clean up
            Directory.Delete(tempPath, true);
        }

        [Fact]
        public async Task GetOcrJobStatus_ShouldReturnJobDetails()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var tempPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
            Directory.CreateDirectory(tempPath);
            var controller = CreateOcrController(context, tempPath);

            var jobId = Guid.NewGuid();
            var ocrJob = new OcrJob
            {
                Id = jobId,
                FileName = "sample.pdf",
                FilePath = Path.Combine(tempPath, "sample.pdf"),
                Status = "Completed",
                ParsedData = JsonSerializer.Serialize(new ParsedInvoiceData { InvoiceNumber = "INV-001" }),
                Confidence = 0.9m
            };
            context.OcrJobs.Add(ocrJob);
            await context.SaveChangesAsync();

            // Act
            var result = await controller.GetOcrJobStatus(jobId);

            // Assert
            var okResult = Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
            Assert.Equal("Completed", (okResult.Value as dynamic).status);
            Assert.Equal("INV-001", (okResult.Value as dynamic).parsedData.InvoiceNumber);

            // Clean up
            Directory.Delete(tempPath, true);
        }

        // Note: Testing ProcessOcrJob directly is complex due to external process dependency.
        // It's often better to test the controller's interaction with a mocked service that handles process execution.
        // For this example, we'll rely on integration tests to cover the full flow.
    }
}
