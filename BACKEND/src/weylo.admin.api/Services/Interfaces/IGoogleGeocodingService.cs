using weylo.admin.api.DTOS;

namespace weylo.admin.api.Services.Interfaces
{
    public interface IGoogleGeocodingService
    {
        Task<CountryGeocodingResult?> GetCountryDetailsAsync(string countryName);
        Task<bool> IsCountrySupportedAsync(string countryCode);
        Task<CityGeocodingResult?> GetCityDetailsByNameAsync(string cityName);
        Task<CityGeocodingResult?> GetCityDetailsAsync(double latitude, double longitude);
    }
}