using Asientos.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;
using Moq;
using Asientos.Api.Controllers;
using Asientos.Application.DTOs;
using Asientos.Application.Services;
using Asientos.Domain;
using Asientos.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

public class AsientosControllerTests
{
    [Fact]
    public async Task CrearAsiento_AsientoBalanceadoYValido_CreaCorrectamente()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AsientosDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        using var db = new AsientosDbContext(options);
        var mockValidator = new Mock<ICuentaContableValidator>();
        mockValidator.Setup(v => v.ValidarCuentasAsync(It.IsAny<IEnumerable<string>>()))
            .ReturnsAsync(new Dictionary<string, CuentaContableValidationResult>
            {
                { "101", new CuentaContableValidationResult(true, true, true) },
                { "102", new CuentaContableValidationResult(true, true, true) }
            });
        var controller = new AsientosController(db, mockValidator.Object);
        var request = new CrearAsientoRequest
        {
            Fecha = DateTime.UtcNow,
            Glosa = "Test",
            UsuarioId = "user1",
            Detalles = new List<DetalleAsientoDto>
            {
                new() { CuentaCodigo = "101", Debe = 100, Haber = 0, Descripcion = "" },
                new() { CuentaCodigo = "102", Debe = 0, Haber = 100, Descripcion = "" }
            }
        };

        // Act
        var result = await controller.CrearAsiento(request);

        // Assert
        var created = Assert.IsType<CreatedAtActionResult>(result);
        Assert.NotNull(created.Value);
    }

    [Fact]
    public async Task CrearAsiento_AsientoNoBalanceado_RetornaBadRequest()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AsientosDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        using var db = new AsientosDbContext(options);
        var mockValidator = new Mock<ICuentaContableValidator>();
        var controller = new AsientosController(db, mockValidator.Object);
        var request = new CrearAsientoRequest
        {
            Fecha = DateTime.UtcNow,
            Glosa = "Test",
            UsuarioId = "user1",
            Detalles = new List<DetalleAsientoDto>
            {
                new() { CuentaCodigo = "101", Debe = 100, Haber = 0, Descripcion = "" },
                new() { CuentaCodigo = "102", Debe = 0, Haber = 50, Descripcion = "" }
            }
        };

        // Act
        var result = await controller.CrearAsiento(request);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task CrearAsiento_CuentaInvalida_RetornaBadRequest()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AsientosDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        using var db = new AsientosDbContext(options);
        var mockValidator = new Mock<ICuentaContableValidator>();
        mockValidator.Setup(v => v.ValidarCuentasAsync(It.IsAny<IEnumerable<string>>()))
            .ReturnsAsync(new Dictionary<string, CuentaContableValidationResult>
            {
                { "101", new CuentaContableValidationResult(true, true, true) },
                { "999", new CuentaContableValidationResult(false, false, false, "No encontrada") }
            });
        var controller = new AsientosController(db, mockValidator.Object);
        var request = new CrearAsientoRequest
        {
            Fecha = DateTime.UtcNow,
            Glosa = "Test",
            UsuarioId = "user1",
            Detalles = new List<DetalleAsientoDto>
            {
                new() { CuentaCodigo = "101", Debe = 100, Haber = 0, Descripcion = "" },
                new() { CuentaCodigo = "999", Debe = 0, Haber = 100, Descripcion = "" }
            }
        };

        // Act
        var result = await controller.CrearAsiento(request);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("cuentas inválidas", badRequest.Value.ToString());
    }
}
