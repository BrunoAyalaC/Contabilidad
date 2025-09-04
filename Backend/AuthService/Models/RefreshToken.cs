using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuthService.Models
{
    public class RefreshToken
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Required]
        [MaxLength(512)]
        public required string TokenHash { get; set; }

        public bool Revoked { get; set; } = false;

        public DateTimeOffset IssuedAt { get; set; } = DateTimeOffset.UtcNow;

        public DateTimeOffset? ExpiresAt { get; set; }

        [MaxLength(100)]
        public string? Ip { get; set; }

        [MaxLength(1000)]
        public string? UserAgent { get; set; }
    }
}
