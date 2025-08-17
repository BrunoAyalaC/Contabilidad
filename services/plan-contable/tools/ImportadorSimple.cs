using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PlanContable.Infrastructure.Data;
using PlanContable.Infrastructure.Seeders;

var connectionString = "Host=localhost;Port=5432;Database=plan_contable_db;Username=postgres;Password=royxd123";

var options = new DbContextOptionsBuilder<PlanContableDbContext>()
    .UseNpgsql(connectionString)
    .Options;

using var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole().SetMinimumLevel(LogLevel.Information));
var logger = loggerFactory.CreateLogger<PcgeSeeder>();

await using var context = new PlanContableDbContext(options);

Console.WriteLine("🚀 IMPORTADOR PCGE COMPLETO USANDO SEEDER EXISTENTE");
Console.WriteLine("=" + new string('=', 60));

try
{
    // Limpiar tabla
    await context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"CuentasContables\" RESTART IDENTITY CASCADE");
    Console.WriteLine("🧹 Tabla limpiada");

    // Crear seeder
    var seeder = new PcgeSeeder(context, logger);

    // Importar desde archivo completo
    var archivoCompleto = "../../../pcge_completo_seeder.json";
    Console.WriteLine($"📄 Importando desde: {archivoCompleto}");

    var resultado = await seeder.SeedAsync(archivoCompleto);

    if (resultado.Errores.Any())
    {
        Console.WriteLine("❌ ERRORES:");
        foreach (var error in resultado.Errores)
        {
            Console.WriteLine($"   {error}");
        }
    }
    else
    {
        Console.WriteLine($"✅ Importación exitosa:");
        Console.WriteLine($"   📊 Importadas: {resultado.CuentasImportadas}");
        Console.WriteLine($"   📋 Existentes: {resultado.CuentasExistentes}");
        Console.WriteLine($"   📈 Total: {resultado.TotalProcesadas}");

        // Verificar por niveles
        for (int nivel = 1; nivel <= 5; nivel++)
        {
            var count = await context.CuentasContables.CountAsync(c => c.Nivel == nivel);
            Console.WriteLine($"   Nivel {nivel}: {count:N0} cuentas");
        }

        Console.WriteLine($"\n🎉 ¡PCGE COMPLETO IMPORTADO!");
        Console.WriteLine($"💾 Todas las {resultado.TotalProcesadas:N0} cuentas en PostgreSQL");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Error: {ex.Message}");
}
