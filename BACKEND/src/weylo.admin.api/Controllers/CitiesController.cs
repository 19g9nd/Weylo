using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using weylo.admin.api.Data;
using weylo.shared.Models;

namespace weylo.admin.api.Controllers
{
    [ApiController]
    [Route("api/admin/[controller]")]
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

            var existingCity = await FindExistingCityAsync(request.Name, request.Latitude, request.Longitude, request.CountryId, id);
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

        private async Task<City?> FindExistingCityAsync(string name, decimal latitude, decimal longitude, int countryId, int? excludeId = null)
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
                CalculateDistance(c.Latitude, c.Longitude, latitude, longitude) < 10.0m);

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
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public int CountryId { get; set; }
        public string GooglePlaceId { get; set; } = string.Empty;
    }

    public class UpdateCityRequest
    {
        public string Name { get; set; } = string.Empty;
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public int CountryId { get; set; }
        public string GooglePlaceId { get; set; } = string.Empty;
    }
}