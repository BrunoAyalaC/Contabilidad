using System;
using System.Text.Json;

namespace OcrService.Models
{
    public class OcrJobStatusResponse
    {
        public Guid JobId { get; set; }
        public string? FileName { get; set; }
        public string? Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string? ErrorMessage { get; set; }
        public ParsedInvoiceData? ParsedData { get; set; }
        public decimal Confidence { get; set; }
    }
}
