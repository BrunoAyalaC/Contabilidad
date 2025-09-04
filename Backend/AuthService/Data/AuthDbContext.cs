using AuthService.Models;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Data
{
    public class AuthDbContext : DbContext
    {
        public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>()
                .HasMany(u => u.RefreshTokens)
                .WithOne(rt => rt.User)
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure properties to match SQL Server schema
            modelBuilder.Entity<User>(entity =>
            {
                // Id is int in existing DB; do not set NEWID() default
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                entity.Property(e => e.IsActive).HasDefaultValue(true);
            });

            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.Property(e => e.IssuedAt).HasDefaultValueSql("SYSUTCDATETIME()");
                entity.Property(e => e.Revoked).HasDefaultValue(false);
            });
        }
    }
}
