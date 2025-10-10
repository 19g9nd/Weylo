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

            CreateMap<AddDestinationToRouteRequest, RouteDestination>();
           
            CreateMap<UpdateRouteDestinationRequest, RouteDestination>()
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            CreateMap<SavePlaceRequest, Destination>()
                .ForMember(dest => dest.GoogleType,
                    opt => opt.MapFrom(src => src.GoogleType ?? "general"))
                .ForMember(dest => dest.CachedAddress,
                    opt => opt.MapFrom(src => src.Address))
                .ForMember(dest => dest.CachedRating,
                    opt => opt.MapFrom(src => src.Rating))
                .ForMember(dest => dest.CachedImageUrl,
                    opt => opt.MapFrom(src => src.ImageUrl))
                .ForMember(dest => dest.CacheUpdatedAt,
                    opt => opt.MapFrom(_ => DateTime.UtcNow))
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CategoryId, opt => opt.Ignore())
                .ForMember(dest => dest.CityId, opt => opt.Ignore())
                .ForMember(dest => dest.Category, opt => opt.Ignore())
                .ForMember(dest => dest.City, opt => opt.Ignore());

            // Entity → DTO
            CreateMap<UserRoute, RouteDto>()
                .ForMember(dest => dest.DestinationsCount,
                           opt => opt.MapFrom(src => src.RouteDestinations.Count))
                .ForMember(dest => dest.VisitedDestinationsCount,
                           opt => opt.MapFrom(src => src.RouteDestinations.Count(rd => rd.IsVisited)));

            CreateMap<UserRoute, RouteDetailsDto>();

            CreateMap<RouteDestination, RouteDestinationDto>();

            CreateMap<Destination, DestinationDto>()
                .ForMember(dest => dest.CategoryName,
                           opt => opt.MapFrom(src => src.Category.Name))
                .ForMember(dest => dest.CityName,
                           opt => opt.MapFrom(src => src.City.Name));
        }
    }
}