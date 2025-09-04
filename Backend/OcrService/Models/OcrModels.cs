using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OcrService.Models
{
    /// <summary>
    /// Structured representation of an extracted invoice.
    /// </summary>
    public class ParsedInvoiceData
    {
        /// <summary>Invoice identifier extracted from the document (when available).</summary>
        public string? InvoiceNumber { get; set; }
        /// <summary>Invoice date if parsable.</summary>
        public DateTime? InvoiceDate { get; set; }
        /// <summary>RUC (tax identifier) if found.</summary>
        public string? Ruc { get; set; }
        /// <summary>Supplier or customer name when detected.</summary>
        public string? PartyName { get; set; }
        /// <summary>Total amount parsed from the invoice.</summary>
        public decimal? TotalAmount { get; set; }
        /// <summary>Tax amount parsed (IGV/IVA).</summary>
        public decimal? TaxAmount { get; set; }
        /// <summary>Currency code (e.g., PEN, USD).</summary>
        public string? Currency { get; set; }
        /// <summary>Document classification (FACTURA, BOLETA, etc.).</summary>
        public string? DocumentType { get; set; }
        /// <summary>Extracted line items (if any).</summary>
        public List<ParsedInvoiceLine>? LineItems { get; set; }
        /// <summary>
        /// Confidence per field (0..1).
        /// </summary>
        public Dictionary<string, decimal>? ConfidenceScores { get; set; }
    }

    /// <summary>
    /// Line item extracted from an invoice.
    /// </summary>
    public class ParsedInvoiceLine
    {
        /// <summary>Item description or product name.</summary>
        public string? Description { get; set; }
        /// <summary>Quantity parsed (nullable).</summary>
        public decimal? Quantity { get; set; }
        /// <summary>Unit price parsed (nullable).</summary>
        public decimal? UnitPrice { get; set; }
        /// <summary>Total line amount.</summary>
        public decimal? Total { get; set; }
    }
}
