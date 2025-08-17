using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PlanContable.Infrastructure.Data;
using PlanContable.Infrastructure.Seeders;

namespace PlanContable.SeedRunner;

/// <summary>
/// Aplicación de consola para ejecutar el seeder del catálogo PCGE
/// Puede ejecutarse de forma independiente o integrada en CI/CD
/// </summary>
class Program
{
    static async Task Main(string[] args)
    {
        Console.WriteLine("=== PLAN CONTABLE GENERAL EMPRESARIAL - SEEDER ===");
        Console.WriteLine("Importador del catálogo PCGE 2019\n");

        try
        {
            // Configurar servicios
            var host = CreateHostBuilder(args).Build();

            using var scope = host.Services.CreateScope();
            var services = scope.ServiceProvider;

            var logger = services.GetRequiredService<ILogger<Program>>();
            var context = services.GetRequiredService<PlanContableDbContext>();
            var seeder = services.GetRequiredService<PcgeSeeder>();

            // Ejecutar migraciones
            logger.LogInformation("Aplicando migraciones de base de datos...");
            await context.Database.MigrateAsync();
            logger.LogInformation("Migraciones aplicadas correctamente");

            // Ejecutar seeder
            var jsonPath = GetJsonFilePath(args);
            logger.LogInformation("Iniciando importación desde: {JsonPath}", jsonPath);

            var resultado = await seeder.SeedAsync(jsonPath);

            // Mostrar resultados
            MostrarResultados(resultado);

            if (!resultado.EsExitoso)
            {
                Environment.Exit(1);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error crítico: {ex.Message}");
            Console.WriteLine($"Detalles: {ex}");
            Environment.Exit(1);
        }

        Console.WriteLine("\n✅ Proceso completado. Presiona cualquier tecla para salir...");
        Console.ReadKey();
    }

    static IHostBuilder CreateHostBuilder(string[] args) =>
        Host.CreateDefaultBuilder(args)
            .ConfigureServices((context, services) =>
            {
                // Configurar cadena de conexión
                var connectionString = GetConnectionString(args);

                // Registrar DbContext
                services.AddDbContext<PlanContableDbContext>(options =>
                {
                    options.UseNpgsql(connectionString, npgsqlOptions =>
                    {
                        npgsqlOptions.MigrationsAssembly("PlanContable.Infrastructure");
                        npgsqlOptions.CommandTimeout(300); // 5 minutos para operaciones grandes
                    });
                });

                // Registrar servicios
                services.AddScoped<PcgeSeeder>();

                // Configurar logging
                services.AddLogging(builder =>
                {
                    builder.AddConsole();
                    builder.AddDebug();
                    builder.SetMinimumLevel(LogLevel.Information);
                });
            });

    static string GetConnectionString(string[] args)
    {
        // Buscar connection string en argumentos
        var connectionString = GetArgument(args, "--connection", "-c");

        if (!string.IsNullOrEmpty(connectionString))
        {
            return connectionString;
        }

        // Buscar en variables de entorno
        connectionString = Environment.GetEnvironmentVariable("PLANCONTABLE_CONNECTION_STRING");

        if (!string.IsNullOrEmpty(connectionString))
        {
            return connectionString;
        }

        // Connection string por defecto para desarrollo
        return "Server=localhost;Database=plan_contable_db;User Id=postgres;Password=royxd123;";
    }

    static string GetJsonFilePath(string[] args)
    {
        // Buscar archivo JSON en argumentos
        var jsonPath = GetArgument(args, "--json", "-j");

        if (!string.IsNullOrEmpty(jsonPath) && File.Exists(jsonPath))
        {
            return jsonPath;
        }

        // Buscar en ubicaciones por defecto
        var defaultPaths = new[]
        {
            "pcge_2019.json",
            "../../../seeders/pcge_2019.json",
            "../../../../seeders/pcge_2019.json",
            "../../../../../seeders/pcge_2019.json"
        };

        foreach (var path in defaultPaths)
        {
            if (File.Exists(path))
            {
                return Path.GetFullPath(path);
            }
        }

        throw new FileNotFoundException("No se encontró el archivo JSON del catálogo PCGE. " +
            "Especifica la ruta con --json <path> o coloca el archivo pcge_2019.json en el directorio actual.");
    }

    static string? GetArgument(string[] args, string longName, string shortName)
    {
        for (int i = 0; i < args.Length - 1; i++)
        {
            if (args[i] == longName || args[i] == shortName)
            {
                return args[i + 1];
            }
        }
        return null;
    }

    static void MostrarResultados(SeedResult resultado)
    {
        Console.WriteLine("\n=== RESULTADOS DE LA IMPORTACIÓN ===");
        Console.WriteLine($"Total procesadas: {resultado.TotalProcesadas}");
        Console.WriteLine($"Cuentas importadas: {resultado.CuentasImportadas}");
        Console.WriteLine($"Cuentas existentes: {resultado.CuentasExistentes}");

        if (resultado.Errores.Any())
        {
            Console.WriteLine($"\n❌ Errores encontrados ({resultado.Errores.Count}):");
            foreach (var error in resultado.Errores)
            {
                Console.WriteLine($"  - {error}");
            }
        }
        else
        {
            Console.WriteLine("\n✅ Importación completada sin errores");
        }

        // Estadísticas adicionales
        if (resultado.CuentasImportadas > 0)
        {
            Console.WriteLine($"\n📊 Estadísticas:");
            Console.WriteLine($"  • {resultado.CuentasImportadas} nuevas cuentas agregadas al catálogo");
            Console.WriteLine($"  • Catálogo actualizado al estándar PCGE 2019");
        }
    }
}
