using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OcrService.Models
{
    public class PendingImport
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string CorrelationId { get; set; } = string.Empty;

        [Required]
        public string Payload { get; set; } = string.Empty; // JSON payload

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int AttemptCount { get; set; } = 0;
    }
}
