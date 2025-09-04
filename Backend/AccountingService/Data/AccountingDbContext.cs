using AccountingService.Models;
using Microsoft.EntityFrameworkCore;

namespace AccountingService.Data
{
    public class AccountingDbContext : DbContext
    {
        public AccountingDbContext(DbContextOptions<AccountingDbContext> options) : base(options)
        {
        }

        public DbSet<RegisteredInvoice> RegisteredInvoices { get; set; }
        public DbSet<JournalEntry> JournalEntries { get; set; }
        public DbSet<JournalEntryLine> JournalEntryLines { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<RegisteredInvoice>()
                .HasMany(ri => ri.JournalEntries)
                .WithOne(je => je.RegisteredInvoice)
                .HasForeignKey(je => je.RegisteredInvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<JournalEntry>()
                .HasMany(je => je.EntryLines)
                .WithOne(jel => jel.JournalEntry)
                .HasForeignKey(jel => jel.JournalEntryId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure properties to match SQL Server schema conventions
            modelBuilder.Entity<RegisteredInvoice>(entity =>
            {
                entity.Property(e => e.Id).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            modelBuilder.Entity<JournalEntry>(entity =>
            {
                entity.Property(e => e.Id).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.EntryDate).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            modelBuilder.Entity<JournalEntryLine>(entity =>
            {
                entity.Property(e => e.Id).HasDefaultValueSql("NEWID()");
            });
        }
    }
}
