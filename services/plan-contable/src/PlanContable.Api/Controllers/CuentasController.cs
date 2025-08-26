using Microsoft.AspNetCore.Mvc;
using PlanContable.Infrastructure.Services;
using PlanContable.Domain.Entities;

namespace PlanContable.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class CuentasController : ControllerBase
{
    private readonly ICuentaContableService _service;
    private readonly ILogger<CuentasController> _logger;

    public CuentasController(ICuentaContableService service, ILogger<CuentasController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var cuentas = await _service.ObtenerTodasLasCuentasAsync(cancellationToken);
        return Ok(cuentas);
    }

    [HttpGet("codigo/{codigo}")]
    public async Task<IActionResult> GetByCodigo(string codigo, CancellationToken cancellationToken)
    {
        var cuenta = await _service.ObtenerCuentaPorCodigoAsync(codigo, cancellationToken);
        if (cuenta == null) return NotFound();
        return Ok(cuenta);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var cuenta = await _service.ObtenerCuentaPorIdAsync(id, cancellationToken);
        if (cuenta == null) return NotFound();
        return Ok(cuenta);
    }

    [HttpGet("raiz")]
    public async Task<IActionResult> GetRaiz(CancellationToken cancellationToken)
    {
        var cuentas = await _service.ObtenerCuentasRaizAsync(cancellationToken);
        return Ok(cuentas);
    }

    [HttpGet("hijas/{padreId:guid}")]
    public async Task<IActionResult> GetHijas(Guid padreId, CancellationToken cancellationToken)
    {
        var cuentas = await _service.ObtenerCuentasHijasAsync(padreId, cancellationToken);
        return Ok(cuentas);
    }
}
