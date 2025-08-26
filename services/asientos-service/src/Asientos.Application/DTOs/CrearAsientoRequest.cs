using System;
using System.Collections.Generic;

namespace Asientos.Application.DTOs;

public class CrearAsientoRequest
{
    public DateTime Fecha { get; set; }
    public string Glosa { get; set; } = string.Empty;
    public string UsuarioId { get; set; } = string.Empty;
    public List<DetalleAsientoDto> Detalles { get; set; } = new();
}

public class DetalleAsientoDto
{
    public string CuentaCodigo { get; set; } = string.Empty;
    public decimal Debe { get; set; }
    public decimal Haber { get; set; }
    public string Descripcion { get; set; } = string.Empty;
}
