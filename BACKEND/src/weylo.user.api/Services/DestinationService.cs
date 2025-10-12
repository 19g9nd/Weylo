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
                .Include(d => d.Category)
                .Include(d => d.City)
                    .ThenInclude(c => c.Country)
                .FirstOrDefaultAsync(d => d.GooglePlaceId == request.GooglePlaceId);

            if (existingDestination != null)
            {
                if (!existingDestination.CacheUpdatedAt.HasValue || 
                    (DateTime.UtcNow - existingDestination.CacheUpdatedAt.Value).TotalDays > 7)
                {
                    existingDestination.CachedDescription = request.Description;
                    existingDestination.CachedRating = request.Rating;
                    existingDestination.CachedImageUrl = request.ImageUrl;
                    existingDestination.CachedAddress = request.Address;
                    existingDestination.CacheUpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
                
                return _mapper.Map<DestinationDto>(existingDestination);
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
                var nearbyCities = await _context.Cities
                    .Where(c => c.CountryId == country.Id)
                    .Where(c => 
                        Math.Abs(c.Latitude - request.Latitude) < 0.1m &&
                        Math.Abs(c.Longitude - request.Longitude) < 0.1m)
                    .ToListAsync();

                city = nearbyCities.FirstOrDefault(c =>
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

            // Создаем или находим категорию
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
            destination.CreatedAt = DateTime.UtcNow;

            _context.Destinations.Add(destination);
            await _context.SaveChangesAsync();

            await _context.Entry(destination)
                .Reference(d => d.Category)
                .LoadAsync();
            await _context.Entry(destination)
                .Reference(d => d.City)
                .LoadAsync();
            await _context.Entry(destination.City)
                .Reference(c => c.Country)
                .LoadAsync();

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

            var isUsedInRoutes = await _context.RouteDestinations
                .AnyAsync(rd => rd.DestinationId == id);

            if (isUsedInRoutes) return false;

            _context.Destinations.Remove(destination);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<DestinationDto>> GetUserDestinationsAsync()
        {
            var userId = _currentUserService.UserId;

            var destinations = await _context.RouteDestinations
                .Where(rd => rd.UserRoute.UserId == userId)
                .Include(rd => rd.Destination)
                    .ThenInclude(d => d.City)
                    .ThenInclude(c => c.Country)
                .Include(rd => rd.Destination)
                    .ThenInclude(d => d.Category)
                .Select(rd => rd.Destination)
                .Distinct()
                .OrderByDescending(d => d.CachedRating)
                .ToListAsync();

            return _mapper.Map<IEnumerable<DestinationDto>>(destinations);
        }

        public async Task<IEnumerable<DestinationDto>> GetDestinationsByCityAsync(int cityId)
        {
            var destinations = await _context.Destinations
                .Include(d => d.Category)
                .Include(d => d.City)
                    .ThenInclude(c => c.Country)
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
                    d.City.Name.ToLower().Contains(searchTerm) ||
                    d.City.Country.Name.ToLower().Contains(searchTerm))
                .OrderByDescending(d => d.CachedRating)
                .Take(50)
                .ToListAsync();

            return _mapper.Map<IEnumerable<DestinationDto>>(destinations);
        }

        public async Task<DestinationDto> UpdateDestinationCacheAsync(int id, UpdateCacheRequest request)
        {
            var destination = await _context.Destinations
                .Include(d => d.City)
                    .ThenInclude(c => c.Country)
                .Include(d => d.Category)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (destination == null) return null;

            destination.CachedDescription = request.Description;
            destination.CachedRating = request.Rating;
            destination.CachedImageUrl = request.ImageUrl;
            destination.CachedAddress = request.Address;
            destination.CacheUpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return _mapper.Map<DestinationDto>(destination);
        }

        public async Task<IEnumerable<DestinationDto>> GetPopularDestinationsAsync(int take = 20)
        {
            var destinations = await _context.Destinations
                .Include(d => d.City)
                    .ThenInclude(c => c.Country)
                .Include(d => d.Category)
                .Where(d => d.CachedRating.HasValue)
                .OrderByDescending(d => d.CachedRating)
                .ThenByDescending(d => d.RouteDestinations.Count)
                .Take(take)
                .ToListAsync();

            return _mapper.Map<IEnumerable<DestinationDto>>(destinations);
        }

        // --- Helpers ---
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
                { "United Kingdom", "GB" },
                { "Italy", "IT" },
                { "France", "FR" },
                { "Spain", "ES" },
                { "Germany", "DE" },
                { "Turkey", "TR" },
                { "Russia", "RU" },
                { "Georgia", "GE" }
            };
            return countryCodes.GetValueOrDefault(countryName, "XX");
        }

        private string MapGoogleTypeToCategory(string? googleType)
        {
            var categoryMapping = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "museum", "Culture" },
                { "art_gallery", "Culture" },
                { "restaurant", "Food & Drink" },
                { "cafe", "Food & Drink" },
                { "bar", "Food & Drink" },
                { "park", "Nature & Parks" },
                { "natural_feature", "Nature & Parks" },
                { "shopping_mall", "Shopping" },
                { "store", "Shopping" },
                { "tourist_attraction", "Attractions" },
                { "point_of_interest", "Attractions" },
                { "lodging", "Accommodation" },
                { "hotel", "Accommodation" }
            };
            return categoryMapping.GetValueOrDefault(googleType ?? "general", "General");
        }

        private decimal CalculateDistance(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
        {
            const decimal R = 6371.0m; // Earth radius in km
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