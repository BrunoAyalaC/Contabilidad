using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PlanContable.Domain.Entities;
using PlanContable.Infrastructure.Data;

namespace PlanContable.Infrastructure.Services;

/// <summary>
/// Servicio para gestionar el catálogo de cuentas contables del PCGE
/// Implementa operaciones CRUD con validación de reglas de negocio
/// </summary>
public interface ICuentaContableService
{
    Task<IEnumerable<CuentaContable>> ObtenerTodasLasCuentasAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<CuentaContable>> ObtenerCuentasPorElementoAsync(string elemento, CancellationToken cancellationToken = default);
    Task<IEnumerable<CuentaContable>> ObtenerCuentasPorNivelAsync(int nivel, CancellationToken cancellationToken = default);
    Task<CuentaContable?> ObtenerCuentaPorCodigoAsync(string codigo, CancellationToken cancellationToken = default);
    Task<CuentaContable?> ObtenerCuentaPorIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<CuentaContable>> ObtenerCuentasHijasAsync(Guid padreId, CancellationToken cancellationToken = default);
    Task<IEnumerable<CuentaContable>> ObtenerCuentasRaizAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<CuentaContable>> ObtenerCuentasDeMovimientoAsync(CancellationToken cancellationToken = default);
    Task<bool> ExisteCuentaAsync(string codigo, CancellationToken cancellationToken = default);
    Task<CuentaContable> CrearCuentaAsync(CuentaContable cuenta, CancellationToken cancellationToken = default);
    Task<CuentaContable> ActualizarCuentaAsync(CuentaContable cuenta, CancellationToken cancellationToken = default);
    Task<bool> EliminarCuentaAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<CuentaContable>> BuscarCuentasAsync(string termino, CancellationToken cancellationToken = default);
}

public class CuentaContableService : ICuentaContableService
{
    private readonly PlanContableDbContext _context;
    private readonly ILogger<CuentaContableService> _logger;

