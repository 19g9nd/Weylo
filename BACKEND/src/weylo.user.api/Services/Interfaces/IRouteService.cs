using weylo.user.api.DTOS;
using weylo.user.api.Requests;

namespace weylo.user.api.Services.Interfaces
{
    public interface IRouteService
    {
        Task<RouteDto> CreateRouteAsync(CreateRouteRequest request);
        Task<RouteItemDto> AddDestinationToRouteAsync(int routeId, AddDestinationToRouteRequest request);
        Task<RouteDetailsDto> GetRouteDetailsAsync(int routeId);
        Task<IEnumerable<RouteDto>> GetUserRoutesAsync();
        Task<bool> DeleteRouteAsync(int routeId);
        Task<bool> RemoveDestinationFromRouteAsync(int routeId, int routeItemId);
        Task<RouteDto> UpdateRouteAsync(int routeId, UpdateRouteRequest request);
        Task<RouteItemDto> UpdateRouteItemAsync(int routeItemId, UpdateRouteItemRequest request);
        Task<bool> ReorderRouteDestinationsAsync(int routeId, int dayNumber, List<int> destinationOrder);
    }
}