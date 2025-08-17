using AutoMapper;
using PlanContable.Application.DTOs;
using PlanContable.Application.Interfaces;
using PlanContable.Domain.Entities;
using PlanContable.Domain.Interfaces;

namespace PlanContable.Application.Services;

/// <summary>
/// Implementación del servicio de cuentas contables
/// </summary>
public class CuentaContableService : ICuentaContableService
{
    private readonly ICuentaContableRepository _repository;
    private readonly IMapper _mapper;

    public CuentaContableService(ICuentaContableRepository repository, IMapper mapper)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
    }

    public async Task<IEnumerable<CuentaContableDto>> GetAllAsync()
    {
        var cuentas = await _repository.GetAllAsync();
        return _mapper.Map<IEnumerable<CuentaContableDto>>(cuentas);
    }

    public async Task<CuentaContableDto?> GetByIdAsync(Guid id)
    {
        var cuenta = await _repository.GetByIdAsync(id);
        return cuenta != null ? _mapper.Map<CuentaContableDto>(cuenta) : null;
    }

    public async Task<CuentaContableDto?> GetByCodigoAsync(string codigo)
    {
        if (string.IsNullOrWhiteSpace(codigo))
            throw new ArgumentException("El código no puede estar vacío", nameof(codigo));

        var cuenta = await _repository.GetByCodigoAsync(codigo);
        return cuenta != null ? _mapper.Map<CuentaContableDto>(cuenta) : null;
    }

    public async Task<IEnumerable<CuentaContableDto>> GetArbolCuentasAsync()
    {
        var cuentas = await _repository.GetArbolCuentasAsync();
        return _mapper.Map<IEnumerable<CuentaContableDto>>(cuentas);
    }

    public async Task<IEnumerable<CuentaContableDto>> GetCuentasRaizAsync()
    {
        var cuentas = await _repository.GetCuentasRaizAsync();
        return _mapper.Map<IEnumerable<CuentaContableDto>>(cuentas);
    }

    public async Task<IEnumerable<CuentaContableDto>> GetCuentasHijasAsync(Guid idPadre)
    {
        var cuentas = await _repository.GetCuentasHijasAsync(idPadre);
        return _mapper.Map<IEnumerable<CuentaContableDto>>(cuentas);
    }

    public async Task<IEnumerable<CuentaContableDto>> GetCuentasMovimientoAsync()
    {
        var cuentas = await _repository.GetCuentasMovimientoAsync();
        return _mapper.Map<IEnumerable<CuentaContableDto>>(cuentas);
    }

    public async Task<IEnumerable<CuentaContableDto>> BuscarAsync(string termino)
    {
        if (string.IsNullOrWhiteSpace(termino))
            return Enumerable.Empty<CuentaContableDto>();

        var cuentas = await _repository.BuscarAsync(termino);
        return _mapper.Map<IEnumerable<CuentaContableDto>>(cuentas);
    }

    public async Task<CuentaContableDto> CreateAsync(CrearCuentaContableDto dto)
    {
        if (dto == null)
            throw new ArgumentNullException(nameof(dto));

        // Validar código único
        if (await _repository.ExisteCodigoAsync(dto.Codigo))
            throw new InvalidOperationException($"Ya existe una cuenta con el código '{dto.Codigo}'");

        // Validar cuenta padre si se especifica
        if (dto.IdPadre.HasValue)
        {
            var cuentaPadre = await _repository.GetByIdAsync(dto.IdPadre.Value);
            if (cuentaPadre == null)
                throw new InvalidOperationException("La cuenta padre especificada no existe");
        }

        var cuenta = _mapper.Map<CuentaContable>(dto);
        cuenta.Id = Guid.NewGuid();

        // Validar jerarquía
        if (!cuenta.ValidarJerarquia())
            throw new InvalidOperationException("La jerarquía de cuentas no es válida");

        var cuentaCreada = await _repository.CreateAsync(cuenta);
        await _repository.SaveChangesAsync();

        return _mapper.Map<CuentaContableDto>(cuentaCreada);
    }

    public async Task<CuentaContableDto> UpdateAsync(ActualizarCuentaContableDto dto)
    {
        if (dto == null)
            throw new ArgumentNullException(nameof(dto));

        var cuentaExistente = await _repository.GetByIdAsync(dto.Id);
        if (cuentaExistente == null)
            throw new InvalidOperationException("La cuenta especificada no existe");

        // Validar código único (excluyendo la cuenta actual)
        if (await _repository.ExisteCodigoAsync(dto.Codigo, dto.Id))
            throw new InvalidOperationException($"Ya existe otra cuenta con el código '{dto.Codigo}'");

        // Validar cuenta padre si se especifica
        if (dto.IdPadre.HasValue)
        {
            var cuentaPadre = await _repository.GetByIdAsync(dto.IdPadre.Value);
            if (cuentaPadre == null)
                throw new InvalidOperationException("La cuenta padre especificada no existe");

            // No permitir que la cuenta sea padre de sí misma o de sus ancestros
            if (dto.IdPadre == dto.Id || cuentaExistente.EsAncestorDe(cuentaPadre))
                throw new InvalidOperationException("No se puede establecer una relación jerárquica circular");
        }

        _mapper.Map(dto, cuentaExistente);

        // Validar jerarquía
        if (!cuentaExistente.ValidarJerarquia())
            throw new InvalidOperationException("La jerarquía de cuentas no es válida");

        var cuentaActualizada = await _repository.UpdateAsync(cuentaExistente);
        await _repository.SaveChangesAsync();

        return _mapper.Map<CuentaContableDto>(cuentaActualizada);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var validacion = await ValidarEliminacionAsync(id);
        if (!string.IsNullOrEmpty(validacion))
            throw new InvalidOperationException(validacion);

        var resultado = await _repository.DeleteAsync(id);
        if (resultado)
            await _repository.SaveChangesAsync();

        return resultado;
    }

    public async Task<string> ValidarEliminacionAsync(Guid id)
    {
        var cuenta = await _repository.GetByIdAsync(id);
        if (cuenta == null)
            return "La cuenta especificada no existe";

        // Verificar si tiene cuentas hijas
        var cuentasHijas = await _repository.GetCuentasHijasAsync(id);
        if (cuentasHijas.Any())
            return "No se puede eliminar una cuenta que tiene subcuentas";

        // Verificar si tiene movimientos contables
        if (await _repository.TieneMovimientosAsync(id))
            return "No se puede eliminar una cuenta que tiene movimientos contables asociados";

        return string.Empty; // Puede eliminarse
    }
}
