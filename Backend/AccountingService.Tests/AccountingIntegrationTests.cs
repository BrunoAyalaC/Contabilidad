using Xunit;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;
using System.Text;
using AccountingService.Controllers;
using AccountingService.Models;
using System.Net;
using System.Collections.Generic;
using System.Text.Json;

namespace AccountingService.Tests
{
    public class AccountingIntegrationTests : IClassFixture<CustomWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory<Program> _factory;

        public AccountingIntegrationTests(CustomWebApplicationFactory<Program> factory)
        {
            _factory = factory;
            _client = _factory.CreateClient();
        }

        [Fact]
        public async Task GetPcgeAccounts_Endpoint_ReturnsOk()
        {
            // Arrange

            // Act
            var response = await _client.GetAsync("/api/Accounting/accounts");

            // Assert
            response.EnsureSuccessStatusCode(); // Status Code 200-299
            var responseString = await response.Content.ReadAsStringAsync();
            var accounts = JsonConvert.DeserializeObject<List<PcgeCuenta>>(responseString);
            Assert.NotNull(accounts);
            Assert.True(accounts.Any());
        }

        [Fact]
        public async Task RegisterInvoice_Endpoint_ReturnsOk_ForValidRequest()
        {
            // Arrange
            var request = new RegisterInvoiceRequest
            {
                DocumentType = "FACTURA",
                DocumentNumber = "INV-001",
                Date = DateTime.Parse("2025-01-20"),
                Ruc = "12345678901",
                PartyName = "Test Supplier",
                TotalAmount = 118.00m,
                TaxAmount = 18.00m,
                Currency = "PEN",
                InvoiceType = "Purchase",
                OcrData = JsonDocument.Parse("{ \"someField\": \"someValue\" }").RootElement
            };
            var jsonContent = new StringContent(JsonConvert.SerializeObject(request), Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/Accounting/register-invoice", jsonContent);

            // Assert
            response.EnsureSuccessStatusCode();
            var responseString = await response.Content.ReadAsStringAsync();
            Assert.Contains("Invoice registered and journal entries created successfully.", responseString);
        }

        [Fact]
        public async Task GetJournalEntries_Endpoint_ReturnsOk()
        {
            // Arrange: Register an invoice first
            var registerRequest = new RegisterInvoiceRequest
            {
                DocumentType = "FACTURA",
                DocumentNumber = "INV-002",
                Date = DateTime.Parse("2025-01-21"),
                Ruc = "12345678901",
                PartyName = "Test Supplier 2",
                TotalAmount = 236.00m,
                TaxAmount = 36.00m,
                Currency = "PEN",
                InvoiceType = "Sale",
                OcrData = null
            };
            var registerContent = new StringContent(JsonConvert.SerializeObject(registerRequest), Encoding.UTF8, "application/json");
            await _client.PostAsync("/api/Accounting/register-invoice", registerContent);

            // Act
            var response = await _client.GetAsync("/api/Accounting/journal-entries");

            // Assert
            response.EnsureSuccessStatusCode();
            var responseString = await response.Content.ReadAsStringAsync();
            var entries = JsonConvert.DeserializeObject<List<JournalEntry>>(responseString);
            Assert.NotNull(entries);
            Assert.True(entries.Any());
            Assert.Equal("INV-002", entries.First().RegisteredInvoice.DocumentNumber);
        }
    }
}
