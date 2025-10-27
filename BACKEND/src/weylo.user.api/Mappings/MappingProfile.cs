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
                // ИЗМЕНИЛ: UserDestinations → UserFavourites
                .ForMember(dest => dest.UserFavourites, opt => opt.Ignore())
                .ForMember(dest => dest.FilterValues, opt => opt.Ignore())
                // ДОБАВИЛ: RouteItems ignore
                .ForMember(dest => dest.RouteItems, opt => opt.Ignore());


            CreateMap<Category, CategoryDto>()
                .ForMember(dest => dest.DestinationsCount,
                    opt => opt.MapFrom(src => src.Destinations.Count));

            CreateMap<Country, CountryDto>();
            // Destination → DestinationDto
            CreateMap<Destination, DestinationDto>();
            // В MappingProfile.cs добавить:
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

            // City → CityDto - УЖЕ РАБОТАЕТ, ничего не меняем
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