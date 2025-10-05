using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using weylo.shared.Models;
using weylo.user.api.Controllers.Data;

namespace weylo.user.api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DestinationsController : ControllerBase
    {
        private readonly UserDbContext _context;

        public DestinationsController(UserDbContext context)
        {
            _context = context;
        }

        // DTO for saving a place from frontend
        public class SavePlaceRequest
        {
            public string GooglePlaceId { get; set; } = string.Empty;
            public string Name { get; set; } = string.Empty;
            public decimal Latitude { get; set; }
            public decimal Longitude { get; set; }
            public string? Address { get; set; }
            public string? GoogleType { get; set; }
            public decimal? Rating { get; set; }
            public string? ImageUrl { get; set; }
            public string CityName { get; set; } = string.Empty;
            public string CountryName { get; set; } = string.Empty;
        }

        // POST: api/destinations/save
        [HttpPost("save")]
        public async Task<ActionResult<int>> SavePlace([FromBody] SavePlaceRequest request)
        {
            try
            {
                var existingDestination = await _context.Destinations
                    .FirstOrDefaultAsync(d => d.GooglePlaceId == request.GooglePlaceId);

                if (existingDestination != null)
                {
                    return Ok(existingDestination.Id);
                }

                var normalizedCountryName = request.CountryName.Trim();
                var country = await _context.Countries
                    .FirstOrDefaultAsync(c => c.Name == normalizedCountryName);

                if (country == null)
                {
                    country = new Country
                    {
                        Name = normalizedCountryName,
                        Code = GetCountryCode(normalizedCountryName)
                    };
                    _context.Countries.Add(country);
                    await _context.SaveChangesAsync();
                }

                var normalizedCityName = NormalizeCityName(request.CityName);
                var city = await _context.Cities
                    .FirstOrDefaultAsync(c =>
                        c.CountryId == country.Id &&
                        (c.Name == request.CityName || c.Name == normalizedCityName));

                if (city == null)
                {
                    var cities = await _context.Cities
                        .Where(c => c.CountryId == country.Id)
                        .ToListAsync();

                    city = cities.FirstOrDefault(c =>
                        CalculateDistance(c.Latitude, c.Longitude, request.Latitude, request.Longitude) < 10.0m);

                    if (city == null)
                    {
                        city = new City
                        {
                            Name = normalizedCityName,
                            CountryId = country.Id,
                            Latitude = request.Latitude,
                            Longitude = request.Longitude,
                            GooglePlaceId = request.GooglePlaceId
                        };
                        _context.Cities.Add(city);
                        await _context.SaveChangesAsync();
                    }
                }

                var categoryName = MapGoogleTypeToCategory(request.GoogleType);
                var category = await _context.Categories
                    .FirstOrDefaultAsync(c => c.Name == categoryName);

                if (category == null)
                {
                    category = new Category
                    {
                        Name = categoryName,
                        Description = $"Places of type {categoryName}",
                        GoogleTypes = request.GoogleType
                    };
                    _context.Categories.Add(category);
                    await _context.SaveChangesAsync();
                }

                // 5. Создаем Destination
                var destination = new Destination
                {
                    GooglePlaceId = request.GooglePlaceId,
                    Name = request.Name,
                    Latitude = request.Latitude,
                    Longitude = request.Longitude,
                    CityId = city.Id,
                    GoogleType = request.GoogleType ?? "general",
                    CategoryId = category.Id,
                    CachedAddress = request.Address,
                    CachedRating = request.Rating,
                    CachedImageUrl = request.ImageUrl,
                    CacheUpdatedAt = DateTime.UtcNow
                };

                _context.Destinations.Add(destination);
                await _context.SaveChangesAsync();

                return Ok(destination.Id);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Error saving place", Error = ex.Message });
            }
        }

        // GET: api/destinations/my
        [HttpGet("my")]
        public async Task<ActionResult<List<object>>> GetMyPlaces()
        {
            try
            {
                var destinations = await _context.Destinations
                    .Include(d => d.City)
                        .ThenInclude(c => c.Country)
                    .Include(d => d.Category)
                    .OrderByDescending(d => d.CreatedAt)
                    .Select(d => new
                    {
                        d.Id,
                        d.GooglePlaceId,
                        d.Name,
                        d.Latitude,
                        d.Longitude,
                        d.CachedAddress,
                        d.CachedRating,
                        d.CachedImageUrl,
                        d.GoogleType,
                        CityId = d.City.Id,
                        CityName = d.City.Name,
                        CountryName = d.City.Country.Name,
                        CountryCode = d.City.Country.Code,
                        Category = d.Category.Name,
                        d.CreatedAt
                    })
                    .ToListAsync();

                return Ok(destinations);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Error getting places", Error = ex.Message });
            }
        }

        // GET: api/destinations/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetDestination(int id)
        {
            try
            {
                var destination = await _context.Destinations
                    .Include(d => d.City)
                        .ThenInclude(c => c.Country)
                    .Include(d => d.Category)
                    .Where(d => d.Id == id)
                    .Select(d => new
                    {
                        d.Id,
                        d.GooglePlaceId,
                        d.Name,
                        d.Latitude,
                        d.Longitude,
                        d.CachedAddress,
                        d.CachedDescription,
                        d.CachedRating,
                        d.CachedImageUrl,
                        d.GoogleType,
                        CityId = d.City.Id,
                        CityName = d.City.Name,
                        CountryName = d.City.Country.Name,
                        CountryCode = d.City.Country.Code,
                        Category = d.Category.Name,
                        d.CreatedAt,
                        d.CacheUpdatedAt
                    })
                    .FirstOrDefaultAsync();

                if (destination == null)
                {
                    return NotFound();
                }

                return Ok(destination);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Error getting destination", Error = ex.Message });
            }
        }

        // DELETE: api/destinations/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDestination(int id)
        {
            try
            {
                var destination = await _context.Destinations.FindAsync(id);
                if (destination == null)
                {
                    return NotFound();
                }

                // Проверяем, не используется ли в маршрутах
                var isUsedInRoutes = await _context.Set<RouteDestination>()
                    .AnyAsync(rd => rd.DestinationId == id);

                if (isUsedInRoutes)
                {
                    return BadRequest(new
                    {
                        Message = "Cannot delete destination that is used in routes",
                        DestinationId = id
                    });
                }

                _context.Destinations.Remove(destination);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Error deleting destination", Error = ex.Message });
            }
        }

        // GET: api/destinations/by-city/5
        [HttpGet("by-city/{cityId}")]
        public async Task<ActionResult<List<object>>> GetDestinationsByCity(int cityId)
        {
            try
            {
                var destinations = await _context.Destinations
                    .Include(d => d.Category)
                    .Where(d => d.CityId == cityId)
                    .OrderByDescending(d => d.CachedRating)
                    .Select(d => new
                    {
                        d.Id,
                        d.GooglePlaceId,
                        d.Name,
                        d.Latitude,
                        d.Longitude,
                        d.CachedAddress,
                        d.CachedRating,
                        d.CachedImageUrl,
                        d.GoogleType,
                        // City = d.City.Name,
                        Category = d.Category.Name,
                        d.CreatedAt
                    })
                    .ToListAsync();

                return Ok(destinations);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Error getting destinations by city", Error = ex.Message });
            }
        }

        // GET: api/destinations/search?query=museum
        [HttpGet("search")]
        public async Task<ActionResult<List<object>>> SearchDestinations([FromQuery] string query)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query))
                {
                    return BadRequest("Query parameter is required");
                }

                var searchTerm = query.ToLower().Trim();

                var destinations = await _context.Destinations
                    .Include(d => d.City)
                        .ThenInclude(c => c.Country)
                    .Include(d => d.Category)
                    .Where(d =>
                        d.Name.ToLower().Contains(searchTerm) ||
                        d.CachedAddress.ToLower().Contains(searchTerm) ||
                        d.City.Name.ToLower().Contains(searchTerm))
                    .OrderByDescending(d => d.CachedRating)
                    .Select(d => new
                    {
                        d.Id,
                        d.GooglePlaceId,
                        d.Name,
                        d.Latitude,
                        d.Longitude,
                        d.CachedAddress,
                        d.CachedRating,
                        d.CachedImageUrl,
                        d.GoogleType,
                        CityName = d.City.Name,
                        CountryName = d.City.Country.Name,
                        Category = d.Category.Name
                    })
                    .Take(50)
                    .ToListAsync();

                return Ok(destinations);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Error searching destinations", Error = ex.Message });
            }
        }

        // PUT: api/destinations/5/cache
        [HttpPut("{id}/cache")]
        public async Task<IActionResult> UpdateDestinationCache(int id, [FromBody] UpdateCacheRequest request)
        {
            try
            {
                var destination = await _context.Destinations.FindAsync(id);
                if (destination == null)
                {
                    return NotFound();
                }

                destination.CachedDescription = request.Description;
                destination.CachedRating = request.Rating;
                destination.CachedImageUrl = request.ImageUrl;
                destination.CachedAddress = request.Address;
                destination.CacheUpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = "Error updating cache", Error = ex.Message });
            }
        }

        // Helper methods

        private string NormalizeCityName(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return name;

            var normalized = name.Trim();

            var unifiedNames = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "Bakı", "Baku" },
                { "Moskva", "Moscow" },
                { "Roma", "Rome" },
                { "Firenze", "Florence" },
                { "Wien", "Vienna" },
                { "Praha", "Prague" },
                { "Metropolitan City of Venice", "Venice" },
                { "Venezia", "Venice" }
            };

            return unifiedNames.ContainsKey(normalized)
                ? unifiedNames[normalized]
                : normalized;
        }

        private string GetCountryCode(string countryName)
        {
            var countryCodes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "Azerbaijan", "AZ" },
                { "United States", "US" },
                { "United Kingdom", "GB" },
                { "Germany", "DE" },
                { "France", "FR" },
                { "Turkey", "TR" },
                { "Russia", "RU" },
                { "Italy", "IT" },
                { "Spain", "ES" },
                { "Portugal", "PT" },
                { "Greece", "GR" },
                { "Austria", "AT" },
                { "Czech Republic", "CZ" },
                { "Poland", "PL" },
                { "Netherlands", "NL" },
                { "Belgium", "BE" },
                { "Switzerland", "CH" }
            };

            return countryCodes.GetValueOrDefault(countryName, "XX");
        }

        private string MapGoogleTypeToCategory(string? googleType)
        {
            if (string.IsNullOrWhiteSpace(googleType))
                return "General";

            var categoryMapping = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "museum", "Culture" },
                { "art_gallery", "Culture" },
                { "tourist_attraction", "Tourist Attractions" },
                { "point_of_interest", "Tourist Attractions" },
                { "restaurant", "Food & Drink" },
                { "cafe", "Food & Drink" },
                { "bar", "Food & Drink" },
                { "park", "Nature & Parks" },
                { "natural_feature", "Nature & Parks" },
                { "shopping_mall", "Shopping" },
                { "store", "Shopping" },
                { "church", "Religious Sites" },
                { "mosque", "Religious Sites" },
                { "synagogue", "Religious Sites" },
                { "lodging", "Accommodation" },
                { "hotel", "Accommodation" },
                { "night_club", "Nightlife" },
                { "amusement_park", "Entertainment" },
                { "zoo", "Entertainment" },
                { "aquarium", "Entertainment" }
            };

            return categoryMapping.GetValueOrDefault(googleType, "General");
        }

        private decimal CalculateDistance(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
        {
            const decimal EARTH_RADIUS_KM = 6371.0m;

            var dLat = (lat2 - lat1) * (decimal)Math.PI / 180.0m;
            var dLon = (lon2 - lon1) * (decimal)Math.PI / 180.0m;

            var a = (decimal)Math.Sin((double)dLat / 2.0) * (decimal)Math.Sin((double)dLat / 2.0) +
                    (decimal)Math.Cos((double)lat1 * Math.PI / 180.0) *
                    (decimal)Math.Cos((double)lat2 * Math.PI / 180.0) *
                    (decimal)Math.Sin((double)dLon / 2.0) * (decimal)Math.Sin((double)dLon / 2.0);

            var c = 2.0m * (decimal)Math.Atan2(Math.Sqrt((double)a), Math.Sqrt(1.0 - (double)a));

            return EARTH_RADIUS_KM * c;
        }

        // DTO for updating cache
        public class UpdateCacheRequest
        {
            public string? Description { get; set; }
            public decimal? Rating { get; set; }
            public string? ImageUrl { get; set; }
            public string? Address { get; set; }
        }
    }
}