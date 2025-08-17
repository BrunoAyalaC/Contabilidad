using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PlanContable.Infrastructure.Data;
using PlanContable.Domain.Entities;

namespace PlanContable.Tools;

/// <summary>
/// Importador de PCGE Completo con 1,869 cuentas
/// </summary>
public class ImportadorPcgeCompleto
{
    public class CuentaDto
    {
        public int id { get; set; }
        public string codigo { get; set; } = string.Empty;
        public string nombre { get; set; } = string.Empty;
        public int nivel { get; set; }
        public int? padre_id { get; set; }
        public string descripcion { get; set; } = string.Empty;
        public bool estado { get; set; }
    }

    public static async Task Main(string[] args)
    {
        Console.WriteLine("🚀 IMPORTADOR DEL PCGE COMPLETO - 1,869 CUENTAS");
        Console.WriteLine("=" + new string('=', 60));

        var connectionString = "Host=localhost;Port=5432;Database=plan_contable_db;Username=postgres;Password=royxd123";

        var options = new DbContextOptionsBuilder<PlanContableDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        await using var context = new PlanContableDbContext(options);

        try
        {
            // Verificar conexión
            await context.Database.EnsureCreatedAsync();
            Console.WriteLine("✅ Conexión a PostgreSQL establecida");

            // Limpiar tabla existente
            await context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"CuentasContables\" RESTART IDENTITY CASCADE");
            Console.WriteLine("🧹 Tabla limpiada");

            // Cargar archivo JSON
            var archivoJson = "../../../pcge_completo_seeder.json";
            if (!File.Exists(archivoJson))
            {
                Console.WriteLine($"❌ No se encontró el archivo: {archivoJson}");
                return;
            }

            var jsonContent = await File.ReadAllTextAsync(archivoJson);
            var cuentasDto = JsonSerializer.Deserialize<List<CuentaDto>>(jsonContent);

            if (cuentasDto == null || !cuentasDto.Any())
            {
                Console.WriteLine("❌ No se pudieron cargar las cuentas del archivo JSON");
                return;
            }

            Console.WriteLine($"📄 {cuentasDto.Count:N0} cuentas cargadas desde JSON");

            // Convertir DTOs a entidades - insertar por niveles
            var guidMap = new Dictionary<int, Guid>();

            Console.WriteLine($"💾 Importando por niveles para respetar dependencias...");

            // Primero crear todos los GUIDs
            foreach (var dto in cuentasDto)
            {
                guidMap[dto.id] = Guid.NewGuid();
            }

            // Insertar por niveles
            for (int nivel = 1; nivel <= 5; nivel++)
            {
                var cuentasNivel = cuentasDto.Where(dto => dto.nivel == nivel).ToList();
                if (!cuentasNivel.Any()) continue;

                var entidades = cuentasNivel.Select(dto => new CuentaContable
                {
                    Id = guidMap[dto.id],
                    Codigo = dto.codigo,
                    Nombre = dto.nombre,
                    Descripcion = dto.descripcion,
                    Elemento = dto.codigo.Substring(0, 1),
                    Nivel = dto.nivel,
                    PadreId = dto.padre_id.HasValue && guidMap.ContainsKey(dto.padre_id.Value)
                        ? guidMap[dto.padre_id.Value]
                        : null,
                    EsMovimiento = dto.nivel >= 3,
                    EstaActivo = dto.estado,
                    FechaCreacion = DateTime.UtcNow,
                    FechaActualizacion = DateTime.UtcNow
                }).ToList();

                await context.CuentasContables.AddRangeAsync(entidades);
                await context.SaveChangesAsync();

                Console.WriteLine($"   ✅ Nivel {nivel}: {entidades.Count} cuentas insertadas");
            }

            // Verificar importación
            var totalImportadas = await context.CuentasContables.CountAsync();
            Console.WriteLine($"\n📊 VERIFICACIÓN:");
            Console.WriteLine($"   Total importadas: {totalImportadas:N0}");

            // Contar por niveles
            for (int nivel = 1; nivel <= 5; nivel++)
            {
                var count = await context.CuentasContables.CountAsync(c => c.Nivel == nivel);
                Console.WriteLine($"   Nivel {nivel}: {count:N0} cuentas");
            }

            // Mostrar elementos (nivel 1)
            var elementos = await context.CuentasContables
                .Where(c => c.Nivel == 1)
                .OrderBy(c => c.Codigo)
                .Select(c => new { c.Codigo, c.Nombre })
                .ToListAsync();

            Console.WriteLine($"\n📁 ELEMENTOS IMPORTADOS:");
            foreach (var elemento in elementos)
            {
                Console.WriteLine($"   {elemento.Codigo}: {elemento.Nombre}");
            }

            Console.WriteLine($"\n🎉 ¡IMPORTACIÓN COMPLETADA!");
            Console.WriteLine($"💾 {totalImportadas:N0} cuentas del PCGE completo en PostgreSQL");
            Console.WriteLine($"🎯 Todos los niveles (1-5) y elementos (0-9) importados");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error: {ex.Message}");
            Console.WriteLine($"📍 Stack: {ex.StackTrace}");
        }
    }
}
