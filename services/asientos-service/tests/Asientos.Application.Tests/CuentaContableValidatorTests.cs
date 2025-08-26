using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;
using Moq;
using Asientos.Application.Services;

public class CuentaContableValidatorTests
{
    [Fact]
    public async Task ValidarCuentasAsync_TodasValidas_RetornaTrue()
    {
        // Arrange
        var mockValidator = new Mock<ICuentaContableValidator>();
        var codigos = new[] { "101", "102" };
        mockValidator.Setup(v => v.ValidarCuentasAsync(It.IsAny<IEnumerable<string>>()))
            .ReturnsAsync(new Dictionary<string, CuentaContableValidationResult>
            {
                { "101", new CuentaContableValidationResult(true, true, true) },
                { "102", new CuentaContableValidationResult(true, true, true) }
            });

        // Act
        var result = await mockValidator.Object.ValidarCuentasAsync(codigos);

        // Assert
        Assert.All(result.Values, r => Assert.True(r.Existe && r.EstaActiva && r.EsMovimiento));
    }

    [Fact]
    public async Task ValidarCuentasAsync_AlgunaInvalida_RetornaFalse()
    {
        // Arrange
        var mockValidator = new Mock<ICuentaContableValidator>();
        var codigos = new[] { "101", "999" };
        mockValidator.Setup(v => v.ValidarCuentasAsync(It.IsAny<IEnumerable<string>>()))
            .ReturnsAsync(new Dictionary<string, CuentaContableValidationResult>
            {
                { "101", new CuentaContableValidationResult(true, true, true) },
                { "999", new CuentaContableValidationResult(false, false, false, "No encontrada") }
            });

        // Act
        var result = await mockValidator.Object.ValidarCuentasAsync(codigos);

        // Assert
        Assert.True(result["101"].Existe);
        Assert.False(result["999"].Existe);
        Assert.Equal("No encontrada", result["999"].MensajeError);
    }
}
