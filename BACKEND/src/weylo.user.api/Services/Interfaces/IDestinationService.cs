using weylo.user.api.DTOS;
using weylo.user.api.Requests;

namespace weylo.user.api.Services.Interfaces
{
    public interface IDestinationService
    {
        // Каталог мест
        Task<DestinationDto?> GetDestinationAsync(int id);
        Task<IEnumerable<DestinationDto>> GetDestinationsAsync();
        Task<DestinationDto> SavePlaceAsync(SavePlaceRequest request);
        Task<bool> DeleteDestinationAsync(int id);
        Task<IEnumerable<DestinationDto>> SearchDestinationsAsync(string query);
        Task<IEnumerable<DestinationDto>> GetDestinationsByCityAsync(int cityId);
        Task<IEnumerable<DestinationDto>> GetPopularDestinationsAsync(int take = 20);

        // Фавориты пользователя
        Task<IEnumerable<UserFavouriteDto>> GetUserFavouritesAsync();
        Task<UserFavouriteDto> AddToFavouritesAsync(int destinationId);
        Task<bool> RemoveFromFavouritesAsync(int destinationId);
        Task<UserFavouriteDto> UpdateFavouriteAsync(int userFavouriteId, UpdateUserFavouriteRequest request);
    }
}