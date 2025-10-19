// using weylo.user.api.DTOS;
// using weylo.user.api.Requests;

// namespace weylo.user.api.Services.Interfaces
// {
//     public interface IRouteService
//     {
//         Task<RouteDto> CreateRouteAsync(CreateRouteRequest request);
//         Task<RouteDto> UpdateRouteAsync(int routeId, UpdateRouteRequest request);
//         Task<bool> DeleteRouteAsync(int routeId);
//         Task<RouteDetailsDto> GetRouteDetailsAsync(int routeId);
//         Task<IEnumerable<RouteDto>> GetUserRoutesAsync();

//         Task<RouteDestinationDto> AddDestinationToRouteAsync(int routeId, AddDestinationToRouteRequest request);
//         Task<bool> RemoveDestinationFromRouteAsync(int routeId, int destinationId);
//         Task<RouteDestinationDto> UpdateRouteDestinationAsync(int routeDestinationId, UpdateRouteDestinationRequest request);
//         Task<bool> ReorderRouteDestinationsAsync(int routeId, List<int> destinationOrder);

//         // Days management
//         Task<RouteDayDto> AddDayToRouteAsync(int routeId, AddDayRequest request);
//         Task<bool> RemoveDayFromRouteAsync(int routeId, int dayNumber);
//         Task<RouteDayDto> UpdateDayAsync(int routeDayId, UpdateDayRequest request);
//         Task<RouteDestinationDto> MoveDestinationToDayAsync(int routeDestinationId, MoveDestinationRequest request);
//     }
// }