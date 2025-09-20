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

                var country = await _context.Countries
                    .FirstOrDefaultAsync(c => c.Name == request.CountryName);

                if (country == null)
                {
                    country = new Country
                    {
                        Name = request.CountryName,
                        Code = GetCountryCode(request.CountryName) 
                    };
                    _context.Countries.Add(country);
                    await _context.SaveChangesAsync();
                }

                var city = await _context.Cities
                    .FirstOrDefaultAsync(c => c.Name == request.CityName && c.CountryId == country.Id);

                if (city == null)
                {
                    city = new City
                    {
                        Name = request.CityName,
                        CountryId = country.Id,
                        Latitude = request.Latitude,
                        Longitude = request.Longitude,
                        GooglePlaceId = $"city_{request.GooglePlaceId}" 
                    };
                    _context.Cities.Add(city);
                    await _context.SaveChangesAsync();
                }

                var defaultCategory = await _context.Categories
                    .FirstOrDefaultAsync(c => c.Name == "General");

                if (defaultCategory == null)
                {
                    defaultCategory = new Category
                    {
                        Name = "General",
                        Description = "General places"
                    };
                    _context.Categories.Add(defaultCategory);
                    await _context.SaveChangesAsync();
                }

                var destination = new Destination
                {
                    GooglePlaceId = request.GooglePlaceId,
                    Name = request.Name,
                    Latitude = request.Latitude,
                    Longitude = request.Longitude,
                    CityId = city.Id,
                    GoogleType = request.GoogleType ?? "general",
                    CategoryId = defaultCategory.Id,
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
                return BadRequest($"Error saving place: {ex.Message}");
            }
        }

        private string GetCountryCode(string countryName)
        {
            var countryCodes = new Dictionary<string, string>
            {
                { "Azerbaijan", "AZ" },
                { "United States", "US" },
                { "United Kingdom", "UK" },
                { "Germany", "DE" },
                { "France", "FR" },
                { "Turkey", "TR" },
                { "Russia", "RU" }
            };

            return countryCodes.GetValueOrDefault(countryName, "XX");
        }

        // Get User Places/Destinations (for now without linked user)
        [HttpGet("my")]
        public async Task<ActionResult<List<object>>> GetMyPlaces()
        {
            try
            {
                var destinations = await _context.Destinations
                    .Include(d => d.City)
                    .Include(d => d.Category)
                    .OrderByDescending(d => d.CreatedAt)
                    .Take(50) // Ограничиваем результат
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
                        City = d.City.Name,
                        Category = d.Category.Name,
                        d.CreatedAt
                    })
                    .ToListAsync();

                return Ok(destinations);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error getting places: {ex.Message}");
            }
        }
    }
}