using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace weylo.user.api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WeatherController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<WeatherController> _logger;
        private readonly IDistributedCache _cache;
        private static readonly HttpClient _httpClient = new HttpClient();

        public WeatherController(
            IConfiguration configuration, 
            ILogger<WeatherController> logger,
            IDistributedCache cache)
        {
            _configuration = configuration;
            _logger = logger;
            _cache = cache;
        }

        [HttpGet]
        public async Task<IActionResult> GetCityWeather([FromQuery] string city)
        {
            if (string.IsNullOrWhiteSpace(city))
            {
                return BadRequest(new { error = "City parameter is required" });
            }

            // Нормализуем ключ для Redis
            var cacheKey = $"weather:{city.ToLowerInvariant()}";
            
            try
            {
                var cachedData = await _cache.GetStringAsync(cacheKey);
                if (!string.IsNullOrEmpty(cachedData))
                {
                    _logger.LogInformation("Cache hit for city {City}", city);
                    return Content(cachedData, "application/json");
                }

                _logger.LogInformation("Cache miss for city {City}. Fetching from API...", city);
                
                var weatherKey = _configuration["WeatherApiKey"];
                if (string.IsNullOrEmpty(weatherKey))
                {
                    _logger.LogError("Weather API key not configured");
                    return StatusCode(500, new { error = "Weather service not configured" });
                }

                var url = $"http://api.weatherapi.com/v1/current.json?key={weatherKey}&q={city}&aqi=no";
                
                var response = await _httpClient.GetAsync(url);
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Weather API error for city {City}: {StatusCode}", city, response.StatusCode);
                    return StatusCode((int)response.StatusCode, new { error = "Error fetching weather data" });
                }

                var content = await response.Content.ReadAsStringAsync();
                
                var cacheOptions = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(60),
                };
                
                await _cache.SetStringAsync(cacheKey, content, cacheOptions);
                _logger.LogInformation($"Data cached for city {city} with key {cacheKey}");

                return base.Ok(JsonSerializer.Deserialize<object>(content));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching weather for city {City}", city);
                return StatusCode(500, new { error = "Internal server error" });
            }
        }
        
    }
}