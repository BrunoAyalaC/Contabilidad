using AutoMapper;
using PlanContable.Application.DTOs;
using PlanContable.Domain.Entities;

namespace PlanContable.Application.Mappings;

/// <summary>
/// Perfil de AutoMapper para las entidades de cuenta contable
/// </summary>
public class CuentaContableProfile : Profile
{
    public CuentaContableProfile()
    {
        // Mapeo de entidad a DTO de respuesta
        CreateMap<CuentaContable, CuentaContableDto>()
            .ForMember(dest => dest.CodigoPadre, opt => opt.MapFrom(src => src.Padre != null ? src.Padre.Codigo : null))
            .ForMember(dest => dest.NombrePadre, opt => opt.MapFrom(src => src.Padre != null ? src.Padre.Nombre : null))
            .ForMember(dest => dest.PathCompleto, opt => opt.MapFrom(src => src.GetPathCompleto()))
            .ForMember(dest => dest.CuentasHijas, opt => opt.MapFrom(src => src.Hijos.OrderBy(h => h.Codigo)));

        // Mapeo de DTO de creación a entidad
        CreateMap<CrearCuentaContableDto, CuentaContable>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.Padre, opt => opt.Ignore())
            .ForMember(dest => dest.Hijos, opt => opt.Ignore())
            .ForMember(dest => dest.FechaCreacion, opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.FechaActualizacion, opt => opt.MapFrom(src => DateTime.UtcNow));

        // Mapeo de DTO de actualización a entidad
        CreateMap<ActualizarCuentaContableDto, CuentaContable>()
            .ForMember(dest => dest.Padre, opt => opt.Ignore())
            .ForMember(dest => dest.Hijos, opt => opt.Ignore())
            .ForMember(dest => dest.FechaCreacion, opt => opt.Ignore())
            .ForMember(dest => dest.FechaActualizacion, opt => opt.MapFrom(src => DateTime.UtcNow));
    }
}
