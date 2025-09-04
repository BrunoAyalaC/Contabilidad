using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuthService.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(255)]
        public required string Username { get; set; }

        [MaxLength(320)]
        public string? Email { get; set; }

        [Required]
        [MaxLength(512)]
        public required string PasswordHash { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

        [Column(TypeName = "nvarchar(max)")]
        public string? Profile { get; set; } // JSON stored as NVARCHAR(MAX)

        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    }
}
