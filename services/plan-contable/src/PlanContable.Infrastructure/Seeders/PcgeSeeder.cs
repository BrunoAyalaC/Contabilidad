using System.Globalization;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PlanContable.Domain.Entities;
using PlanContable.Infrastructure.Data;

namespace PlanContable.Infrastructure.Seeders;

/// <summary>
/// Seeder para importar el catálogo completo del Plan Contable General Empresarial (PCGE) 2019
/// Implementa idempotencia y validación exhaustiva
/// </summary>
public class PcgeSeeder
{
    private readonly PlanContableDbContext _context;
    private readonly ILogger<PcgeSeeder> _logger;

    public PcgeSeeder(PlanContableDbContext context, ILogger<PcgeSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Importa el catálogo PCGE desde archivo JSON
    /// </summary>
    public async Task<SeedResult> SeedAsync(string jsonFilePath, CancellationToken cancellationToken = default)
    {
        var result = new SeedResult();
        List<CuentaPcgeDto>? cuentasData = null;

        try
        {
            _logger.LogInformation("Iniciando importación del catálogo PCGE desde: {FilePath}", jsonFilePath);

            // Verificar que el archivo existe
            if (!File.Exists(jsonFilePath))
            {
                var error = $"El archivo del catálogo PCGE no existe: {jsonFilePath}";
                _logger.LogError(error);
                result.Errores.Add(error);
                return result;
            }

            // Leer y parsear el archivo JSON
            var cuentasJson = await File.ReadAllTextAsync(jsonFilePath, cancellationToken);
            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                PropertyNameCaseInsensitive = true
            };
            cuentasData = JsonSerializer.Deserialize<List<CuentaPcgeDto>>(cuentasJson, options);

            if (cuentasData == null || !cuentasData.Any())
            {
                var error = "El archivo JSON está vacío o no contiene cuentas válidas";
                _logger.LogError(error);
                result.Errores.Add(error);
                return result;
            }

            _logger.LogInformation("Archivo JSON parseado correctamente. {Count} cuentas encontradas", cuentasData.Count);

            // Validar datos antes de insertar
            var validationResult = ValidarDatos(cuentasData);
            if (!validationResult.EsValido)
            {
                result.Errores.AddRange(validationResult.Errores);
                return result;
            }

            // Verificar cuentas existentes para idempotencia
            var codigosExistentes = await _context.CuentasContables
                .Where(c => cuentasData.Select(d => d.Codigo).Contains(c.Codigo))
                .Select(c => c.Codigo)
                .ToListAsync(cancellationToken);

            var cuentasNuevas = cuentasData
                .Where(c => !codigosExistentes.Contains(c.Codigo))
                .ToList();

            if (!cuentasNuevas.Any())
            {
                _logger.LogInformation("Todas las cuentas ya existen en la base de datos. No hay nada que importar.");
                result.CuentasExistentes = cuentasData.Count;
                return result;
            }

            _logger.LogInformation("{NuevasCount} cuentas nuevas por importar. {ExistentesCount} ya existen",
                cuentasNuevas.Count, codigosExistentes.Count);

            // Importar en transacción
            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                // Insertar cuentas ordenadas por nivel para respetar dependencias
                var cuentasPorNivel = cuentasNuevas
                    .OrderBy(c => c.Nivel)
                    .ThenBy(c => c.Codigo)
                    .ToList();

                var cuentasCreadas = new Dictionary<string, CuentaContable>();

                foreach (var cuentaData in cuentasPorNivel)
                {
                    var cuenta = await CrearCuentaAsync(cuentaData, cuentasCreadas, cancellationToken);
                    if (cuenta != null)
                    {
                        cuentasCreadas[cuentaData.Codigo] = cuenta;
                        result.CuentasImportadas++;
                    }
                    else
                    {
                        result.Errores.Add($"Error al crear la cuenta {cuentaData.Codigo}");
                    }
                }

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                _logger.LogInformation("Importación completada exitosamente. {Count} cuentas importadas",
                    result.CuentasImportadas);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "Error durante la importación. Transacción revertida.");
                result.Errores.Add($"Error de transacción: {ex.Message}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado durante la importación del catálogo PCGE");
            result.Errores.Add($"Error inesperado: {ex.Message}");
        }

