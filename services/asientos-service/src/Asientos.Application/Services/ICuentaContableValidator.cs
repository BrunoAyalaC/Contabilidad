using System.Threading.Tasks;
using System.Collections.Generic;

namespace Asientos.Application.Services;

/// <summary>
/// Abstracción para validar la existencia y estado de cuentas contables vía microservicio de plan contable.
/// </summary>
public interface ICuentaContableValidator
{
    /// <summary>
    /// Valida que todos los códigos de cuenta existan, estén activos y permitan movimiento.
    /// </summary>
    /// <param name="codigos">Lista de códigos de cuenta a validar.</param>
    /// <returns>Diccionario: código => resultado (true=válido, false=inválido)</returns>
    Task<IDictionary<string, CuentaContableValidationResult>> ValidarCuentasAsync(IEnumerable<string> codigos);
}

public record CuentaContableValidationResult(bool Existe, bool EstaActiva, bool EsMovimiento, string? MensajeError = null);
