using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using weylo.admin.api.Data;
using weylo.shared.Models;

namespace weylo.admin.api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CitiesController : ControllerBase
    {
        private readonly AdminDbContext _context;

        public CitiesController(AdminDbContext context)
        {
            _context = context;
        }

        // GET: api/admin/cities
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetCities()
        {
            var cities = await _context.Cities
                .Include(c => c.Country)
                .OrderBy(c => c.Country.Name)
                .ThenBy(c => c.Name)
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.Latitude,
                    c.Longitude,
                    c.CountryId,
                    CountryName = c.Country.Name,
                    CountryCode = c.Country.Code,
                    c.GooglePlaceId,
                    c.CreatedAt,
                    DestinationsCount = _context.Destinations.Count(d => d.CityId == c.Id) // Добавили подсчет destinations
                })
                .ToListAsync();

            return Ok(cities);
        }

        // GET: api/admin/cities/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetCity(int id)
        {
            var city = await _context.Cities
                .Include(c => c.Country)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (city == null)
            {
                return NotFound();
            }

            var destinationsCount = await _context.Destinations.CountAsync(d => d.CityId == id);

            return new
            {
                city.Id,
                city.Name,
                city.Latitude,
                city.Longitude,
                city.CountryId,
                CountryName = city.Country.Name,
                CountryCode = city.Country.Code,
                city.GooglePlaceId,
                city.CreatedAt,
                DestinationsCount = destinationsCount
            };
        }

        [HttpGet("{cityId}/map-data")]
        public async Task<IActionResult> GetCityMapData(int cityId)
        {
            try
            {
                var city = await _context.Cities
                    .Include(c => c.Country)
                    .Where(c => c.Id == cityId)
                    .Select(c => new
                    {
                        c.Id,
                        c.Name,
                        c.Latitude,
                        c.Longitude,
                        CountryName = c.Country.Name,
                        CountryCode = c.Country.Code
                    })
                    .FirstOrDefaultAsync();

                if (city == null)
                    return NotFound();

                var destinations = await _context.Destinations
                    .Include(d => d.Category)
                    .Where(d => d.CityId == cityId)
                    .Select(d => new
                    {
                        d.Id,
                        d.Name,
                        d.Latitude,
                        d.Longitude,
                        d.CachedAddress,
                        d.CachedRating,
                        d.CachedImageUrl,
                        CategoryId = d.Category.Id,
                        CategoryName = d.Category.Name,
                        CategoryIcon = d.Category.Icon,
                        d.GoogleType
                    })
                    .ToListAsync();

                var availableCategories = await _context.Destinations
                    .Where(d => d.CityId == cityId)
                    .GroupBy(d => new { d.Category.Id, d.Category.Name })
                    .Select(g => new
                    {
                        g.Key.Id,
                        g.Key.Name,
                        Count = g.Count()
                    })
                    .OrderByDescending(x => x.Count)
                    .ToListAsync();

                var result = new
                {
                    City = city,
                    Destinations = destinations,
                    AvailableCategories = availableCategories
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetCityMapData: {ex.Message}");
                return StatusCode(500, new { Message = "Internal server error", Error = ex.Message });
            }
        }

        // GET: api/cities/{cityId}/destinations?categoryIds=1,2,3&search=keyword
        [HttpGet("{cityId}/destinations")]
        public async Task<IActionResult> GetFilteredDestinations(
                    int cityId,
                    [FromQuery] string? categoryIds = null,
                    [FromQuery] string? search = null)
        {
            try
            {
                if (!await _context.Cities.AnyAsync(c => c.Id == cityId))
                    return NotFound(new { Message = "City not found" });

                var query = _context.Destinations
                    .Include(d => d.Category)
                    .Where(d => d.CityId == cityId)
                    .AsNoTracking();

                // Фильтрация по категориям с валидацией
                if (!string.IsNullOrEmpty(categoryIds))
                {
                    if (!categoryIds.Split(',').All(id => int.TryParse(id, out _)))
                        return BadRequest(new { Message = "Invalid category IDs format" });

                    var categories = categoryIds.Split(',').Select(int.Parse).ToList();

                    // Проверка существования категорий
                    var existingCategories = await _context.Categories
                        .Where(c => categories.Contains(c.Id))
                        .Select(c => c.Id)
                        .ToListAsync();

                    var invalidCategories = categories.Except(existingCategories).ToList();
                    if (invalidCategories.Any())
                        return BadRequest(new { Message = $"Invalid category IDs: {string.Join(",", invalidCategories)}" });

                    query = query.Where(d => categories.Contains(d.CategoryId));
                }

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var normalizedSearch = search.Trim();

                    query = query.Where(d =>
                        EF.Functions.ILike(d.Name, $"%{normalizedSearch}%") ||
                        (d.CachedAddress != null && EF.Functions.ILike(d.CachedAddress, $"%{normalizedSearch}%"))
                    );
                }

                var destinations = await query
                    .OrderBy(d => d.Name)
                    .Select(d => new
                    {
                        d.Id,
                        d.Name,
                        d.Latitude,
                        d.Longitude,
                        d.CachedAddress,
                        d.CachedRating,
                        d.CachedImageUrl,
                        CategoryName = d.Category.Name,
                        d.GoogleType
                    })
                    .ToListAsync();

                return Ok(destinations);
            }
            catch (Exception)
            {
                return StatusCode(500, new { Message = "Error filtering destinations for city", CityId = cityId });
            }
        }

        // POST: api/admin/cities
        [HttpPost]
        public async Task<ActionResult<City>> PostCity(CreateCityRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (!await _context.Countries.AnyAsync(c => c.Id == request.CountryId))
            {
                return BadRequest("Country not found");
            }

            var existingCity = await FindExistingCityAsync(request.Name, request.Latitude, request.Longitude, request.CountryId);
            if (existingCity != null)
            {
                return Conflict(new
                {
                    Message = "City already exists",
                    ExistingCity = new
                    {
                        existingCity.Id,
                        existingCity.Name,
                        existingCity.Latitude,
                        existingCity.Longitude
                    }
                });
            }

            var city = new City
            {
                Name = NormalizeCityName(request.Name),
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                CountryId = request.CountryId,
                GooglePlaceId = request.GooglePlaceId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Cities.Add(city);
            await _context.SaveChangesAsync();

            var createdCity = await _context.Cities
                .Include(c => c.Country)
                .FirstOrDefaultAsync(c => c.Id == city.Id);

            return CreatedAtAction(nameof(GetCity), new { id = city.Id }, createdCity);
        }

        // PUT: api/admin/cities/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCity(int id, UpdateCityRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var city = await _context.Cities.FindAsync(id);
            if (city == null)
            {
                return NotFound();
            }

            if (!await _context.Countries.AnyAsync(c => c.Id == request.CountryId))
            {
                return BadRequest("Country not found");
            }

            // var existingCity = await FindExistingCityAsync(request.Name, request.Latitude, request.Longitude, request.CountryId, id);
            // if (existingCity != null)
            // {
            //     return Conflict(new
            //     {
            //         Message = "Another city with similar data already exists",
            //         ExistingCity = new
            //         {
            //             existingCity.Id,
            //             existingCity.Name,
            //             existingCity.Latitude,
            //             existingCity.Longitude
            //         }
            //     });
            // }

            city.Name = NormalizeCityName(request.Name);
            city.Latitude = request.Latitude;
            city.Longitude = request.Longitude;
            city.CountryId = request.CountryId;
            city.GooglePlaceId = request.GooglePlaceId;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CityExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/admin/cities/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCity(int id)
        {
            var city = await _context.Cities.FindAsync(id);
            if (city == null)
            {
                return NotFound();
            }

            var hasDestinations = await _context.Destinations.AnyAsync(d => d.CityId == id);
            if (hasDestinations)
            {
                return BadRequest(new
                {
                    Message = "Cannot delete city that has destinations",
                    DestinationsCount = await _context.Destinations.CountAsync(d => d.CityId == id)
                });
            }

            _context.Cities.Remove(city);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/admin/cities/merge-duplicates
        [HttpPost("merge-duplicates")]
        public async Task<ActionResult> MergeDuplicateCities()
        {
            try
            {
                var mergedCount = await MergeDuplicateCitiesAsync();
                return Ok(new
                {
                    Message = $"Successfully merged {mergedCount} duplicate cities",
                    MergedCount = mergedCount
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Error merging duplicates", Error = ex.Message });
            }
        }

        // Helper methods

        private async Task<City?> FindExistingCityAsync(string name, double latitude, double longitude, int countryId, int? excludeId = null)
        {
            var normalizedName = NormalizeCityName(name);

            var query = _context.Cities
                .Where(c => c.CountryId == countryId);

            if (excludeId.HasValue)
            {
                query = query.Where(c => c.Id != excludeId.Value);
            }

            var cities = await query.ToListAsync();

            var byName = cities.FirstOrDefault(c =>
                NormalizeCityName(c.Name).Equals(normalizedName, StringComparison.OrdinalIgnoreCase));

            if (byName != null) return byName;

            var byCoordinates = cities.FirstOrDefault(c =>
                CalculateDistance(c.Latitude, c.Longitude, latitude, longitude) < 10.0);

            return byCoordinates;
        }

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
            };

            return unifiedNames.ContainsKey(normalized)
                ? unifiedNames[normalized]
                : normalized;
        }

        private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            const double EARTH_RADIUS_KM = 6371.0;

            var dLat = (lat2 - lat1) * Math.PI / 180.0;
            var dLon = (lon2 - lon1) * Math.PI / 180.0;

            var a = Math.Sin(dLat / 2.0) * Math.Sin(dLat / 2.0) +
                    Math.Cos(lat1 * Math.PI / 180.0) *
                    Math.Cos(lat2 * Math.PI / 180.0) *
                    Math.Sin(dLon / 2.0) * Math.Sin(dLon / 2.0);

            var c = 2.0 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1.0 - a));

            return EARTH_RADIUS_KM * c;
        }

        private async Task<int> MergeDuplicateCitiesAsync()
        {
            var duplicates = await _context.Cities
                .Include(c => c.Country)
                .GroupBy(c => new
                {
                    c.CountryId,
                    NormalizedName = NormalizeCityName(c.Name)
                })
                .Where(g => g.Count() > 1)
                .ToListAsync();

            var mergedCount = 0;

            foreach (var group in duplicates)
            {
                var cities = group.OrderBy(c => c.Id).ToList();
                var primaryCity = cities.First();
                var duplicateIds = cities.Skip(1).Select(c => c.Id).ToList();

                // IMPORTANT: UPDATE Destinations BEFORE CITIES DELETE
                var destinationsToUpdate = await _context.Destinations
                    .Where(d => duplicateIds.Contains(d.CityId))
                    .ToListAsync();

                foreach (var destination in destinationsToUpdate)
                {
                    destination.CityId = primaryCity.Id;
                }

                // Delete city duplicates
                foreach (var duplicateCity in cities.Skip(1))
                {
                    _context.Cities.Remove(duplicateCity);
                    mergedCount++;
                }
            }

            await _context.SaveChangesAsync();
            return mergedCount;
        }

        private bool CityExists(int id)
        {
            return _context.Cities.Any(e => e.Id == id);
        }
    }

    // DTO
    public class CreateCityRequest
    {
        public string Name { get; set; } = string.Empty;
        public double Latitude { get; set; }  // ← decimal → double
        public double Longitude { get; set; } // ← decimal → double
        public int CountryId { get; set; }
        public string GooglePlaceId { get; set; } = string.Empty;
    }

    public class UpdateCityRequest
    {
        public string Name { get; set; } = string.Empty;
        public double Latitude { get; set; }  // ← decimal → double
        public double Longitude { get; set; } // ← decimal → double
        public int CountryId { get; set; }
        public string GooglePlaceId { get; set; } = string.Empty;
    }
}