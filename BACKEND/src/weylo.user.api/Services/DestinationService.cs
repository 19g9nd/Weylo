using AutoMapper;
using Microsoft.EntityFrameworkCore;
using weylo.shared.Models;
using weylo.user.api.Controllers.Data;
using weylo.user.api.DTOS;
using weylo.user.api.Requests;
using weylo.user.api.Services.Interfaces;

namespace weylo.user.api.Services
{
    public class DestinationService : IDestinationService
    {
        private readonly UserDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IMapper _mapper;

        public DestinationService(UserDbContext context, ICurrentUserService currentUserService, IMapper mapper)
        {
            _context = context;
            _currentUserService = currentUserService;
            _mapper = mapper;
        }

        public async Task<DestinationDto> SavePlaceAsync(SavePlaceRequest request)
        {
            var existingDestination = await _context.Destinations
                .FirstOrDefaultAsync(d => d.GooglePlaceId == request.GooglePlaceId);

            if (existingDestination != null)
                return _mapper.Map<DestinationDto>(existingDestination);

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

            var destination = _mapper.Map<Destination>(request);
            destination.CityId = city.Id;
            destination.CategoryId = category.Id;


            _context.Destinations.Add(destination);
            await _context.SaveChangesAsync();

            return _mapper.Map<DestinationDto>(destination);
        }

        public async Task<IEnumerable<DestinationDto>> GetDestinationsAsync()
        {
            var destinations = await _context.Destinations
                .Include(d => d.City)
                    .ThenInclude(c => c.Country)
                .Include(d => d.Category)
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();

            return _mapper.Map<IEnumerable<DestinationDto>>(destinations);
        }

        public async Task<DestinationDto> GetDestinationAsync(int id)
        {
            var destination = await _context.Destinations
                .Include(d => d.City)
                    .ThenInclude(c => c.Country)
                .Include(d => d.Category)
                .FirstOrDefaultAsync(d => d.Id == id);

            return _mapper.Map<DestinationDto>(destination);
        }

        public async Task<bool> DeleteDestinationAsync(int id)
        {
            var destination = await _context.Destinations.FindAsync(id);
            if (destination == null) return false;

            var isUsedInRoutes = await _context.Set<RouteDestination>()
                .AnyAsync(rd => rd.DestinationId == id);

            if (isUsedInRoutes) return false;

            _context.Destinations.Remove(destination);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<DestinationDto>> GetDestinationsByCityAsync(int cityId)
        {
            var destinations = await _context.Destinations
                .Include(d => d.Category)
                .Where(d => d.CityId == cityId)
                .OrderByDescending(d => d.CachedRating)
                .ToListAsync();

            return _mapper.Map<IEnumerable<DestinationDto>>(destinations);
        }

        public async Task<IEnumerable<DestinationDto>> SearchDestinationsAsync(string query)
        {
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
                .Take(50)
                .ToListAsync();

            return _mapper.Map<IEnumerable<DestinationDto>>(destinations);
        }

        public async Task<DestinationDto> UpdateDestinationCacheAsync(int id, UpdateCacheRequest request)
        {
            var destination = await _context.Destinations.FindAsync(id);
            if (destination == null) return null;

            destination.CachedDescription = request.Description;
            destination.CachedRating = request.Rating;
            destination.CachedImageUrl = request.ImageUrl;
            destination.CachedAddress = request.Address;
            destination.CacheUpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return _mapper.Map<DestinationDto>(destination);
        }

        // --- helpers ---
        private string NormalizeCityName(string name)
        {
            var unifiedNames = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "Bakı", "Baku" },
                { "Moskva", "Moscow" },
                { "Roma", "Rome" },
                { "Firenze", "Florence" },
                { "Wien", "Vienna" },
                { "Praha", "Prague" },
                { "Venezia", "Venice" }
            };
            return unifiedNames.GetValueOrDefault(name.Trim(), name.Trim());
        }

        private string GetCountryCode(string countryName)
        {
            var countryCodes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "Azerbaijan", "AZ" },
                { "United States", "US" },
                { "Italy", "IT" },
                { "France", "FR" },
                { "Turkey", "TR" },
                { "Russia", "RU" }
            };
            return countryCodes.GetValueOrDefault(countryName, "XX");
        }

        private string MapGoogleTypeToCategory(string? googleType)
        {
            var categoryMapping = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "museum", "Culture" },
                { "restaurant", "Food & Drink" },
                { "park", "Nature & Parks" },
                { "shopping_mall", "Shopping" }
            };
            return categoryMapping.GetValueOrDefault(googleType ?? "general", "General");
        }

        private decimal CalculateDistance(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
        {
            const decimal R = 6371.0m;
            var dLat = (lat2 - lat1) * (decimal)Math.PI / 180.0m;
            var dLon = (lon2 - lon1) * (decimal)Math.PI / 180.0m;

            var a = (decimal)Math.Sin((double)dLat / 2.0) * (decimal)Math.Sin((double)dLat / 2.0) +
                    (decimal)Math.Cos((double)lat1 * Math.PI / 180.0) *
                    (decimal)Math.Cos((double)lat2 * Math.PI / 180.0) *
                    (decimal)Math.Sin((double)dLon / 2.0) * (decimal)Math.Sin((double)dLon / 2.0);

            return R * 2.0m * (decimal)Math.Atan2(Math.Sqrt((double)a), Math.Sqrt(1 - (double)a));
        }
    }
}