using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace AccountingService.Models
{
    public class PcgePlanContable
    {
        [JsonPropertyName("plan_contable")]
        public List<PcgeCategory> Cuentas { get; set; } = new List<PcgeCategory>();
    }

    public class PcgeCategory
    {
        [JsonPropertyName("codigo")]
        public string Codigo { get; set; } = string.Empty;

        [JsonPropertyName("nombre")]
        public string Nombre { get; set; } = string.Empty;

        [JsonPropertyName("descripcion")]
        public string Descripcion { get; set; } = string.Empty;

        [JsonPropertyName("cuentas")]
        public List<PcgeCuenta> Cuentas { get; set; } = new List<PcgeCuenta>();
    }

    public class PcgeCuenta
    {
        [JsonPropertyName("codigo")]
        public string Codigo { get; set; } = string.Empty;

        [JsonPropertyName("nombre")]
        public string Nombre { get; set; } = string.Empty;

        [JsonPropertyName("descripcion")]
        public string Descripcion { get; set; } = string.Empty;

        [JsonPropertyName("subcuentas")]
        public List<PcgeSubcuenta> Subcuentas { get; set; } = new List<PcgeSubcuenta>();
    }

    public class PcgeSubcuenta
    {
        [JsonPropertyName("codigo")]
        public string Codigo { get; set; } = string.Empty;

        [JsonPropertyName("nombre")]
        public string Nombre { get; set; } = string.Empty;

        [JsonPropertyName("descripcion")]
        public string Descripcion { get; set; } = string.Empty;

        [JsonPropertyName("divisionarias")]
        public List<PcgeDivisionaria> Divisionarias { get; set; } = new List<PcgeDivisionaria>();
    }

    public class PcgeDivisionaria
    {
        [JsonPropertyName("codigo")]
        public string Codigo { get; set; } = string.Empty;

        [JsonPropertyName("nombre")]
        public string Nombre { get; set; } = string.Empty;

        [JsonPropertyName("descripcion")]
        public string Descripcion { get; set; } = string.Empty;

        [JsonPropertyName("subdivisionarias")]
        public List<PcgeSubdivisionaria> Subdivisionarias { get; set; } = new List<PcgeSubdivisionaria>();
    }

    public class PcgeSubdivisionaria
    {
        [JsonPropertyName("codigo")]
        public string Codigo { get; set; } = string.Empty;

        [JsonPropertyName("nombre")]
        public string Nombre { get; set; } = string.Empty;

        [JsonPropertyName("descripcion")]
        public string Descripcion { get; set; } = string.Empty;
    }
}
