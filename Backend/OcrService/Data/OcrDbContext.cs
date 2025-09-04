using Microsoft.EntityFrameworkCore;
using OcrService.Models;

namespace OcrService.Data
{
    public class OcrDbContext : DbContext
    {
        public OcrDbContext(DbContextOptions<OcrDbContext> options) : base(options)
        {
        }

        public DbSet<PendingImport> PendingImports { get; set; } = null!;
    }
}
