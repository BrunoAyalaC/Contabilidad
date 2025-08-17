using PlanContable.Application.DTOs;

namespace PlanContable.Application.Interfaces;

/// <summary>
/// Interfaz para el servicio de cuentas contables
/// </summary>
public interface ICuentaContableService
{
    /// <summary>
    /// Obtiene todas las cuentas contables
    /// </summary>
    Task<IEnumerable<CuentaContableDto>> GetAllAsync();

    /// <summary>
    /// Obtiene una cuenta contable por su ID
    /// </summary>
    Task<CuentaContableDto?> GetByIdAsync(Guid id);

    /// <summary>
    /// Obtiene una cuenta contable por su código
    /// </summary>
    Task<CuentaContableDto?> GetByCodigoAsync(string codigo);

    /// <summary>
    /// Obtiene el árbol jerárquico de cuentas
    /// </summary>
    Task<IEnumerable<CuentaContableDto>> GetArbolCuentasAsync();

    /// <summary>
    /// Obtiene las cuentas raíz (sin padre)
    /// </summary>
    Task<IEnumerable<CuentaContableDto>> GetCuentasRaizAsync();

    /// <summary>
    /// Obtiene las cuentas hijas de una cuenta padre
    /// </summary>
    Task<IEnumerable<CuentaContableDto>> GetCuentasHijasAsync(Guid idPadre);

    /// <summary>
    /// Obtiene cuentas que permiten movimientos
    /// </summary>
    Task<IEnumerable<CuentaContableDto>> GetCuentasMovimientoAsync();

    /// <summary>
    /// Busca cuentas por código o nombre
    /// </summary>
    Task<IEnumerable<CuentaContableDto>> BuscarAsync(string termino);

    /// <summary>
    /// Crea una nueva cuenta contable
    /// </summary>
    Task<CuentaContableDto> CreateAsync(CrearCuentaContableDto dto);

    /// <summary>
    /// Actualiza una cuenta contable existente
    /// </summary>
    Task<CuentaContableDto> UpdateAsync(ActualizarCuentaContableDto dto);

    /// <summary>
    /// Elimina una cuenta contable
    /// </summary>
    Task<bool> DeleteAsync(Guid id);

    /// <summary>
    /// Valida si se puede eliminar una cuenta
    /// </summary>
    Task<string> ValidarEliminacionAsync(Guid id);
}
