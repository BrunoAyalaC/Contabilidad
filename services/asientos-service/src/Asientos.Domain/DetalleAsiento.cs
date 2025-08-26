namespace Asientos.Domain;

public class DetalleAsiento
{
    public Guid Id { get; set; }
    public string CuentaCodigo { get; set; } = string.Empty;
    public decimal Debe { get; set; }
    public decimal Haber { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public Guid AsientoContableId { get; set; }
}
