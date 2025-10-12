using weylo.user.api.DTOS;
using weylo.user.api.Requests;

namespace weylo.user.api.Services.Interfaces
{
    public interface IDestinationService
    {
        Task<DestinationDto> GetDestinationAsync(int id);
        Task<IEnumerable<DestinationDto>> GetUserDestinationsAsync();
        Task<IEnumerable<DestinationDto>> GetDestinationsAsync();
        Task<DestinationDto> SavePlaceAsync(SavePlaceRequest request);
        Task<bool> DeleteDestinationAsync(int id);
        Task<IEnumerable<DestinationDto>> SearchDestinationsAsync(string query);
        Task<IEnumerable<DestinationDto>> GetDestinationsByCityAsync(int cityId);
        Task<DestinationDto> UpdateDestinationCacheAsync(int id, UpdateCacheRequest request);
    }
}