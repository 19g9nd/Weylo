using AutoMapper;
using weylo.shared.Models;
using weylo.user.api.DTOS;
using weylo.user.api.Requests;

namespace weylo.user.api.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Category, CategoryDto>()
                .ForMember(dest => dest.DestinationsCount,
                    opt => opt.MapFrom(src => src.Destinations.Count));

            CreateMap<Country, CountryDto>();
            CreateMap<Destination, DestinationDto>();
            CreateMap<CreateRouteRequest, UserRoute>();
            CreateMap<UpdateRouteRequest, UserRoute>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            CreateMap<UserRoute, RouteDto>()
                .ForMember(dest => dest.TotalDays,
                    opt => opt.MapFrom(src => src.RouteItems.Any() ? src.RouteItems.Max(ri => ri.DayNumber) : 0))
                .ForMember(dest => dest.TotalDestinations,
                    opt => opt.MapFrom(src => src.RouteItems.Count))
                .ForMember(dest => dest.VisitedDestinations,
                    opt => opt.MapFrom(src => src.RouteItems.Count(ri => ri.IsVisited)));

            CreateMap<UserRoute, RouteDetailsDto>()
                .ForMember(dest => dest.TotalDays,
                    opt => opt.MapFrom(src => src.RouteItems.Any() ? src.RouteItems.Max(ri => ri.DayNumber) : 0))
                .ForMember(dest => dest.TotalDestinations,
                    opt => opt.MapFrom(src => src.RouteItems.Count))
                .ForMember(dest => dest.VisitedDestinations,
                    opt => opt.MapFrom(src => src.RouteItems.Count(ri => ri.IsVisited)));

            CreateMap<RouteItem, RouteItemDto>()
                .ForMember(dest => dest.Destination,
                    opt => opt.MapFrom(src => src.Destination));

            // UserFavourite → UserFavouriteDto  
            CreateMap<UserFavourite, UserFavouriteDto>()
                .ForMember(dest => dest.Destination,
                    opt => opt.MapFrom(src => src.Destination));

            CreateMap<City, CityDto>();
            // FilterAttribute → FilterAttributeDto
            CreateMap<FilterAttribute, FilterAttributeDto>();

            // FilterValue → FilterValueDto  
            CreateMap<FilterValue, FilterValueDto>()
                .ForMember(dest => dest.AttributeName,
                    opt => opt.MapFrom(src => src.FilterAttribute.Name))
                .ForMember(dest => dest.DisplayName,
                    opt => opt.MapFrom(src => src.FilterAttribute.DisplayName))
                .ForMember(dest => dest.DataType,
                    opt => opt.MapFrom(src => src.FilterAttribute.DataType));

            // CategoryFilter → CategoryFilterDto
            CreateMap<CategoryFilter, CategoryFilterDto>()
                .ForMember(dest => dest.CategoryName,
                    opt => opt.MapFrom(src => src.Category.Name))
                .ForMember(dest => dest.AttributeName,
                    opt => opt.MapFrom(src => src.FilterAttribute.Name))
                .ForMember(dest => dest.DisplayName,
                    opt => opt.MapFrom(src => src.FilterAttribute.DisplayName))
                .ForMember(dest => dest.DataType,
                    opt => opt.MapFrom(src => src.FilterAttribute.DataType));

            // Requests for Filter management
            CreateMap<CreateCategoryRequest, Category>();
            CreateMap<CreateFilterAttributeRequest, FilterAttribute>();
        }
    }
}