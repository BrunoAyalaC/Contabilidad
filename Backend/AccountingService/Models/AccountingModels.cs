using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AccountingService.Models
{
    public class RegisteredInvoice
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public string DocumentType { get; set; } // e.g., FACTURA, BOLETA

        [Required]
        public string DocumentNumber { get; set; }

        public DateTime Date { get; set; }

        [Required]
        public string Ruc { get; set; } // RUC of the issuer/receiver

        public string PartyName { get; set; } // Name of the issuer/receiver

        public decimal TotalAmount { get; set; }

        public decimal TaxAmount { get; set; }

        public string Currency { get; set; } = "PEN"; // Peruvian Sol

        public string InvoiceType { get; set; } // e.g., Sale, Purchase

        public string? OcrData { get; set; } // Raw OCR data if available

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<JournalEntry> JournalEntries { get; set; }
    }

    public class JournalEntry
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid RegisteredInvoiceId { get; set; }

        [ForeignKey("RegisteredInvoiceId")]
        public RegisteredInvoice RegisteredInvoice { get; set; }

        public DateTime EntryDate { get; set; } = DateTime.UtcNow;

        public string Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<JournalEntryLine> EntryLines { get; set; } = new List<JournalEntryLine>();
    }

    public class JournalEntryLine
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid JournalEntryId { get; set; }

        [ForeignKey("JournalEntryId")]
        public JournalEntry JournalEntry { get; set; }

        [Required]
        public string AccountCode { get; set; } // PCGE account code

        public string AccountName { get; set; } // PCGE account name

        public decimal Debit { get; set; }

        public decimal Credit { get; set; }
    }
}
