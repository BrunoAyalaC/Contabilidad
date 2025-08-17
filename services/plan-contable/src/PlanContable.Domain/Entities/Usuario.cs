using System.ComponentModel.DataAnnotations;

namespace PlanContable.Domain.Entities;

/// <summary>
/// Entidad para representar usuarios del sistema
/// Implementa autenticación básica con hashing de contraseñas
/// </summary>
public class Usuario
{
    public Guid Id { get; set; }

    /// <summary>
    /// Nombre de usuario único en el sistema
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// Hash de la contraseña usando algoritmo seguro (bcrypt, Argon2, etc.)
    /// </summary>
    [Required]
    [StringLength(255)]
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// Salt único para el hashing de la contraseña
    /// </summary>
    [Required]
    [StringLength(255)]
    public string PasswordSalt { get; set; } = string.Empty;

    /// <summary>
    /// Email del usuario (opcional para futuras funcionalidades)
    /// </summary>
    [StringLength(255)]
    public string? Email { get; set; }

    /// <summary>
    /// Nombre completo del usuario
    /// </summary>
    [StringLength(100)]
    public string? NombreCompleto { get; set; }

    /// <summary>
    /// Indica si el usuario está activo en el sistema
    /// </summary>
    public bool EstaActivo { get; set; } = true;

    /// <summary>
    /// Fecha de último acceso al sistema
    /// </summary>
    public DateTime? UltimoAcceso { get; set; }

    /// <summary>
    /// Número de intentos de login fallidos consecutivos
    /// </summary>
    public int IntentosFallidos { get; set; } = 0;

    /// <summary>
    /// Fecha hasta la cual la cuenta está bloqueada por intentos fallidos
    /// </summary>
    public DateTime? BloqueoHasta { get; set; }

    /// <summary>
    /// Fecha de creación del usuario
    /// </summary>
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Fecha de última actualización
    /// </summary>
    public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Determina si la cuenta está bloqueada
    /// </summary>
    public bool EstaBloqueado()
    {
        return BloqueoHasta.HasValue && BloqueoHasta.Value > DateTime.UtcNow;
    }

    /// <summary>
    /// Resetea los intentos fallidos de login
    /// </summary>
    public void ResetearIntentosFallidos()
    {
        IntentosFallidos = 0;
        BloqueoHasta = null;
    }

    /// <summary>
    /// Incrementa los intentos fallidos y bloquea si es necesario
    /// </summary>
    public void RegistrarIntentoFallido(int maxIntentos = 5, int minutosBloqueo = 15)
    {
        IntentosFallidos++;

        if (IntentosFallidos >= maxIntentos)
        {
            BloqueoHasta = DateTime.UtcNow.AddMinutes(minutosBloqueo);
        }
    }

    /// <summary>
    /// Actualiza la fecha de último acceso
    /// </summary>
    public void RegistrarAcceso()
    {
        UltimoAcceso = DateTime.UtcNow;
        ResetearIntentosFallidos();
    }
}
