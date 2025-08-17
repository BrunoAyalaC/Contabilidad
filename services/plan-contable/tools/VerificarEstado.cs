using Microsoft.EntityFrameworkCore;
using PlanContable.Infrastructure.Data;

var connectionString = "Host=localhost;Port=5432;Database=plan_contable_db;Username=postgres;Password=royxd123";

var options = new DbContextOptionsBuilder<PlanContableDbContext>()
    .UseNpgsql(connectionString)
    .Options;

await using var context = new PlanContableDbContext(options);

Console.WriteLine("🔍 VERIFICACIÓN ACTUAL DEL PCGE");
Console.WriteLine("=" + new string('=', 40));

try
{
    var total = await context.CuentasContables.CountAsync();
    Console.WriteLine($"📊 Total cuentas: {total:N0}");

    if (total > 0)
    {
        // Por niveles
        Console.WriteLine("\n📈 Por niveles:");
        for (int nivel = 1; nivel <= 5; nivel++)
        {
            var count = await context.CuentasContables.CountAsync(c => c.Nivel == nivel);
            Console.WriteLine($"   Nivel {nivel}: {count:N0} cuentas");
        }

        // Elementos presentes
        var elementos = await context.CuentasContables
            .Where(c => c.Nivel == 1)
            .ToListAsync();

        elementos = elementos
            .OrderBy(c => c.Codigo == "0" ? 10 : int.Parse(c.Codigo))
            .ToList();

        Console.WriteLine($"\n📁 Elementos ({elementos.Count}/10):");
        foreach (var elemento in elementos)
        {
            Console.WriteLine($"   {elemento.Codigo}: {elemento.Nombre}");
        }

        // Estado actual
        var porcentaje = (elementos.Count * 100) / 10;
        Console.WriteLine($"\n📊 ESTADO ACTUAL:");
        Console.WriteLine($"   ✅ Completitud: {porcentaje}%");
        Console.WriteLine($"   📈 Total cuentas: {total:N0}");

        if (elementos.Count == 10)
        {
            Console.WriteLine($"   🎉 ¡TODOS LOS ELEMENTOS PRESENTES!");
        }
        else
        {
            var elementosEsperados = new[] { "0", "1", "2", "3", "4", "5", "6", "7", "8", "9" };
            var presentes = elementos.Select(e => e.Codigo).ToHashSet();
            var faltantes = elementosEsperados.Except(presentes).ToList();
            Console.WriteLine($"   ⚠️ Elementos faltantes: {string.Join(", ", faltantes)}");
        }

        // Últimas cuentas
        var ultimas = await context.CuentasContables
            .OrderByDescending(c => c.FechaCreacion)
            .Take(3)
            .Select(c => new { c.Codigo, c.Nombre, c.Nivel })
            .ToListAsync();

        Console.WriteLine($"\n🕒 Últimas cuentas importadas:");
        foreach (var cuenta in ultimas)
        {
            Console.WriteLine($"   {cuenta.Codigo} - {cuenta.Nombre} (N{cuenta.Nivel})");
        }
    }
    else
    {
        Console.WriteLine("❌ Base de datos vacía");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Error: {ex.Message}");
}
