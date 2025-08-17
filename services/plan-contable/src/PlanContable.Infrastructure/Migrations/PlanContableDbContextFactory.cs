using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using PlanContable.Infrastructure.Data;

namespace PlanContable.Infrastructure.Migrations;

/// <summary>
/// Factory para crear el DbContext durante las migraciones
/// </summary>
public class PlanContableDbContextFactory : IDesignTimeDbContextFactory<PlanContableDbContext>
{
    public PlanContableDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<PlanContableDbContext>();

        // Usar string de conexión por defecto para desarrollo
        var connectionString = "Server=localhost;Database=plan_contable_db;User Id=postgres;Password=royxd123;";

        optionsBuilder.UseNpgsql(connectionString, options =>
        {
            options.MigrationsAssembly("PlanContable.Infrastructure");
            options.MigrationsHistoryTable("__EFMigrationsHistory", "public");
        });

        return new PlanContableDbContext(optionsBuilder.Options);
    }
}
