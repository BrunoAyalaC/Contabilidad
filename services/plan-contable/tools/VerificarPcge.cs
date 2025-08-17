using Microsoft.EntityFrameworkCore;
using PlanContable.Infrastructure.Data;

var connectionString = "Host=localhost;Port=5432;Database=plan_contable_db;Username=postgres;Password=royxd123";

var options = new DbContextOptionsBuilder<PlanContableDbContext>()
    .UseNpgsql(connectionString)
    .Options;

await using var context = new PlanContableDbContext(options);

Console.WriteLine("🔍 VERIFICACIÓN DEL PCGE");
Console.WriteLine("=" + new string('=', 40));

try
{
    // Verificar total de cuentas
    var totalCuentas = await context.CuentasContables.CountAsync();
    Console.WriteLine($"📊 Total cuentas: {totalCuentas:N0}");

    if (totalCuentas > 0)
    {
        // Verificar por niveles
        Console.WriteLine("\n📈 Distribución por niveles:");
        for (int nivel = 1; nivel <= 5; nivel++)
        {
            var count = await context.CuentasContables.CountAsync(c => c.Nivel == nivel);
            Console.WriteLine($"   Nivel {nivel}: {count:N0} cuentas");
        }

        // Verificar elementos
        Console.WriteLine("\n📁 Elementos presentes:");
        var elementos = await context.CuentasContables
            .Where(c => c.Nivel == 1)
            .OrderBy(c => c.Codigo == "0" ? 10 : int.Parse(c.Codigo))
            .Select(c => new { c.Codigo, c.Nombre })
            .ToListAsync();

        foreach (var elemento in elementos)
        {
            Console.WriteLine($"   {elemento.Codigo}: {elemento.Nombre}");
        }

        // Verificar completitud
        var elementosPresentes = elementos.Select(e => e.Codigo).ToHashSet();
        var elementosEsperados = new[] { "0", "1", "2", "3", "4", "5", "6", "7", "8", "9" };
        var elementosFaltantes = elementosEsperados.Except(elementosPresentes).ToList();

        Console.WriteLine($"\n✅ Completitud:");
        Console.WriteLine($"   Elementos presentes: {elementosPresentes.Count}/10");

        if (elementosFaltantes.Any())
        {
            Console.WriteLine($"   ❌ Faltantes: {string.Join(", ", elementosFaltantes)}");
        }
        else
        {
            Console.WriteLine($"   🎉 ¡PCGE 100% COMPLETO!");
        }

        // Verificar últimas cuentas importadas
        var ultimasCuentas = await context.CuentasContables
            .OrderByDescending(c => c.FechaCreacion)
            .Take(5)
            .Select(c => new { c.Codigo, c.Nombre, c.Nivel })
            .ToListAsync();

        Console.WriteLine($"\n🕒 Últimas cuentas importadas:");
        foreach (var cuenta in ultimasCuentas)
        {
            Console.WriteLine($"   {cuenta.Codigo} - {cuenta.Nombre} (Nivel {cuenta.Nivel})");
        }
    }
    else
    {
        Console.WriteLine("❌ No hay cuentas en la base de datos");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Error: {ex.Message}");
}