        result.CuentasExistentes = (cuentasData?.Count ?? 0) - result.CuentasImportadas;
        return result;
    }

    private ValidationResult ValidarDatos(List<CuentaPcgeDto> cuentas)
    {
        var result = new ValidationResult();
        var errores = new List<string>();

        // Verificar unicidad de códigos
        var codigosDuplicados = cuentas
            .GroupBy(c => c.Codigo)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .ToList();

        if (codigosDuplicados.Any())
        {
            errores.Add($"Códigos duplicados encontrados: {string.Join(", ", codigosDuplicados)}");
        }

        // Validar estructura de datos
        foreach (var cuenta in cuentas)
        {
            if (string.IsNullOrWhiteSpace(cuenta.Codigo))
                errores.Add("Cuenta con código vacío encontrada");

            if (string.IsNullOrWhiteSpace(cuenta.Nombre))
                errores.Add($"Cuenta {cuenta.Codigo} sin nombre");

            if (string.IsNullOrWhiteSpace(cuenta.Elemento))
                errores.Add($"Cuenta {cuenta.Codigo} sin elemento");

            if (cuenta.Nivel < 1 || cuenta.Nivel > 5)
                errores.Add($"Cuenta {cuenta.Codigo} con nivel inválido: {cuenta.Nivel}");

            // Validar coherencia código-elemento
            if (!string.IsNullOrWhiteSpace(cuenta.Codigo) &&
                !string.IsNullOrWhiteSpace(cuenta.Elemento) &&
                !cuenta.Codigo.StartsWith(cuenta.Elemento))
            {
                errores.Add($"Cuenta {cuenta.Codigo}: el código no coincide con el elemento {cuenta.Elemento}");
            }
        }

        // Validar códigos duplicados
        var duplicados = cuentas
            .GroupBy(c => c.Codigo)
            .Where(g => g.Count() > 1)
            .Select(g => new { Codigo = g.Key, Count = g.Count() })
            .ToList();

        foreach (var duplicado in duplicados)
        {
            errores.Add($"Código duplicado: {duplicado.Codigo} aparece {duplicado.Count} veces");
        }

        // Validar jerarquías solo si no hay duplicados
        if (!duplicados.Any())
        {
            var cuentasPorCodigo = cuentas.ToDictionary(c => c.Codigo);
            foreach (var cuenta in cuentas.Where(c => !string.IsNullOrWhiteSpace(c.PadreCodigo)))
            {
                if (cuenta.PadreCodigo != null && !cuentasPorCodigo.ContainsKey(cuenta.PadreCodigo))
                {
                    errores.Add($"Cuenta {cuenta.Codigo}: padre {cuenta.PadreCodigo} no encontrado");
                }
            }
        }

        result.Errores = errores;
        result.EsValido = !errores.Any();
        return result;
    }

    private async Task<CuentaContable?> CrearCuentaAsync(
        CuentaPcgeDto cuentaData,
        Dictionary<string, CuentaContable> cuentasCreadas,
        CancellationToken cancellationToken)
    {
        try
        {
            var cuenta = new CuentaContable
            {
                Id = Guid.NewGuid(),
                Codigo = cuentaData.Codigo,
                Nombre = cuentaData.Nombre,
                Descripcion = cuentaData.Descripcion,
                Elemento = cuentaData.Elemento,
                Nivel = cuentaData.Nivel,
                EsMovimiento = cuentaData.EsMovimiento,
                EstaActivo = cuentaData.EstaActivo,
                FechaCreacion = DateTime.UtcNow,
                FechaActualizacion = DateTime.UtcNow
            };

            // Establecer relación padre-hijo
            if (!string.IsNullOrWhiteSpace(cuentaData.PadreCodigo))
            {
                // Buscar padre en las cuentas ya creadas en esta sesión
                if (cuentasCreadas.TryGetValue(cuentaData.PadreCodigo, out var padreEnSesion))
                {
                    cuenta.PadreId = padreEnSesion.Id;
                    cuenta.Padre = padreEnSesion;
                }
                else
                {
                    // Buscar padre en la base de datos
                    var padreExistente = await _context.CuentasContables
                        .FirstOrDefaultAsync(c => c.Codigo == cuentaData.PadreCodigo, cancellationToken);

                    if (padreExistente != null)
                    {
                        cuenta.PadreId = padreExistente.Id;
                    }
                    else
                    {
                        _logger.LogWarning("No se encontró la cuenta padre {PadreCodigo} para la cuenta {Codigo}",
                            cuentaData.PadreCodigo, cuentaData.Codigo);
                    }
                }
            }

            _context.CuentasContables.Add(cuenta);
            return cuenta;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al crear la cuenta {Codigo}", cuentaData.Codigo);
            return null;
        }
    }
}

/// <summary>
/// DTO para deserializar datos del catálogo PCGE desde JSON
/// </summary>
public class CuentaPcgeDto
{
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string Elemento { get; set; } = string.Empty;
    public int Nivel { get; set; }
    public string? PadreCodigo { get; set; }
    public bool EsMovimiento { get; set; }
    public bool EstaActivo { get; set; } = true;
}

/// <summary>
/// Resultado de la operación de seeding
/// </summary>
public class SeedResult
{
    public int CuentasImportadas { get; set; }
    public int CuentasExistentes { get; set; }
    public List<string> Errores { get; set; } = new();
    public bool EsExitoso => !Errores.Any();
    public int TotalProcesadas => CuentasImportadas + CuentasExistentes;
}

/// <summary>
/// Resultado de validación de datos
/// </summary>
public class ValidationResult
{
    public bool EsValido { get; set; }
    public List<string> Errores { get; set; } = new();
}