    public CuentaContableService(PlanContableDbContext context, ILogger<CuentaContableService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<CuentaContable>> ObtenerTodasLasCuentasAsync(CancellationToken cancellationToken = default)
    {
        return await _context.CuentasContables
            .Include(c => c.Padre)
            .Include(c => c.Hijos)
            .Where(c => c.EstaActivo)
            .OrderBy(c => c.Codigo)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<CuentaContable>> ObtenerCuentasPorElementoAsync(string elemento, CancellationToken cancellationToken = default)
    {
        return await _context.CuentasContables
            .Include(c => c.Padre)
            .Include(c => c.Hijos)
            .Where(c => c.Elemento == elemento && c.EstaActivo)
            .OrderBy(c => c.Codigo)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<CuentaContable>> ObtenerCuentasPorNivelAsync(int nivel, CancellationToken cancellationToken = default)
    {
        return await _context.CuentasContables
            .Include(c => c.Padre)
            .Include(c => c.Hijos)
            .Where(c => c.Nivel == nivel && c.EstaActivo)
            .OrderBy(c => c.Codigo)
            .ToListAsync(cancellationToken);
    }

    public async Task<CuentaContable?> ObtenerCuentaPorCodigoAsync(string codigo, CancellationToken cancellationToken = default)
    {
        return await _context.CuentasContables
            .Include(c => c.Padre)
            .Include(c => c.Hijos)
            .FirstOrDefaultAsync(c => c.Codigo == codigo && c.EstaActivo, cancellationToken);
    }

    public async Task<CuentaContable?> ObtenerCuentaPorIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.CuentasContables
            .Include(c => c.Padre)
            .Include(c => c.Hijos)
            .FirstOrDefaultAsync(c => c.Id == id && c.EstaActivo, cancellationToken);
    }

    public async Task<IEnumerable<CuentaContable>> ObtenerCuentasHijasAsync(Guid padreId, CancellationToken cancellationToken = default)
    {
        return await _context.CuentasContables
            .Include(c => c.Padre)
            .Include(c => c.Hijos)
            .Where(c => c.PadreId == padreId && c.EstaActivo)
            .OrderBy(c => c.Codigo)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<CuentaContable>> ObtenerCuentasRaizAsync(CancellationToken cancellationToken = default)
    {
        return await _context.CuentasContables
            .Include(c => c.Hijos)
            .Where(c => c.PadreId == null && c.EstaActivo)
            .OrderBy(c => c.Codigo)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<CuentaContable>> ObtenerCuentasDeMovimientoAsync(CancellationToken cancellationToken = default)
    {
        return await _context.CuentasContables
            .Include(c => c.Padre)
            .Where(c => c.EsMovimiento && c.EstaActivo)
            .OrderBy(c => c.Codigo)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> ExisteCuentaAsync(string codigo, CancellationToken cancellationToken = default)
    {
        return await _context.CuentasContables
            .AnyAsync(c => c.Codigo == codigo, cancellationToken);
    }

    public async Task<CuentaContable> CrearCuentaAsync(CuentaContable cuenta, CancellationToken cancellationToken = default)
    {
        // Validaciones de negocio
        await ValidarCuentaAsync(cuenta, cancellationToken);

        // Verificar unicidad del código
        if (await ExisteCuentaAsync(cuenta.Codigo, cancellationToken))
        {
            throw new InvalidOperationException($"Ya existe una cuenta con el código {cuenta.Codigo}");
        }

        // Establecer valores por defecto
        cuenta.Id = Guid.NewGuid();
        cuenta.FechaCreacion = DateTime.UtcNow;
        cuenta.FechaActualizacion = DateTime.UtcNow;

        _context.CuentasContables.Add(cuenta);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Cuenta creada: {Codigo} - {Nombre}", cuenta.Codigo, cuenta.Nombre);

        return cuenta;
    }

    public async Task<CuentaContable> ActualizarCuentaAsync(CuentaContable cuenta, CancellationToken cancellationToken = default)
    {
        var cuentaExistente = await _context.CuentasContables
            .FirstOrDefaultAsync(c => c.Id == cuenta.Id, cancellationToken);

        if (cuentaExistente == null)
        {
            throw new InvalidOperationException($"No se encontró la cuenta con ID {cuenta.Id}");
        }

        // Validaciones de negocio
        await ValidarCuentaAsync(cuenta, cancellationToken);

        // Verificar que no se cambie el código a uno existente
        if (cuentaExistente.Codigo != cuenta.Codigo && await ExisteCuentaAsync(cuenta.Codigo, cancellationToken))
        {
            throw new InvalidOperationException($"Ya existe una cuenta con el código {cuenta.Codigo}");
        }

        // Actualizar propiedades
        cuentaExistente.Codigo = cuenta.Codigo;
        cuentaExistente.Nombre = cuenta.Nombre;
        cuentaExistente.Descripcion = cuenta.Descripcion;
        cuentaExistente.Elemento = cuenta.Elemento;
        cuentaExistente.Nivel = cuenta.Nivel;
        cuentaExistente.PadreId = cuenta.PadreId;
        cuentaExistente.EsMovimiento = cuenta.EsMovimiento;
        cuentaExistente.EstaActivo = cuenta.EstaActivo;
        cuentaExistente.FechaActualizacion = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Cuenta actualizada: {Codigo} - {Nombre}", cuentaExistente.Codigo, cuentaExistente.Nombre);

        return cuentaExistente;
    }

    public async Task<bool> EliminarCuentaAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var cuenta = await _context.CuentasContables
            .Include(c => c.Hijos)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (cuenta == null)
        {
            return false;
        }

        // Verificar que no tenga cuentas hijas activas
        if (cuenta.Hijos.Any(h => h.EstaActivo))
        {
            throw new InvalidOperationException($"No se puede eliminar la cuenta {cuenta.Codigo} porque tiene subcuentas activas");
        }

        // TODO: Verificar que no tenga movimientos contables asociados

        // Eliminación lógica
        cuenta.EstaActivo = false;
        cuenta.FechaActualizacion = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Cuenta eliminada (lógicamente): {Codigo} - {Nombre}", cuenta.Codigo, cuenta.Nombre);

        return true;
    }

    public async Task<IEnumerable<CuentaContable>> BuscarCuentasAsync(string termino, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(termino))
        {
            return Enumerable.Empty<CuentaContable>();
        }

        termino = termino.Trim().ToLower();

        return await _context.CuentasContables
            .Include(c => c.Padre)
            .Where(c => c.EstaActivo &&
                       (c.Codigo.ToLower().Contains(termino) ||
                        c.Nombre.ToLower().Contains(termino) ||
                        (c.Descripcion != null && c.Descripcion.ToLower().Contains(termino))))
            .OrderBy(c => c.Codigo)
            .Take(50) // Limitar resultados
            .ToListAsync(cancellationToken);
    }

    private async Task ValidarCuentaAsync(CuentaContable cuenta, CancellationToken cancellationToken)
    {
        // Validar que el código cumple con el estándar PCGE
        if (!cuenta.ValidarCodigoPCGE())
        {
            throw new InvalidOperationException($"El código {cuenta.Codigo} no cumple con el estándar PCGE");
        }

        // Validar jerarquía
        if (!cuenta.ValidarJerarquia())
        {
            throw new InvalidOperationException($"La jerarquía de la cuenta {cuenta.Codigo} es inválida");
        }

        // Validar que el padre existe si se especifica
        if (cuenta.PadreId.HasValue)
        {
            var padre = await _context.CuentasContables
                .FirstOrDefaultAsync(c => c.Id == cuenta.PadreId.Value && c.EstaActivo, cancellationToken);

            if (padre == null)
            {
                throw new InvalidOperationException($"No se encontró la cuenta padre con ID {cuenta.PadreId}");
            }

            // Validar que el nivel sea coherente con el padre
            if (cuenta.Nivel != padre.Nivel + 1)
            {
                throw new InvalidOperationException($"El nivel {cuenta.Nivel} no es coherente con el nivel del padre {padre.Nivel}");
            }

            // Validar que el código sea consistente con la jerarquía
            if (!cuenta.Codigo.StartsWith(padre.Codigo))
            {
                throw new InvalidOperationException($"El código {cuenta.Codigo} no es consistente con el código del padre {padre.Codigo}");
            }
        }
        else
        {
            // Es una cuenta raíz, debe ser nivel 1
            if (cuenta.Nivel != 1)
            {
                throw new InvalidOperationException("Las cuentas raíz deben ser de nivel 1");
            }
        }
    }
}
