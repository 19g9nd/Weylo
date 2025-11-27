using Microsoft.AspNetCore.Mvc;

namespace weylo.user.api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WeatherController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<WeatherController> _logger;
        private static readonly HttpClient _httpClient = new HttpClient();

        public WeatherController(IConfiguration configuration, ILogger<WeatherController> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetCityWeather([FromQuery] string city)
        {
            if (string.IsNullOrWhiteSpace(city))
            {
                return BadRequest(new { error = "City parameter is required" });
            }

            try
            {
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
                return Content(content, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching weather for city {City}", city);
                return StatusCode(500, new { error = "Internal server error" });
            }
        }
    }
}