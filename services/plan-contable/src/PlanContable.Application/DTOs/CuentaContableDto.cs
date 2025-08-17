namespace PlanContable.Application.DTOs;

/// <summary>
/// DTO para la respuesta de cuenta contable
/// </summary>
public class CuentaContableDto
{
    public Guid Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Tipo { get; set; }
    public int Nivel { get; set; }
    public Guid? IdPadre { get; set; }
    public string? CodigoPadre { get; set; }
    public string? NombrePadre { get; set; }
    public bool EsMovimiento { get; set; }
    public string Estado { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; }
    public DateTime FechaActualizacion { get; set; }
    public string PathCompleto { get; set; } = string.Empty;
    public List<CuentaContableDto> CuentasHijas { get; set; } = new();
    public bool TieneHijos => CuentasHijas.Any();
}
