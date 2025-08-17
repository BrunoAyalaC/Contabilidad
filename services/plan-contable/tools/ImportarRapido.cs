using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PlanContable.Infrastructure.Data;
using PlanContable.Domain.Entities;

var connectionString = "Host=localhost;Port=5432;Database=plan_contable_db;Username=postgres;Password=royxd123";

var options = new DbContextOptionsBuilder<PlanContableDbContext>()
    .UseNpgsql(connectionString)
    .Options;

await using var context = new PlanContableDbContext(options);

Console.WriteLine("🚀 IMPORTACIÓN RÁPIDA DEL PCGE COMPLETO");
Console.WriteLine("=" + new string('=', 50));

try
{
    // Limpiar tabla
    await context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"CuentasContables\" RESTART IDENTITY CASCADE");
    Console.WriteLine("🧹 Tabla limpiada");

    // Cargar archivo JSON
    var jsonContent = await File.ReadAllTextAsync("pcge_completo_seeder.json");
    var cuentasJson = JsonSerializer.Deserialize<List<CuentaSeederDto>>(jsonContent);

    if (cuentasJson == null || !cuentasJson.Any())
    {
        Console.WriteLine("❌ Error cargando archivo JSON");
        return;
    }

    Console.WriteLine($"📄 {cuentasJson.Count:N0} cuentas cargadas desde JSON");

    // Crear mapeo de IDs
    var guidMap = new Dictionary<int, Guid>();
    foreach (var cuenta in cuentasJson)
    {
        guidMap[cuenta.id] = Guid.NewGuid();
    }

    Console.WriteLine("💾 Insertando por niveles...");

    // Insertar por niveles para mantener integridad referencial
    for (int nivel = 1; nivel <= 5; nivel++)
    {
        var cuentasNivel = cuentasJson.Where(c => c.nivel == nivel).ToList();
        if (!cuentasNivel.Any()) continue;

        var entidades = cuentasNivel.Select(dto => new CuentaContable
        {
            Id = guidMap[dto.id],
            Codigo = dto.codigo,
            Nombre = dto.nombre,
            Descripcion = dto.descripcion ?? "",
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

        context.CuentasContables.AddRange(entidades);
        await context.SaveChangesAsync();

        Console.WriteLine($"   ✅ Nivel {nivel}: {entidades.Count:N0} cuentas");
    }

    // Verificar resultado
    var total = await context.CuentasContables.CountAsync();
    Console.WriteLine($"\n🎉 ¡IMPORTACIÓN COMPLETADA!");
    Console.WriteLine($"📊 Total importado: {total:N0} cuentas");

    // Mostrar por niveles
    for (int nivel = 1; nivel <= 5; nivel++)
    {
        var count = await context.CuentasContables.CountAsync(c => c.Nivel == nivel);
        Console.WriteLine($"   Nivel {nivel}: {count:N0} cuentas");
    }

    // Mostrar elementos
    var elementos = await context.CuentasContables
        .Where(c => c.Nivel == 1)
        .OrderBy(c => c.Codigo == "0" ? 10 : int.Parse(c.Codigo))
        .Select(c => new { c.Codigo, c.Nombre })
        .ToListAsync();

    Console.WriteLine($"\n📁 Elementos presentes ({elementos.Count}/10):");
    foreach (var elemento in elementos)
    {
        Console.WriteLine($"   {elemento.Codigo}: {elemento.Nombre}");
    }

    Console.WriteLine(elementos.Count == 10 ? "\n✅ PCGE 100% COMPLETO!" : "\n⚠️ Algunos elementos faltan");
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Error: {ex.Message}");
    Console.WriteLine($"Stack: {ex.StackTrace}");
}

public class CuentaSeederDto
{
    public int id { get; set; }
    public string codigo { get; set; } = "";
    public string nombre { get; set; } = "";
    public int nivel { get; set; }
    public int? padre_id { get; set; }
    public string? descripcion { get; set; }
    public bool estado { get; set; }
}
