using Microsoft.EntityFrameworkCore;
using PlanContable.Domain.Entities;

namespace PlanContable.Infrastructure.Data;

/// <summary>
/// Contexto de base de datos para el sistema Plan Contable
/// Implementa el patrón Repository y Unit of Work a través de Entity Framework Core
/// </summary>
public class PlanContableDbContext : DbContext
{
    public PlanContableDbContext(DbContextOptions<PlanContableDbContext> options) : base(options)
    {
    }

    // DbSets - Entidades principales
    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<CuentaContable> CuentasContables { get; set; }
    public DbSet<LogAuditoria> LogsAuditoria { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configuración para Usuario
        ConfigurarUsuario(modelBuilder);

        // Configuración para CuentaContable
        ConfigurarCuentaContable(modelBuilder);

        // Configuración para LogAuditoria
        ConfigurarLogAuditoria(modelBuilder);

        // Configurar índices y restricciones adicionales
        ConfigurarIndicesYRestricciones(modelBuilder);
    }

    private void ConfigurarUsuario(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.ToTable("Usuarios");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Username)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.PasswordHash)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.PasswordSalt)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(e => e.FechaCreacion)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(e => e.FechaActualizacion)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Índice único para username
            entity.HasIndex(e => e.Username)
                .IsUnique()
                .HasDatabaseName("IX_Usuarios_Username");
        });
    }

    private void ConfigurarCuentaContable(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CuentaContable>(entity =>
        {
            entity.ToTable("CuentasContables");

            entity.HasKey(e => e.Id);

            // Propiedades requeridas
            entity.Property(e => e.Codigo)
                .IsRequired()
                .HasMaxLength(10);

            entity.Property(e => e.Nombre)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.Elemento)
                .IsRequired()
                .HasMaxLength(1);

            entity.Property(e => e.Nivel)
                .IsRequired();

            entity.Property(e => e.EsMovimiento)
                .IsRequired()
                .HasDefaultValue(false);

            entity.Property(e => e.EstaActivo)
                .IsRequired()
                .HasDefaultValue(true);

            // Propiedades opcionales
            entity.Property(e => e.Descripcion)
                .HasMaxLength(1000);

            // Fechas con valores por defecto
            entity.Property(e => e.FechaCreacion)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(e => e.FechaActualizacion)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Relación auto-referencial (padre-hijo)
            entity.HasOne(e => e.Padre)
                .WithMany(e => e.Hijos)
                .HasForeignKey(e => e.PadreId)
                .OnDelete(DeleteBehavior.Restrict); // Evitar eliminación en cascada

            // Índices
            entity.HasIndex(e => e.Codigo)
                .IsUnique()
                .HasDatabaseName("IX_CuentasContables_Codigo");

            entity.HasIndex(e => e.Elemento)
                .HasDatabaseName("IX_CuentasContables_Elemento");

            entity.HasIndex(e => e.Nivel)
                .HasDatabaseName("IX_CuentasContables_Nivel");

            entity.HasIndex(e => e.PadreId)
                .HasDatabaseName("IX_CuentasContables_PadreId");

            entity.HasIndex(e => new { e.Elemento, e.Nivel })
                .HasDatabaseName("IX_CuentasContables_Elemento_Nivel");

            entity.HasIndex(e => e.EstaActivo)
                .HasDatabaseName("IX_CuentasContables_EstaActivo");
        });
    }

    private void ConfigurarLogAuditoria(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<LogAuditoria>(entity =>
        {
            entity.ToTable("LogsAuditoria");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Accion)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.Entidad)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(e => e.EntidadId)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.Fecha)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Relación con Usuario
            entity.HasOne(e => e.Usuario)
                .WithMany()
                .HasForeignKey(e => e.UsuarioId)
                .OnDelete(DeleteBehavior.SetNull); // Permitir null si se elimina el usuario

            // Índices para consultas de auditoría
            entity.HasIndex(e => e.UsuarioId)
                .HasDatabaseName("IX_LogsAuditoria_UsuarioId");

            entity.HasIndex(e => e.Fecha)
                .HasDatabaseName("IX_LogsAuditoria_Fecha");

            entity.HasIndex(e => e.Entidad)
                .HasDatabaseName("IX_LogsAuditoria_Entidad");

            entity.HasIndex(e => new { e.Entidad, e.EntidadId })
                .HasDatabaseName("IX_LogsAuditoria_Entidad_EntidadId");
        });
    }

    private void ConfigurarIndicesYRestricciones(ModelBuilder modelBuilder)
    {
        // Restricciones adicionales usando check constraints

        // CuentaContable: Elemento debe ser 0-9
        modelBuilder.Entity<CuentaContable>()
            .ToTable(t => t.HasCheckConstraint("CK_CuentasContables_Elemento",
                "\"Elemento\" IN ('0', '1', '2', '3', '4', '5', '6', '7', '8', '9')"));

        // CuentaContable: Nivel debe estar entre 1 y 5
        modelBuilder.Entity<CuentaContable>()
            .ToTable(t => t.HasCheckConstraint("CK_CuentasContables_Nivel",
                "\"Nivel\" >= 1 AND \"Nivel\" <= 5"));

        // CuentaContable: Código debe ser numérico
        modelBuilder.Entity<CuentaContable>()
            .ToTable(t => t.HasCheckConstraint("CK_CuentasContables_Codigo_Numerico",
                "\"Codigo\" ~ '^[0-9]+$'"));
    }

    /// <summary>
    /// Configuración adicional para PostgreSQL
    /// </summary>
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            // Configuración de fallback - en producción esto viene del DI
            optionsBuilder.UseNpgsql("Server=localhost;Database=plan_contable_db;User Id=postgres;Password=royxd123;");
        }

        // Configuraciones adicionales para PostgreSQL
        optionsBuilder.EnableSensitiveDataLogging(false); // Solo en desarrollo
        optionsBuilder.EnableDetailedErrors(false); // Solo en desarrollo

        base.OnConfiguring(optionsBuilder);
    }

    /// <summary>
    /// Sobrescribir SaveChanges para implementar auditoría automática
    /// </summary>
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Actualizar fechas de modificación
        var entidadesModificadas = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Modified)
            .Select(e => e.Entity);

        foreach (var entidad in entidadesModificadas)
        {
            if (entidad is CuentaContable cuenta)
            {
                cuenta.FechaActualizacion = DateTime.UtcNow;
            }
        }

        // TODO: Implementar logging de auditoría automático aquí
        // Se puede agregar lógica para crear automáticamente registros de LogAuditoria

        return await base.SaveChangesAsync(cancellationToken);
    }
}
