using System.ComponentModel.DataAnnotations;

namespace PlanContable.Domain.Entities;

/// <summary>
/// Representa una cuenta contable según el Plan Contable General Empresarial (PCGE) de Perú.
/// Implementa una estructura jerárquica que soporta hasta 5 niveles de profundidad.
/// </summary>
public class CuentaContable
{
    public Guid Id { get; set; }

    /// <summary>
    /// Código único de la cuenta según PCGE (ej: 10, 101, 1011, 10111, etc.)
    /// Soporta hasta 5 dígitos según estándar PCGE 2019
    /// </summary>
    [Required]
    [StringLength(10)]
    public string Codigo { get; set; } = string.Empty;

    /// <summary>
    /// Nombre descriptivo de la cuenta según nomenclatura oficial PCGE
    /// </summary>
    [Required]
    [StringLength(500)]
    public string Nombre { get; set; } = string.Empty;

    /// <summary>
    /// Descripción detallada opcional de la cuenta
    /// </summary>
    [StringLength(1000)]
    public string? Descripcion { get; set; }

    /// <summary>
    /// Elemento del PCGE al que pertenece (0-9)
    /// 1,2,3=Activo; 4=Pasivo; 5=Patrimonio; 6=Gastos; 7=Ingresos; 8=Saldos; 9=Costos; 0=Orden
    /// </summary>
    [Required]
    [StringLength(1)]
    public string Elemento { get; set; } = string.Empty;

    /// <summary>
    /// Nivel jerárquico en el plan contable según PCGE
    /// 1=Elemento/Cuenta, 2=Subcuenta, 3=Divisionaria, 4=Subdivisionaria, 5=Específica
    /// </summary>
    [Range(1, 5)]
    public int Nivel { get; set; }

    /// <summary>
    /// ID de la cuenta padre (null para cuentas de nivel 1)
    /// </summary>
    public Guid? PadreId { get; set; }

    /// <summary>
    /// Navegación a la cuenta padre
    /// </summary>
    public virtual CuentaContable? Padre { get; set; }

    /// <summary>
    /// Navegación a las cuentas hijas
    /// </summary>
    public virtual ICollection<CuentaContable> Hijos { get; set; } = new List<CuentaContable>();

    /// <summary>
    /// Indica si esta cuenta permite movimientos contables directos
    /// true=Cuenta de movimiento (puede recibir asientos), false=Cuenta de agrupación
    /// </summary>
    public bool EsMovimiento { get; set; }

    /// <summary>
    /// Estado de la cuenta en el sistema
    /// </summary>
    public bool EstaActivo { get; set; } = true;

    /// <summary>
    /// Fecha de creación del registro
    /// </summary>
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Fecha de última actualización
    /// </summary>
    public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Usuario que creó el registro
    /// </summary>
    public Guid? CreadoPorUsuarioId { get; set; }

    /// <summary>
    /// Usuario que actualizó el registro por última vez
    /// </summary>
    public Guid? ActualizadoPorUsuarioId { get; set; }

    /// <summary>
    /// Obtiene el path completo de la cuenta (ej: "1 > 10 > 101 > 1011")
    /// </summary>
    public string GetPathCompleto()
    {
        var path = new List<string>();
        var cuentaActual = this;

        while (cuentaActual != null)
        {
            path.Insert(0, $"{cuentaActual.Codigo}");
            cuentaActual = cuentaActual.Padre;
        }

        return string.Join(" > ", path);
    }

    /// <summary>
    /// Obtiene la descripción completa con jerarquía
    /// </summary>
    public string GetDescripcionCompleta()
    {
        var path = new List<string>();
        var cuentaActual = this;

        while (cuentaActual != null)
        {
            path.Insert(0, $"{cuentaActual.Codigo} - {cuentaActual.Nombre}");
            cuentaActual = cuentaActual.Padre;
        }

        return string.Join(" > ", path);
    }

    /// <summary>
    /// Determina si esta cuenta es ancestro de otra cuenta
    /// </summary>
    public bool EsAncestorDe(CuentaContable cuenta)
    {
        var cuentaActual = cuenta.Padre;
        while (cuentaActual != null)
        {
            if (cuentaActual.Id == this.Id)
                return true;
            cuentaActual = cuentaActual.Padre;
        }
        return false;
    }

    /// <summary>
    /// Determina si esta cuenta es descendiente de otra cuenta
    /// </summary>
    public bool EsDescendienteDe(CuentaContable cuenta)
    {
        return cuenta.EsAncestorDe(this);
    }

    /// <summary>
    /// Valida que no se cree un ciclo en la jerarquía
    /// </summary>
    public bool ValidarJerarquia()
    {
        if (PadreId == null) return true;
        if (PadreId == Id) return false; // No puede ser padre de sí mismo

        // Verificar que el padre no sea descendiente de esta cuenta
        var cuentaPadre = Padre;
        while (cuentaPadre != null)
        {
            if (cuentaPadre.Id == Id)
                return false; // Ciclo detectado
            cuentaPadre = cuentaPadre.Padre;
        }

        return true;
    }

    /// <summary>
    /// Obtiene el tipo de elemento según PCGE
    /// </summary>
    public string GetTipoElemento()
    {
        return Elemento switch
        {
            "1" or "2" or "3" => "Activo",
            "4" => "Pasivo",
            "5" => "Patrimonio",
            "6" => "Gastos por Naturaleza",
            "7" => "Ingresos",
            "8" => "Saldos Intermediarios",
            "9" => "Contabilidad Analítica",
            "0" => "Cuentas de Orden",
            _ => "Desconocido"
        };
    }

    /// <summary>
    /// Determina si es una cuenta de balance (Activo, Pasivo, Patrimonio)
    /// </summary>
    public bool EsCuentaDeBalance()
    {
        return Elemento is "1" or "2" or "3" or "4" or "5";
    }

    /// <summary>
    /// Determina si es una cuenta de resultados (Ingresos, Gastos)
    /// </summary>
    public bool EsCuentaDeResultados()
    {
        return Elemento is "6" or "7";
    }

    /// <summary>
    /// Valida que el código cumpla con el estándar PCGE
    /// </summary>
    public bool ValidarCodigoPCGE()
    {
        if (string.IsNullOrWhiteSpace(Codigo))
            return false;

        // El código debe ser numérico
        if (!Codigo.All(char.IsDigit))
            return false;

        // El primer dígito debe coincidir con el elemento
        if (Codigo.Length > 0 && Codigo[0].ToString() != Elemento)
            return false;

        // La longitud debe coincidir con el nivel
        return Codigo.Length == Nivel || (Nivel == 1 && Codigo.Length <= 2);
    }
}
