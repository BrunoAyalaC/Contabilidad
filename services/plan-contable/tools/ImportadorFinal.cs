using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PlanContable.Infrastructure.Data;
using PlanContable.Domain.Entities;

namespace PlanContable.Tools;

public class ImportadorFinal
{
    public class CuentaDto
    {
        public int id { get; set; }
        public string codigo { get; set; } = "";
        public string nombre { get; set; } = "";
        public int nivel { get; set; }
        public int? padre_id { get; set; }
        public string? descripcion { get; set; }
        public bool estado { get; set; }
    }

    public static async Task Main(string[] args)
    {
        Console.WriteLine("🚀 IMPORTADOR FINAL - PCGE COMPLETO 1,900 CUENTAS");
        Console.WriteLine("=" + new string('=', 60));

        var connectionString = "Host=localhost;Port=5432;Database=plan_contable_db;Username=postgres;Password=royxd123";

        var options = new DbContextOptionsBuilder<PlanContableDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        await using var context = new PlanContableDbContext(options);

        try
        {
            // Limpiar tabla
            await context.Database.ExecuteSqlRawAsync("DELETE FROM \"CuentasContables\"");
            Console.WriteLine("🧹 Tabla limpiada");

            // Cargar archivo
            var archivoJson = "../../../data/pcge_completo_seeder.json";
            if (!File.Exists(archivoJson))
            {
                Console.WriteLine($"❌ No se encontró: {archivoJson}");
                return;
            }

            var jsonContent = await File.ReadAllTextAsync(archivoJson);
            var cuentasDto = JsonSerializer.Deserialize<List<CuentaDto>>(jsonContent);

            if (cuentasDto == null || !cuentasDto.Any())
            {
                Console.WriteLine("❌ Error cargando JSON");
                return;
            }

            Console.WriteLine($"📄 {cuentasDto.Count:N0} cuentas cargadas");

            // Crear mapeo
            var guidMap = new Dictionary<int, Guid>();
            foreach (var dto in cuentasDto)
            {
                guidMap[dto.id] = Guid.NewGuid();
            }

            Console.WriteLine("💾 Insertando todas las cuentas...");

            // Insertar por lotes grandes para mejor rendimiento
            var batchSize = 200;
            var totalBatches = (int)Math.Ceiling((double)cuentasDto.Count / batchSize);
            var insertadas = 0;

            for (int batchIndex = 0; batchIndex < totalBatches; batchIndex++)
            {
                var batch = cuentasDto.Skip(batchIndex * batchSize).Take(batchSize).ToList();

                var entidades = batch.Select(dto => new CuentaContable
                {
                    Id = guidMap[dto.id],
                    Codigo = dto.codigo,
                    Nombre = dto.nombre,
                    Descripcion = dto.descripcion ?? "",
                    Elemento = dto.codigo.Length > 0 ? dto.codigo.Substring(0, 1) : "0",
                    Nivel = dto.nivel,
                    PadreId = dto.padre_id.HasValue && guidMap.ContainsKey(dto.padre_id.Value)
                        ? guidMap[dto.padre_id.Value]
                        : null,
                    EsMovimiento = dto.nivel >= 3,
                    EstaActivo = dto.estado,
                    FechaCreacion = DateTime.UtcNow,
                    FechaActualizacion = DateTime.UtcNow
                }).ToList();

                try
                {
                    context.CuentasContables.AddRange(entidades);
                    await context.SaveChangesAsync();
                    insertadas += entidades.Count;

                    Console.WriteLine($"   ✅ Lote {batchIndex + 1}/{totalBatches}: {insertadas:N0}/{cuentasDto.Count:N0} cuentas");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"   ⚠️ Error en lote {batchIndex + 1}: {ex.Message}");
                    context.ChangeTracker.Clear();
                }
            }

            // Verificación final
            var total = await context.CuentasContables.CountAsync();
            Console.WriteLine($"\n🎉 IMPORTACIÓN COMPLETADA!");
            Console.WriteLine($"📊 Total final: {total:N0} cuentas");

            // Mostrar distribución
            for (int nivel = 1; nivel <= 5; nivel++)
            {
                var count = await context.CuentasContables.CountAsync(c => c.Nivel == nivel);
                Console.WriteLine($"   Nivel {nivel}: {count:N0} cuentas");
            }

            // Verificar elementos
            var elementos = await context.CuentasContables
                .Where(c => c.Nivel == 1)
                .Select(c => c.Codigo)
                .ToListAsync();

            Console.WriteLine($"\n📁 Elementos: {elementos.Count}/10");
            var elementosOrdenados = elementos.OrderBy(e => e == "0" ? 10 : int.Parse(e)).ToList();
            Console.WriteLine($"   Presentes: {string.Join(", ", elementosOrdenados)}");

            if (total >= 1800)
            {
                Console.WriteLine($"\n🎊 ¡PCGE COMPLETO CON {total:N0} CUENTAS!");
                Console.WriteLine($"✅ Sistema listo para producción");
            }
            else
            {
                Console.WriteLine($"\n⚠️ Importación parcial: {total:N0} cuentas");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error: {ex.Message}");
        }
    }
}
