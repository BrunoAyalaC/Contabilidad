using PlanContable.Domain.Entities;

namespace PlanContable.Domain.Interfaces;

/// <summary>
/// Interfaz para el repositorio de cuentas contables
/// </summary>
public interface ICuentaContableRepository
{
    /// <summary>
    /// Obtiene todas las cuentas contables
    /// </summary>
    Task<IEnumerable<CuentaContable>> GetAllAsync();

    /// <summary>
    /// Obtiene una cuenta contable por su ID
    /// </summary>
    Task<CuentaContable?> GetByIdAsync(Guid id);

    /// <summary>
    /// Obtiene una cuenta contable por su código
    /// </summary>
    Task<CuentaContable?> GetByCodigoAsync(string codigo);

    /// <summary>
    /// Obtiene las cuentas raíz (sin padre)
    /// </summary>
    Task<IEnumerable<CuentaContable>> GetCuentasRaizAsync();

    /// <summary>
    /// Obtiene las cuentas hijas de una cuenta padre
    /// </summary>
    Task<IEnumerable<CuentaContable>> GetCuentasHijasAsync(Guid idPadre);

    /// <summary>
    /// Obtiene el árbol completo de cuentas jerárquico
    /// </summary>
    Task<IEnumerable<CuentaContable>> GetArbolCuentasAsync();

    /// <summary>
    /// Obtiene cuentas que permiten movimientos (cuentas de último nivel)
    /// </summary>
    Task<IEnumerable<CuentaContable>> GetCuentasMovimientoAsync();

    /// <summary>
    /// Busca cuentas por código o nombre
    /// </summary>
    Task<IEnumerable<CuentaContable>> BuscarAsync(string termino);

    /// <summary>
    /// Verifica si existe una cuenta con el código especificado
    /// </summary>
    Task<bool> ExisteCodigoAsync(string codigo, Guid? excludeId = null);

    /// <summary>
    /// Verifica si una cuenta tiene movimientos contables asociados
    /// </summary>
    Task<bool> TieneMovimientosAsync(Guid id);

    /// <summary>
    /// Crea una nueva cuenta contable
    /// </summary>
    Task<CuentaContable> CreateAsync(CuentaContable cuenta);

    /// <summary>
    /// Actualiza una cuenta contable existente
    /// </summary>
    Task<CuentaContable> UpdateAsync(CuentaContable cuenta);

    /// <summary>
    /// Elimina una cuenta contable
    /// </summary>
    Task<bool> DeleteAsync(Guid id);

    /// <summary>
    /// Guarda todos los cambios pendientes
    /// </summary>
    Task<int> SaveChangesAsync();
}
