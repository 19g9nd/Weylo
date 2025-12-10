using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using weylo.admin.api.Data;
using weylo.admin.api.DTOS;
using weylo.admin.api.Services.Interfaces;
using weylo.shared.Models;

namespace weylo.admin.api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CitiesController : ControllerBase
    {
        private readonly AdminDbContext _context;
        private readonly IGoogleGeocodingService _geocodingService;
        public CitiesController(AdminDbContext context, IGoogleGeocodingService geocodingService)
        {
            _context = context;
            _geocodingService = geocodingService;
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
                    DestinationsCount = _context.Destinations.Count(d => d.CityId == c.Id)
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
        
        [HttpPost("fetch-details")]
        public async Task<ActionResult> FetchCityDetails([FromBody] FetchCityDetailsRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.CityName))
            {
                return BadRequest(new { Message = "City name is required" });
            }

            try
            {

                // Get city details from Google
                var cityDetails = await _geocodingService.GetCityDetailsByNameAsync(request.CityName);

                if (cityDetails == null)
                {
                    return NotFound(new { Message = $"Could not find city '{request.CityName}' in Google Geocoding API" });
                }

                // Check if country is supported
                var country = await _context.Countries
                    .FirstOrDefaultAsync(c => c.Code.ToUpper() == cityDetails.CountryCode.ToUpper());

                if (country == null)
                {
                    return BadRequest(new
                    {
                        Message = $"Country '{cityDetails.CountryName}' ({cityDetails.CountryCode}) is not supported",
                        CityDetails = new
                        {
                            cityDetails.CityName,
                            cityDetails.CountryName,
                            cityDetails.CountryCode,
                            cityDetails.Latitude,
                            cityDetails.Longitude,
                            cityDetails.PlaceId
                        },
                        CountryNotSupported = true
                    });
                }

                // Check if city already exists
                var existingCity = await FindExistingCityAsync(
                    cityDetails.CityName,
                    cityDetails.Latitude,
                    cityDetails.Longitude,
                    country.Id
                );

                if (existingCity != null)
                {
                    return Ok(new
                    {
                        Message = "City already exists",
                        CityExists = true,
                        ExistingCity = new
                        {
                            existingCity.Id,
                            existingCity.Name,
                            existingCity.Latitude,
                            existingCity.Longitude,
                            existingCity.CountryId,
                            CountryName = country.Name,
                            CountryCode = country.Code
                        }
                    });
                }

                // Return detected details for confirmation
                return Ok(new
                {
                    Message = "City details fetched successfully",
                    CityExists = false,
                    CityDetails = new
                    {
                        Name = cityDetails.CityName,
                        Latitude = cityDetails.Latitude,
                        Longitude = cityDetails.Longitude,
                        CountryId = country.Id,
                        CountryName = country.Name,
                        CountryCode = country.Code,
                        GooglePlaceId = cityDetails.PlaceId,
                        FormattedAddress = cityDetails.FormattedAddress
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Error fetching city details", Error = ex.Message });
            }
        }
        [HttpPost("auto-detect")]
        public async Task<ActionResult> AutoDetectAndCreateCity([FromBody] AutoDetectCityRequest request)
        {
            try
            {

                // Use the geocoding service to detect city
                var cityDetails = await _geocodingService.GetCityDetailsAsync(request.Latitude, request.Longitude);

                if (cityDetails == null)
                {
                    return BadRequest(new { Message = "Could not detect city from coordinates" });
                }

                // Check if country exists
                var country = await _context.Countries
                    .FirstOrDefaultAsync(c => c.Code.ToUpper() == cityDetails.CountryCode.ToUpper());

                if (country == null)
                {
                    return BadRequest(new
                    {
                        Message = $"Country '{cityDetails.CountryName}' ({cityDetails.CountryCode}) is not supported",
                        DetectedCity = cityDetails.CityName,
                        DetectedCountry = cityDetails.CountryName,
                        CountryCode = cityDetails.CountryCode,
                        SuggestCountryCreation = true
                    });
                }

                // Check if city already exists
                var existingCity = await FindExistingCityAsync(
                    cityDetails.CityName,
                    cityDetails.Latitude,
                    cityDetails.Longitude,
                    country.Id
                );

                if (existingCity != null)
                {

                    return Ok(new
                    {
                        Message = "City already exists",
                        CityExists = true,
                        City = new
                        {
                            existingCity.Id,
                            existingCity.Name,
                            existingCity.Latitude,
                            existingCity.Longitude,
                            existingCity.CountryId,
                            CountryName = country.Name,
                            CountryCode = country.Code
                        }
                    });
                }

                // Create new city if auto-create is enabled
                if (!request.AutoCreate)
                {
                    return Ok(new
                    {
                        Message = "City detected but not created (auto-create disabled)",
                        CityExists = false,
                        DetectedCity = new
                        {
                            Name = cityDetails.CityName,
                            Latitude = cityDetails.Latitude,
                            Longitude = cityDetails.Longitude,
                            CountryId = country.Id,
                            CountryName = country.Name,
                            CountryCode = country.Code,
                            GooglePlaceId = cityDetails.PlaceId
                        }
                    });
                }

                var newCity = new City
                {
                    Name = NormalizeCityName(cityDetails.CityName),
                    Latitude = cityDetails.Latitude,
                    Longitude = cityDetails.Longitude,
                    CountryId = country.Id,
                    GooglePlaceId = cityDetails.PlaceId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Cities.Add(newCity);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetCity), new { id = newCity.Id }, new
                {
                    Message = "City auto-detected and created successfully",
                    CityExists = false,
                    AutoCreated = true,
                    City = new
                    {
                        newCity.Id,
                        newCity.Name,
                        newCity.Latitude,
                        newCity.Longitude,
                        newCity.CountryId,
                        CountryName = country.Name,
                        CountryCode = country.Code,
                        newCity.GooglePlaceId
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Error auto-detecting city", Error = ex.Message });
            }
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
                return BadRequest(new { Message = "Country not found" });
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

            // FIX: Return the created city with country info
            var createdCity = await _context.Cities
                .Include(c => c.Country)
                .Where(c => c.Id == city.Id)
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
                    c.CreatedAt
                })
                .FirstOrDefaultAsync();

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
                return BadRequest(new { Message = "Country not found" });
            }

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

        // FIX: Load all cities to memory first, then process client-side
        private async Task<int> MergeDuplicateCitiesAsync()
        {
            // Load all cities into memory
            var allCities = await _context.Cities
                .Include(c => c.Country)
                .ToListAsync();

            // Group by normalized name in memory (client-side)
            var duplicates = allCities
                .GroupBy(c => new
                {
                    c.CountryId,
                    NormalizedName = NormalizeCityName(c.Name)
                })
                .Where(g => g.Count() > 1)
                .ToList();

            var mergedCount = 0;

            foreach (var group in duplicates)
            {
                var cities = group.OrderBy(c => c.Id).ToList();
                var primaryCity = cities.First();
                var duplicateIds = cities.Skip(1).Select(c => c.Id).ToList();

                // Update destinations to point to primary city
                var destinationsToUpdate = await _context.Destinations
                    .Where(d => duplicateIds.Contains(d.CityId))
                    .ToListAsync();

                foreach (var destination in destinationsToUpdate)
                {
                    destination.CityId = primaryCity.Id;
                }

                // Delete duplicate cities
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
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int CountryId { get; set; }
        public string GooglePlaceId { get; set; } = string.Empty;
    }

    public class UpdateCityRequest
    {
        public string Name { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int CountryId { get; set; }
        public string GooglePlaceId { get; set; } = string.Empty;
    }

    public class AutoDetectCityRequest
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public bool AutoCreate { get; set; }
    }

    public class FetchCityDetailsRequest
    {
        public string CityName { get; set; } = string.Empty;
    }
}