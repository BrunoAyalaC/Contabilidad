namespace Asientos.Domain;

public class AsientoContable
{
    public Guid Id { get; set; }
    public DateTime Fecha { get; set; }
    public string Glosa { get; set; } = string.Empty;
    public string UsuarioId { get; set; } = string.Empty;
    public AsientoEstado Estado { get; set; } = AsientoEstado.Activo;
    public List<DetalleAsiento> Detalles { get; set; } = new();
}

public enum AsientoEstado
{
    Activo,
    Anulado
}
