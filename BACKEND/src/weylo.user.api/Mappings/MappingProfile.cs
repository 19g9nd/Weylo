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
            // Request → Entity
            CreateMap<CreateRouteRequest, UserRoute>();

            CreateMap<UpdateRouteRequest, UserRoute>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            CreateMap<AddDestinationToRouteRequest, RouteDestination>()
                .ForMember(dest => dest.OrderInDay, opt => opt.MapFrom(src => src.OrderInDay));

            CreateMap<UpdateRouteDestinationRequest, RouteDestination>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            CreateMap<AddDayRequest, RouteDay>();
            CreateMap<UpdateDayRequest, RouteDay>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            CreateMap<SavePlaceRequest, Destination>()
                .ForMember(dest => dest.GoogleType,
                    opt => opt.MapFrom(src =>
                        src.GoogleTypes != null && src.GoogleTypes.Length > 0
                            ? string.Join(",", src.GoogleTypes)
                            : "general"))
                .ForMember(dest => dest.CachedAddress,
                    opt => opt.MapFrom(src => src.Address))
                .ForMember(dest => dest.CachedRating,
                    opt => opt.MapFrom(src => src.Rating))
                .ForMember(dest => dest.CachedImageUrl,
                    opt => opt.MapFrom(src => src.ImageUrl))
                .ForMember(dest => dest.CachedDescription,
                    opt => opt.MapFrom(src => src.Description))
                .ForMember(dest => dest.CacheUpdatedAt,
                    opt => opt.MapFrom(_ => DateTime.UtcNow))
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CategoryId, opt => opt.Ignore())
                .ForMember(dest => dest.CityId, opt => opt.Ignore())
                .ForMember(dest => dest.Category, opt => opt.Ignore())
                .ForMember(dest => dest.City, opt => opt.Ignore())
                .ForMember(dest => dest.UserDestinations, opt => opt.Ignore())
                .ForMember(dest => dest.FilterValues, opt => opt.Ignore());

            // Entity → DTO
            CreateMap<UserRoute, RouteDto>()
                .ForMember(dest => dest.TotalDays,
                    opt => opt.MapFrom(src => src.RouteDays.Count))
                .ForMember(dest => dest.TotalDestinations,
                    opt => opt.MapFrom(src => src.RouteDays.Sum(rd => rd.RouteDestinations.Count)))
                .ForMember(dest => dest.DestinationsCount,
                    opt => opt.MapFrom(src => src.RouteDays.Sum(rd => rd.RouteDestinations.Count)))
                .ForMember(dest => dest.VisitedDestinationsCount,
                    opt => opt.MapFrom(src => src.RouteDays.Sum(rd => rd.RouteDestinations.Count(rd => rd.IsVisited))));

            CreateMap<UserRoute, RouteDetailsDto>();

            CreateMap<RouteDay, RouteDayDto>();

            // RouteDestination → RouteDestinationDto
            CreateMap<RouteDestination, RouteDestinationDto>()
                .ForMember(dest => dest.Destination,
                    opt => opt.MapFrom(src => src.UserDestination.Destination));

            // Destination → DestinationDto
            CreateMap<Destination, DestinationDto>()
                .ForMember(dest => dest.CategoryName,
                    opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : null))
                .ForMember(dest => dest.CityName,
                    opt => opt.MapFrom(src => src.City != null ? src.City.Name : null))
                .ForMember(dest => dest.CountryName,
                    opt => opt.MapFrom(src => src.City != null && src.City.Country != null ? src.City.Country.Name : null))
                .ForMember(dest => dest.CountryCode,
                    opt => opt.MapFrom(src => src.City != null && src.City.Country != null ? src.City.Country.Code : null))
                .ForMember(dest => dest.UsageCount,
                    opt => opt.MapFrom(src => src.UserDestinations.Sum(ud => ud.RouteDestinations.Count)))
                .ForMember(dest => dest.FilterValues,
                    opt => opt.MapFrom(src => src.FilterValues));

            // UserDestination → UserDestinationDto
            CreateMap<UserDestination, UserDestinationDto>()
                .ForMember(dest => dest.Destination,
                    opt => opt.MapFrom(src => src.Destination))
                .ForMember(dest => dest.UsageCount,
                    opt => opt.MapFrom(src => src.RouteDestinations.Count));

            CreateMap<Category, CategoryDto>()
                .ForMember(dest => dest.DestinationsCount,
                    opt => opt.MapFrom(src => src.Destinations.Count));

            CreateMap<City, CityDto>()
                .ForMember(dest => dest.CountryName,
                    opt => opt.MapFrom(src => src.Country != null ? src.Country.Name : null))
                .ForMember(dest => dest.CountryCode,
                    opt => opt.MapFrom(src => src.Country != null ? src.Country.Code : null));

            CreateMap<Country, CountryDto>();

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