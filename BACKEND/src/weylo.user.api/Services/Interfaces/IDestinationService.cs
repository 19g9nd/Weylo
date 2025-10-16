using weylo.user.api.DTOS;
using weylo.user.api.Requests;

namespace weylo.user.api.Services.Interfaces
{
    public interface IDestinationService
    {
        Task<DestinationDto?> GetDestinationAsync(int id);
        Task<IEnumerable<UserDestinationDto>> GetUserDestinationsAsync();
        Task<IEnumerable<DestinationDto>> GetDestinationsAsync();
        Task<DestinationDto> SavePlaceAsync(SavePlaceRequest request);
        Task<bool> DeleteDestinationAsync(int id);
        Task<IEnumerable<DestinationDto>> SearchDestinationsAsync(string query);
        Task<IEnumerable<DestinationDto>> GetDestinationsByCityAsync(int cityId);
        Task<DestinationDto?> UpdateDestinationCacheAsync(int id, UpdateCacheRequest request);
        Task<UserDestinationDto> AddDestinationToUserAsync(int destinationId);
        Task<bool> RemoveDestinationFromUserAsync(int destinationId);
        Task<UserDestinationDto> UpdateUserDestinationAsync(int userDestinationId, UpdateUserDestinationRequest request);
        Task<UserDestinationDto> ToggleFavoriteAsync(int userDestinationId);
        Task<IEnumerable<DestinationDto>> GetPopularDestinationsAsync(int take = 20);
    }
}