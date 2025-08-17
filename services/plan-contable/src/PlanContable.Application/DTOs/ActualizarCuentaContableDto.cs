using System.ComponentModel.DataAnnotations;

namespace PlanContable.Application.DTOs;

/// <summary>
/// DTO para la actualización de una cuenta contable existente
/// </summary>
public class ActualizarCuentaContableDto
{
    /// <summary>
    /// ID de la cuenta a actualizar
    /// </summary>
    [Required(ErrorMessage = "El ID es obligatorio")]
    public Guid Id { get; set; }

    /// <summary>
    /// Código único de la cuenta (ej: 10, 101, 1011, etc.)
    /// </summary>
    [Required(ErrorMessage = "El código es obligatorio")]
    [StringLength(20, ErrorMessage = "El código no puede exceder 20 caracteres")]
    public string Codigo { get; set; } = string.Empty;

    /// <summary>
    /// Nombre descriptivo de la cuenta
    /// </summary>
    [Required(ErrorMessage = "El nombre es obligatorio")]
    [StringLength(255, ErrorMessage = "El nombre no puede exceder 255 caracteres")]
    public string Nombre { get; set; } = string.Empty;

    /// <summary>
    /// Descripción opcional de la cuenta
    /// </summary>
    [StringLength(1000, ErrorMessage = "La descripción no puede exceder 1000 caracteres")]
    public string? Descripcion { get; set; }

    /// <summary>
    /// Tipo de cuenta (Activo, Pasivo, Patrimonio, Ingreso, Gasto, etc.)
    /// </summary>
    [StringLength(20, ErrorMessage = "El tipo no puede exceder 20 caracteres")]
    public string? Tipo { get; set; }

    /// <summary>
    /// Nivel jerárquico en el plan contable
    /// </summary>
    [Range(1, 10, ErrorMessage = "El nivel debe estar entre 1 y 10")]
    public int Nivel { get; set; }

    /// <summary>
    /// ID de la cuenta padre (null para cuentas raíz)
    /// </summary>
    public Guid? IdPadre { get; set; }

    /// <summary>
    /// Indica si esta cuenta permite movimientos contables directos
    /// </summary>
    public bool EsMovimiento { get; set; }

    /// <summary>
    /// Estado de la cuenta (Activo/Inactivo)
    /// </summary>
    [StringLength(20, ErrorMessage = "El estado no puede exceder 20 caracteres")]
    public string Estado { get; set; } = "Activo";
}
