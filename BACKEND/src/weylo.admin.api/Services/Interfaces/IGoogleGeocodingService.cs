namespace weylo.admin.api.Services.Interfaces
{
    public interface IGoogleGeocodingService
    {
         Task<CountryGeocodingResult?> GetCountryDetailsAsync(string countryName);
        Task<bool> IsCountrySupportedAsync(string countryCode);
    }
}