using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Linq;

namespace Asientos.Application.Services;

/// <summary>
/// Implementación que consulta el microservicio de plan contable vía HTTP.
/// </summary>
public class CuentaContableValidatorHttp : ICuentaContableValidator
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<CuentaContableValidatorHttp> _logger;
    private readonly string _planContableApiBaseUrl;

    public CuentaContableValidatorHttp(HttpClient httpClient, ILogger<CuentaContableValidatorHttp> logger, IConfiguration config)
    {
        _httpClient = httpClient;
        _logger = logger;
        _planContableApiBaseUrl = config["PlanContableApi:BaseUrl"] ?? throw new System.Exception("PlanContableApi:BaseUrl no configurado");
    }

    public async Task<IDictionary<string, CuentaContableValidationResult>> ValidarCuentasAsync(IEnumerable<string> codigos)
    {
        var results = new Dictionary<string, CuentaContableValidationResult>();
        foreach (var codigo in codigos.Distinct())
        {
            try
            {
                var url = $"{_planContableApiBaseUrl.TrimEnd('/')}/api/v1/cuentas/{codigo}";
                var response = await _httpClient.GetAsync(url);
                if (!response.IsSuccessStatusCode)
                {
                    results[codigo] = new CuentaContableValidationResult(false, false, false, $"No encontrada o error HTTP: {response.StatusCode}");
                    continue;
                }
                var cuenta = await response.Content.ReadFromJsonAsync<CuentaContableDto>();
                if (cuenta == null)
                {
                    results[codigo] = new CuentaContableValidationResult(false, false, false, "No encontrada");
                    continue;
                }
                if (!cuenta.EstaActivo)
                {
                    results[codigo] = new CuentaContableValidationResult(true, false, cuenta.EsMovimiento, "Cuenta inactiva");
                    continue;
                }
                if (!cuenta.EsMovimiento)
                {
                    results[codigo] = new CuentaContableValidationResult(true, true, false, "Cuenta no permite movimientos");
                    continue;
                }
                results[codigo] = new CuentaContableValidationResult(true, true, true);
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Error validando cuenta {Codigo}", codigo);
                results[codigo] = new CuentaContableValidationResult(false, false, false, ex.Message);
            }
        }
        return results;
    }

    private class CuentaContableDto
    {
        public string Codigo { get; set; } = string.Empty;
        public bool EstaActivo { get; set; }
        public bool EsMovimiento { get; set; }
    }
}
