using System.ComponentModel.DataAnnotations;

namespace PlanContable.Domain.Entities;

/// <summary>
/// Entidad para el registro de auditoría del sistema
/// Registra todas las operaciones importantes realizadas por los usuarios
/// </summary>
public class LogAuditoria
{
    public Guid Id { get; set; }

    /// <summary>
    /// ID del usuario que realizó la acción
    /// </summary>
    public Guid? UsuarioId { get; set; }

    /// <summary>
    /// Navegación al usuario que realizó la acción
    /// </summary>
    public virtual Usuario? Usuario { get; set; }

    /// <summary>
    /// Tipo de acción realizada (CREATE, UPDATE, DELETE, LOGIN, etc.)
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Accion { get; set; } = string.Empty;

    /// <summary>
    /// Nombre de la entidad afectada
    /// </summary>
    [Required]
    [StringLength(100)]
    public string Entidad { get; set; } = string.Empty;

    /// <summary>
    /// ID de la entidad afectada (como string para flexibilidad)
    /// </summary>
    [Required]
    [StringLength(50)]
    public string EntidadId { get; set; } = string.Empty;

    /// <summary>
    /// Valores anteriores de la entidad (JSON serializado)
    /// </summary>
    public string? ValoresAnteriores { get; set; }

    /// <summary>
    /// Valores nuevos de la entidad (JSON serializado)
    /// </summary>
    public string? ValoresNuevos { get; set; }

    /// <summary>
    /// Información adicional sobre la operación
    /// </summary>
    [StringLength(500)]
    public string? Detalles { get; set; }

    /// <summary>
    /// Dirección IP del usuario que realizó la acción
    /// </summary>
    [StringLength(45)] // IPv6 puede ser hasta 45 caracteres
    public string? DireccionIP { get; set; }

    /// <summary>
    /// User-Agent del navegador/aplicación
    /// </summary>
    [StringLength(500)]
    public string? UserAgent { get; set; }

    /// <summary>
    /// Fecha y hora de la acción
    /// </summary>
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Resultado de la operación (SUCCESS, ERROR, WARNING)
    /// </summary>
    [StringLength(20)]
    public string? Resultado { get; set; }

    /// <summary>
    /// Mensaje de error si la operación falló
    /// </summary>
    [StringLength(1000)]
    public string? MensajeError { get; set; }

    /// <summary>
    /// Duración de la operación en milisegundos
    /// </summary>
    public long? DuracionMs { get; set; }
}

/// <summary>
/// Enumeración para tipos de acciones de auditoría
/// </summary>
public static class TiposAccionAuditoria
{
    public const string Create = "CREATE";
    public const string Update = "UPDATE";
    public const string Delete = "DELETE";
    public const string Login = "LOGIN";
    public const string Logout = "LOGOUT";
    public const string LoginFallido = "LOGIN_FAILED";
    public const string Consulta = "QUERY";
    public const string Importacion = "IMPORT";
    public const string Exportacion = "EXPORT";
    public const string CambioClave = "PASSWORD_CHANGE";
    public const string BloqueoUsuario = "USER_LOCK";
    public const string DesbloqueoUsuario = "USER_UNLOCK";
}

/// <summary>
/// Enumeración para resultados de auditoría
/// </summary>
public static class ResultadosAuditoria
{
    public const string Exitoso = "SUCCESS";
    public const string Error = "ERROR";
    public const string Advertencia = "WARNING";
    public const string Bloqueado = "BLOCKED";
    public const string NoAutorizado = "UNAUTHORIZED";
}
