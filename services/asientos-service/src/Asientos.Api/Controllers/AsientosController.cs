
using Asientos.Application.Services;

using Asientos.Application.DTOs;
using Asientos.Domain;
using Asientos.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Asientos.Api.Controllers;

[ApiController]
[Route("api/v1/asientos")]
[Microsoft.AspNetCore.Authorization.Authorize]
public class AsientosController : ControllerBase
{
    private readonly AsientosDbContext _db;
    private readonly ICuentaContableValidator _cuentaValidator;
    public AsientosController(AsientosDbContext db, ICuentaContableValidator cuentaValidator)
    {
        _db = db;
        _cuentaValidator = cuentaValidator;
    }

    [HttpPost]
    public async Task<IActionResult> CrearAsiento([FromBody] CrearAsientoRequest request)
    {
        if (request.Detalles.Sum(d => d.Debe) != request.Detalles.Sum(d => d.Haber))
            return BadRequest("El asiento no está balanceado (debe != haber)");

        // Validación de amarre de cuentas
        var codigos = request.Detalles.Select(d => d.CuentaCodigo).Distinct().ToList();
        var validaciones = await _cuentaValidator.ValidarCuentasAsync(codigos);
        var cuentasInvalidas = validaciones.Where(kv => !kv.Value.Existe || !kv.Value.EstaActiva || !kv.Value.EsMovimiento)
            .Select(kv => new { Codigo = kv.Key, kv.Value.MensajeError }).ToList();
        if (cuentasInvalidas.Any())
        {
            return BadRequest(new { message = "Existen cuentas inválidas en el asiento", detalles = cuentasInvalidas });
        }

        var asiento = new AsientoContable
        {
            Id = Guid.NewGuid(),
            Fecha = request.Fecha,
            Glosa = request.Glosa,
            UsuarioId = request.UsuarioId,
            Estado = AsientoEstado.Activo,
            Detalles = request.Detalles.Select(d => new DetalleAsiento
            {
                Id = Guid.NewGuid(),
                CuentaCodigo = d.CuentaCodigo,
                Debe = d.Debe,
                Haber = d.Haber,
                Descripcion = d.Descripcion
            }).ToList()
        };

        _db.Asientos.Add(asiento);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAsiento), new { id = asiento.Id }, asiento);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAsiento(Guid id)
    {
        var asiento = await _db.Asientos.Include(a => a.Detalles).FirstOrDefaultAsync(a => a.Id == id);
        if (asiento == null) return NotFound();
        return Ok(asiento);
    }
}
