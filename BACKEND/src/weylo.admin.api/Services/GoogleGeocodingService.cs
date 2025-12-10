using System.Text.Json;
using System.Text.Json.Serialization;
using weylo.admin.api.DTOS;
using weylo.admin.api.Services.Interfaces;

namespace weylo.admin.api.Services
{
    public class GoogleGeocodingService : IGoogleGeocodingService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly ILogger<GoogleGeocodingService> _logger;
        private readonly string _baseUrl = "https://maps.googleapis.com/maps/api/geocode/json";

        public GoogleGeocodingService(HttpClient httpClient, IConfiguration configuration, ILogger<GoogleGeocodingService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _apiKey = configuration["GoogleMaps:ApiKey"] ?? throw new InvalidOperationException("Google Maps API key is not configured");
        }

        public async Task<CountryGeocodingResult?> GetCountryDetailsAsync(string countryName)
        {
            if (string.IsNullOrWhiteSpace(countryName))
                throw new ArgumentException("Country name cannot be empty", nameof(countryName));

            try
            {
                _logger.LogInformation("[GoogleGeocodingService] Fetching country details for: {CountryName}", countryName);

                var url = $"{_baseUrl}?address={Uri.EscapeDataString(countryName)}&key={_apiKey}";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var jsonContent = await response.Content.ReadAsStringAsync();
                _logger.LogDebug("[GoogleGeocodingService] Raw API response: {Response}", jsonContent);

                var geoResponse = JsonSerializer.Deserialize<GoogleGeocodingResponse>(jsonContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (geoResponse?.Status != "OK" || geoResponse.Results?.Count == 0)
                {
                    _logger.LogWarning("[GoogleGeocodingService] No results for country: {CountryName}", countryName);
                    return null;
                }

                var result = geoResponse.Results.First();

                var countryComponent = result.AddressComponents?
                    .FirstOrDefault(ac => ac.Types != null && ac.Types.Contains("country"));

                if (countryComponent == null)
                {
                    _logger.LogWarning("[GoogleGeocodingService] Could not find country component for: {CountryName}", countryName);
                    return null;
                }

                // Take bounds if available else viewport
                var bounds = result.Geometry?.Bounds ?? result.Geometry?.Viewport;
                if (bounds == null)
                {
                    _logger.LogWarning("[GoogleGeocodingService] No bounds or viewport for country: {CountryName}", countryName);
                    return null;
                }

                var countryCode = countryComponent.ShortName;
                var formattedAddress = result.FormattedAddress;
                var countryFullName = countryComponent.LongName;

                _logger.LogInformation("[GoogleGeocodingService] Country fetched: {CountryName} ({CountryCode})", countryFullName, countryCode);
                _logger.LogInformation("[GoogleGeocodingService] Bounds: South={South}, West={West}, North={North}, East={East}",
                    bounds.Southwest.Lat, bounds.Southwest.Lng, bounds.Northeast.Lat, bounds.Northeast.Lng);

                return new CountryGeocodingResult
                {
                    PlaceId = result.PlaceId,
                    CountryName = countryFullName,
                    CountryCode = countryCode,
                    FormattedAddress = formattedAddress,
                    SouthBound = bounds.Southwest.Lat,
                    WestBound = bounds.Southwest.Lng,
                    NorthBound = bounds.Northeast.Lat,
                    EastBound = bounds.Northeast.Lng
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GoogleGeocodingService] Error fetching country details for {CountryName}", countryName);
                return null;
            }
        }

        public async Task<bool> IsCountrySupportedAsync(string countryCode)
        {
            if (string.IsNullOrWhiteSpace(countryCode)) return false;

            try
            {
                var url = $"{_baseUrl}?components=country:{countryCode.ToUpper()}&key={_apiKey}";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var jsonContent = await response.Content.ReadAsStringAsync();
                var geoResponse = JsonSerializer.Deserialize<GoogleGeocodingResponse>(jsonContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                return geoResponse?.Status == "OK" && geoResponse.Results?.Any() == true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[GoogleGeocodingService] Error checking country support for {CountryCode}", countryCode);
                return false;
            }
        }
        public async Task<CityGeocodingResult?> GetCityDetailsByNameAsync(string cityName)
        {
            if (string.IsNullOrWhiteSpace(cityName))
                throw new ArgumentException("City name cannot be empty", nameof(cityName));

            try
            {
                _logger.LogInformation("[GoogleGeocodingService] Fetching city details for: {CityName}", cityName);

                var url = $"{_baseUrl}?address={Uri.EscapeDataString(cityName)}&key={_apiKey}";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var jsonContent = await response.Content.ReadAsStringAsync();
                _logger.LogDebug("[GoogleGeocodingService] Raw API response: {Response}", jsonContent);

                var geoResponse = JsonSerializer.Deserialize<GoogleGeocodingResponse>(jsonContent,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (geoResponse?.Status != "OK" || geoResponse.Results?.Count == 0)
                {
                    _logger.LogWarning("[GoogleGeocodingService] No results for city: {CityName}", cityName);
                    return null;
                }

                var result = geoResponse.Results.First();

                // Extract city (locality)
                var cityComponent = result.AddressComponents?
                    .FirstOrDefault(ac => ac.Types != null && ac.Types.Contains("locality"));

                if (cityComponent == null)
                {
                    _logger.LogWarning("[GoogleGeocodingService] Could not find city component for: {CityName}", cityName);
                    return null;
                }

                // Extract country
                var countryComponent = result.AddressComponents?
                    .FirstOrDefault(ac => ac.Types != null && ac.Types.Contains("country"));

                if (countryComponent == null)
                {
                    _logger.LogWarning("[GoogleGeocodingService] Could not find country component");
                    return null;
                }

                var cityLocation = result.Geometry?.Location;
                if (cityLocation == null)
                {
                    _logger.LogWarning("[GoogleGeocodingService] No location data for city");
                    return null;
                }

                var detectedCityName = cityComponent.LongName;
                var countryName = countryComponent.LongName;
                var countryCode = countryComponent.ShortName;

                _logger.LogInformation("[GoogleGeocodingService] City detected: {CityName}, {CountryName} ({CountryCode})",
                    detectedCityName, countryName, countryCode);

                return new CityGeocodingResult
                {
                    PlaceId = result.PlaceId,
                    CityName = detectedCityName,
                    CountryName = countryName,
                    CountryCode = countryCode,
                    Latitude = cityLocation.Lat,
                    Longitude = cityLocation.Lng,
                    FormattedAddress = result.FormattedAddress
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GoogleGeocodingService] Error fetching city details for {CityName}", cityName);
                return null;
            }
        }
        public async Task<CityGeocodingResult?> GetCityDetailsAsync(double latitude, double longitude)
        {
            try
            {
                _logger.LogInformation("[GoogleGeocodingService] Reverse geocoding for coordinates: {Lat}, {Lng}",
                    latitude, longitude);

                var url = $"{_baseUrl}?latlng={latitude},{longitude}&key={_apiKey}&result_type=locality";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var jsonContent = await response.Content.ReadAsStringAsync();
                _logger.LogDebug("[GoogleGeocodingService] Raw API response: {Response}", jsonContent);

                var geoResponse = JsonSerializer.Deserialize<GoogleGeocodingResponse>(jsonContent,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (geoResponse?.Status != "OK" || geoResponse.Results?.Count == 0)
                {
                    _logger.LogWarning("[GoogleGeocodingService] No results for coordinates: {Lat}, {Lng}",
                        latitude, longitude);
                    return null;
                }

                var result = geoResponse.Results.First();

                // Extract city (locality)
                var cityComponent = result.AddressComponents?
                    .FirstOrDefault(ac => ac.Types != null && ac.Types.Contains("locality"));

                if (cityComponent == null)
                {
                    _logger.LogWarning("[GoogleGeocodingService] Could not find city component for coordinates");
                    return null;
                }

                // Extract country
                var countryComponent = result.AddressComponents?
                    .FirstOrDefault(ac => ac.Types != null && ac.Types.Contains("country"));

                if (countryComponent == null)
                {
                    _logger.LogWarning("[GoogleGeocodingService] Could not find country component");
                    return null;
                }

                var cityLocation = result.Geometry?.Location;
                if (cityLocation == null)
                {
                    _logger.LogWarning("[GoogleGeocodingService] No location data for city");
                    return null;
                }

                var cityName = cityComponent.LongName;
                var countryName = countryComponent.LongName;
                var countryCode = countryComponent.ShortName;

                _logger.LogInformation("[GoogleGeocodingService] City detected: {CityName}, {CountryName} ({CountryCode})",
                    cityName, countryName, countryCode);

                return new CityGeocodingResult
                {
                    PlaceId = result.PlaceId,
                    CityName = cityName,
                    CountryName = countryName,
                    CountryCode = countryCode,
                    Latitude = cityLocation.Lat,
                    Longitude = cityLocation.Lng,
                    FormattedAddress = result.FormattedAddress
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[GoogleGeocodingService] Error detecting city for coordinates");
                return null;
            }
        }
    }

    // DTOs
    public class CountryGeocodingResult
    {
        public string PlaceId { get; set; } = string.Empty;
        public string FormattedAddress { get; set; } = string.Empty;
        public string CountryName { get; set; } = string.Empty;
        public string CountryCode { get; set; } = string.Empty;
        public double SouthBound { get; set; }
        public double WestBound { get; set; }
        public double NorthBound { get; set; }
        public double EastBound { get; set; }
    }

    public class GoogleGeocodingResponse
    {
        [JsonPropertyName("results")]
        public List<GoogleGeocodingResult>? Results { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("error_message")]
        public string? ErrorMessage { get; set; }
    }

    public class GoogleGeocodingResult
    {
        [JsonPropertyName("place_id")]
        public string PlaceId { get; set; } = string.Empty;

        [JsonPropertyName("formatted_address")]
        public string FormattedAddress { get; set; } = string.Empty;

        [JsonPropertyName("types")]
        public List<string>? Types { get; set; }

        [JsonPropertyName("address_components")]
        public List<AddressComponent>? AddressComponents { get; set; }

        [JsonPropertyName("geometry")]
        public GoogleGeometry? Geometry { get; set; }
    }

    public class AddressComponent
    {
        [JsonPropertyName("long_name")]
        public string LongName { get; set; } = string.Empty;

        [JsonPropertyName("short_name")]
        public string ShortName { get; set; } = string.Empty;

        [JsonPropertyName("types")]
        public List<string>? Types { get; set; }
    }

    public class GoogleGeometry
    {
        [JsonPropertyName("bounds")]
        public GoogleViewport? Bounds { get; set; }

        [JsonPropertyName("viewport")]
        public GoogleViewport? Viewport { get; set; }

        [JsonPropertyName("location")]
        public GoogleLocation? Location { get; set; }

        [JsonPropertyName("location_type")]
        public string LocationType { get; set; } = string.Empty;
    }

    public class GoogleViewport
    {
        [JsonPropertyName("northeast")]
        public GoogleLocation Northeast { get; set; } = new();

        [JsonPropertyName("southwest")]
        public GoogleLocation Southwest { get; set; } = new();
    }

    public class GoogleLocation
    {
        [JsonPropertyName("lat")]
        public double Lat { get; set; }

        [JsonPropertyName("lng")]
        public double Lng { get; set; }
    }
}
