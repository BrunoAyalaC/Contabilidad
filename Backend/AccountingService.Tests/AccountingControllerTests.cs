using Xunit;
using AccountingService.Controllers;
using AccountingService.Data;
using AccountingService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Collections.Generic;

namespace AccountingService.Tests
{
    public class AccountingControllerTests
    {
        private AccountingDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AccountingDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new AccountingDbContext(options);
        }

        private PcgePlanContable GetMockPcgeData()
        {
            return new PcgePlanContable
            {
                Cuentas = new List<PcgeCuenta>
                {
                    new PcgeCuenta { Codigo = "12", Nombre = "CUENTAS POR COBRAR COMERCIALES - TERCEROS", Subcuentas = new List<PcgeSubcuenta>() },
                    new PcgeCuenta { Codigo = "40", Nombre = "TRIBUTOS POR PAGAR", Subcuentas = new List<PcgeSubcuenta>() },
                    new PcgeCuenta { Codigo = "42", Nombre = "CUENTAS POR PAGAR COMERCIALES - TERCEROS", Subcuentas = new List<PcgeSubcuenta>() },
                    new PcgeCuenta { Codigo = "60", Nombre = "COMPRAS", Subcuentas = new List<PcgeSubcuenta>() },
                    new PcgeCuenta { Codigo = "70", Nombre = "VENTAS", Subcuentas = new List<PcgeSubcuenta>() }
                }
            };
        }

        [Fact]
        public async Task GetPcgeAccounts_ShouldReturnAllAccounts()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var pcgeData = GetMockPcgeData();
            var controller = new AccountingController(context, pcgeData);

            // Act
            var result = controller.GetPcgeAccounts();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var accounts = Assert.IsType<List<PcgeCuenta>>(okResult.Value);
            Assert.Equal(5, accounts.Count);
        }

        [Fact]
        public async Task RegisterInvoice_ShouldCreateInvoiceAndJournalEntries_ForPurchase()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var pcgeData = GetMockPcgeData();
            var controller = new AccountingController(context, pcgeData);
            var request = new RegisterInvoiceRequest
            {
                DocumentType = "FACTURA",
                DocumentNumber = "F001-0001",
                Date = DateTime.Parse("2025-01-15"),
                Ruc = "12345678901",
                PartyName = "Proveedor ABC",
                TotalAmount = 118.00m,
                TaxAmount = 18.00m,
                Currency = "PEN",
                InvoiceType = "Purchase",
                OcrData = JsonDocument.Parse("{ \"field1\": \"value1\" }").RootElement
            };

            // Act
            var result = await controller.RegisterInvoice(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
            Assert.Equal("Invoice registered and journal entries created successfully.", (okResult.Value as dynamic).message);

            var registeredInvoice = await context.RegisteredInvoices.SingleOrDefaultAsync(ri => ri.DocumentNumber == "F001-0001");
            Assert.NotNull(registeredInvoice);
            Assert.Equal(118.00m, registeredInvoice.TotalAmount);

            var journalEntry = await context.JournalEntries.Include(je => je.EntryLines).SingleOrDefaultAsync(je => je.RegisteredInvoiceId == registeredInvoice.Id);
            Assert.NotNull(journalEntry);
            Assert.Equal(3, journalEntry.EntryLines.Count);
            Assert.Equal(100.00m, journalEntry.EntryLines.Where(el => el.AccountCode == "60").Sum(el => el.Debit));
            Assert.Equal(18.00m, journalEntry.EntryLines.Where(el => el.AccountCode == "40").Sum(el => el.Debit));
            Assert.Equal(118.00m, journalEntry.EntryLines.Where(el => el.AccountCode == "42").Sum(el => el.Credit));
        }

        [Fact]
        public async Task RegisterInvoice_ShouldCreateInvoiceAndJournalEntries_ForSale()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var pcgeData = GetMockPcgeData();
            var controller = new AccountingController(context, pcgeData);
            var request = new RegisterInvoiceRequest
            {
                DocumentType = "BOLETA",
                DocumentNumber = "B001-0001",
                Date = DateTime.Parse("2025-01-16"),
                Ruc = "10123456789",
                PartyName = "Cliente XYZ",
                TotalAmount = 236.00m,
                TaxAmount = 36.00m,
                Currency = "PEN",
                InvoiceType = "Sale",
                OcrData = null
            };

            // Act
            var result = await controller.RegisterInvoice(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);

            var registeredInvoice = await context.RegisteredInvoices.SingleOrDefaultAsync(ri => ri.DocumentNumber == "B001-0001");
            Assert.NotNull(registeredInvoice);

            var journalEntry = await context.JournalEntries.Include(je => je.EntryLines).SingleOrDefaultAsync(je => je.RegisteredInvoiceId == registeredInvoice.Id);
            Assert.NotNull(journalEntry);
            Assert.Equal(3, journalEntry.EntryLines.Count);
            Assert.Equal(236.00m, journalEntry.EntryLines.Where(el => el.AccountCode == "12").Sum(el => el.Debit));
            Assert.Equal(200.00m, journalEntry.EntryLines.Where(el => el.AccountCode == "70").Sum(el => el.Credit));
            Assert.Equal(36.00m, journalEntry.EntryLines.Where(el => el.AccountCode == "40").Sum(el => el.Credit));
        }

        [Fact]
        public async Task GetJournalEntries_ShouldReturnAllEntries()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var pcgeData = GetMockPcgeData();
            var controller = new AccountingController(context, pcgeData);

            // Seed data
            var invoice = new RegisteredInvoice
            {
                DocumentType = "FACTURA", DocumentNumber = "TEST-001", Date = DateTime.Now, Ruc = "123", PartyName = "Test", TotalAmount = 100, TaxAmount = 18, Currency = "PEN", InvoiceType = "Purchase"
            };
            context.RegisteredInvoices.Add(invoice);
            var entry = new JournalEntry
            {
                RegisteredInvoice = invoice, Description = "Test Entry", EntryLines = new List<JournalEntryLine>
                {
                    new JournalEntryLine { AccountCode = "60", AccountName = "Compras", Debit = 82, Credit = 0 },
                    new JournalEntryLine { AccountCode = "40", AccountName = "IGV", Debit = 18, Credit = 0 },
                    new JournalEntryLine { AccountCode = "42", AccountName = "Cuentas por Pagar", Debit = 0, Credit = 100 }
                }
            };
            context.JournalEntries.Add(entry);
            await context.SaveChangesAsync();

            // Act
            var result = await controller.GetJournalEntries();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var entries = Assert.IsType<List<JournalEntry>>(okResult.Value);
            Assert.Single(entries);
            Assert.Equal("TEST-001", entries[0].RegisteredInvoice.DocumentNumber);
            Assert.Equal(3, entries[0].EntryLines.Count);
        }
    }
}