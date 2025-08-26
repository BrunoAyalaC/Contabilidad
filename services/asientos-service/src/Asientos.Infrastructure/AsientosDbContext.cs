using Asientos.Domain;
using Microsoft.EntityFrameworkCore;

namespace Asientos.Infrastructure;

public class AsientosDbContext : DbContext
{
    public AsientosDbContext(DbContextOptions<AsientosDbContext> options) : base(options) { }

    public DbSet<AsientoContable> Asientos { get; set; } = null!;
    public DbSet<DetalleAsiento> DetallesAsiento { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AsientoContable>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Glosa).HasMaxLength(500);
            entity.HasMany(a => a.Detalles)
                  .WithOne()
                  .HasForeignKey(d => d.AsientoContableId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DetalleAsiento>(entity =>
        {
            entity.HasKey(d => d.Id);
            entity.Property(d => d.CuentaCodigo).HasMaxLength(20);
            entity.Property(d => d.Descripcion).HasMaxLength(300);
        });
    }
}
