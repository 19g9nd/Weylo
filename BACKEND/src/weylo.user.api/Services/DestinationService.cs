using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using weylo.shared.Models;
using weylo.user.api.Data;
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
        private readonly ILogger<DestinationService> _logger;

        public DestinationService(UserDbContext context, ICurrentUserService currentUserService, IMapper mapper, ILogger<DestinationService> logger)
        {
            _context = context;
            _currentUserService = currentUserService;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<DestinationDto> SavePlaceAsync(SavePlaceRequest request)
        {
            var existing = await _context.Destinations
                .Include(d => d.Category)
                .Include(d => d.City)
                    .ThenInclude(c => c.Country)
                .Include(d => d.FilterValues)
                    .ThenInclude(fv => fv.FilterAttribute)
                .FirstOrDefaultAsync(d => d.GooglePlaceId == request.GooglePlaceId);

            if (existing != null)
            {
                bool needsUpdate = false;

                int newCategoryId = await DetermineCategoryFromGoogleTypeAsync(request.GoogleTypes);

                if (existing.CategoryId != newCategoryId)
                {
                    _logger.LogInformation(
                        "Updating category for destination {DestinationId} from {OldCategory} to {NewCategory}",
                        existing.Id, existing.CategoryId, newCategoryId);

                    existing.CategoryId = newCategoryId;
                    needsUpdate = true;
                }

                if (!existing.CacheUpdatedAt.HasValue ||
                    (DateTime.UtcNow - existing.CacheUpdatedAt.Value).TotalDays > 7 ||
                    needsUpdate)
                {
                    existing.CachedDescription = request.Description;
                    existing.CachedRating = request.Rating;
                    existing.CachedImageUrl = request.ImageUrl;
                    existing.CachedAddress = request.Address;
                    existing.CacheUpdatedAt = DateTime.UtcNow;

                    await _context.SaveChangesAsync();

                    await AutoPopulateFilterValuesAsync(existing.Id, request, updateExisting: true);

                    await _context.Entry(existing)
                        .Reference(d => d.Category)
                        .LoadAsync();
                    await _context.Entry(existing)
                        .Collection(d => d.FilterValues)
                        .Query()
                        .Include(fv => fv.FilterAttribute)
                        .LoadAsync();
                }

                return _mapper.Map<DestinationDto>(existing);
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

            int categoryId = await DetermineCategoryFromGoogleTypeAsync(request.GoogleTypes);
Console.WriteLine($"GoogleTypes received: {(request.GoogleTypes != null ? string.Join(", ", request.GoogleTypes) : "null")}");


            // 5. Создаем новое место
            var destination = new Destination
            {
                Name = request.Name,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                GooglePlaceId = request.GooglePlaceId,
                GoogleType = request.GoogleTypes != null ? string.Join(",", request.GoogleTypes) : "general",
                CategoryId = categoryId,
                CityId = city.Id,
                CachedDescription = request.Description,
                CachedRating = request.Rating,
                CachedImageUrl = request.ImageUrl,
                CachedAddress = request.Address,
                CacheUpdatedAt = DateTime.UtcNow
            };

            await _context.Destinations.AddAsync(destination);
            await _context.SaveChangesAsync();

            await AutoPopulateFilterValuesAsync(destination.Id, request, updateExisting: false);

            await _context.Entry(destination)
                .Reference(d => d.Category)
                .LoadAsync();
            await _context.Entry(destination)
                .Reference(d => d.City)
                .LoadAsync();
            await _context.Entry(destination.City)
                .Reference(c => c.Country)
                .LoadAsync();

            // Загружаем фильтры для ответа
            await _context.Entry(destination)
                .Collection(d => d.FilterValues)
                .Query()
                .Include(fv => fv.FilterAttribute)
                .LoadAsync();

            return _mapper.Map<DestinationDto>(destination);
        }

        // --- Public read/update/delete methods ---

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

        public async Task<DestinationDto?> GetDestinationAsync(int id)
        {
            var destination = await _context.Destinations
                .Include(d => d.City)
                    .ThenInclude(c => c.Country)
                .Include(d => d.Category)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (destination == null) return null;
            return _mapper.Map<DestinationDto>(destination);
        }

        public async Task<bool> DeleteDestinationAsync(int id)
        {
            var destination = await _context.Destinations.FindAsync(id);
            if (destination == null) return false;

            var isUsedInUserCollectionsWithRoutes = await _context.UserDestinations
                .AnyAsync(ud => ud.DestinationId == id && ud.RouteDestinations.Any());

            if (isUsedInUserCollectionsWithRoutes) return false;

            _context.Destinations.Remove(destination);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<UserDestinationDto> AddDestinationToUserAsync(int destinationId)
        {
            var userId = _currentUserService.UserId;

            var destination = await _context.Destinations
                .Include(d => d.Category)
                .Include(d => d.City)
                    .ThenInclude(c => c.Country)
                .FirstOrDefaultAsync(d => d.Id == destinationId);

            if (destination == null)
                throw new BadHttpRequestException($"Destination with id {destinationId} not found");

            var existingUserDestination = await _context.UserDestinations
                .FirstOrDefaultAsync(ud => ud.UserId == userId && ud.DestinationId == destinationId);

            if (existingUserDestination != null)
                throw new BadHttpRequestException($"Destination already added to user collection");

            var userDestination = new UserDestination
            {
                UserId = userId,
                DestinationId = destinationId,
                SavedAt = DateTime.UtcNow,
                IsFavorite = false
            };

            await _context.UserDestinations.AddAsync(userDestination);
            await _context.SaveChangesAsync();

            await _context.Entry(userDestination)
                .Reference(ud => ud.Destination)
                .Query()
                .Include(d => d.Category)
                .Include(d => d.City)
                    .ThenInclude(c => c.Country)
                .LoadAsync();

            return _mapper.Map<UserDestinationDto>(userDestination);
        }

        public async Task<bool> RemoveDestinationFromUserAsync(int destinationId)
        {
            var userId = _currentUserService.UserId;

            var userDestination = await _context.UserDestinations
                .FirstOrDefaultAsync(ud => ud.UserId == userId && ud.DestinationId == destinationId);

            if (userDestination == null)
                return false;

            var isUsedInRoutes = await _context.RouteDestinations
                .AnyAsync(rd => rd.UserDestinationId == userDestination.Id);

            if (isUsedInRoutes)
                throw new BadHttpRequestException("Cannot remove destination that is used in routes");

            _context.UserDestinations.Remove(userDestination);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<UserDestinationDto> UpdateUserDestinationAsync(int userDestinationId, UpdateUserDestinationRequest request)
        {
            var userId = _currentUserService.UserId;

            var userDestination = await _context.UserDestinations
                .Include(ud => ud.Destination)
                    .ThenInclude(d => d.Category)
                .Include(ud => ud.Destination)
                    .ThenInclude(d => d.City)
                        .ThenInclude(c => c.Country)
                .FirstOrDefaultAsync(ud => ud.Id == userDestinationId && ud.UserId == userId);

            if (userDestination == null)
                throw new BadHttpRequestException($"User destination with id {userDestinationId} not found");

            if (request.IsFavorite.HasValue)
                userDestination.IsFavorite = request.IsFavorite.Value;

            if (request.PersonalNotes != null)
                userDestination.PersonalNotes = request.PersonalNotes;

            await _context.SaveChangesAsync();

            return _mapper.Map<UserDestinationDto>(userDestination);
        }

        public async Task<UserDestinationDto> ToggleFavoriteAsync(int userDestinationId)
        {
            var userId = _currentUserService.UserId;

            var userDestination = await _context.UserDestinations
                .Include(ud => ud.Destination)
                    .ThenInclude(d => d.Category)
                .Include(ud => ud.Destination)
                    .ThenInclude(d => d.City)
                        .ThenInclude(c => c.Country)
                .FirstOrDefaultAsync(ud => ud.Id == userDestinationId && ud.UserId == userId);

            if (userDestination == null)
                throw new BadHttpRequestException($"User destination with id {userDestinationId} not found");

            userDestination.IsFavorite = !userDestination.IsFavorite;
            await _context.SaveChangesAsync();

            return _mapper.Map<UserDestinationDto>(userDestination);
        }

        public async Task<IEnumerable<UserDestinationDto>> GetUserDestinationsAsync()
        {
            var userId = _currentUserService.UserId;

            var userDestinations = await _context.UserDestinations
                .Where(ud => ud.UserId == userId)
                .Include(ud => ud.Destination)
                    .ThenInclude(d => d.City)
                        .ThenInclude(c => c.Country)
                .Include(ud => ud.Destination)
                    .ThenInclude(d => d.Category)
                .Include(ud => ud.RouteDestinations)
                .OrderByDescending(ud => ud.SavedAt)
                .ToListAsync();

            return _mapper.Map<IEnumerable<UserDestinationDto>>(userDestinations);
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
            var searchTerm = (query ?? string.Empty).ToLower().Trim();

            var destinations = await _context.Destinations
                .Include(d => d.City)
                    .ThenInclude(c => c.Country)
                .Include(d => d.Category)
                .Where(d =>
                    d.Name.ToLower().Contains(searchTerm) ||
                    (d.CachedAddress ?? string.Empty).ToLower().Contains(searchTerm) ||
                    d.City.Name.ToLower().Contains(searchTerm) ||
                    d.City.Country.Name.ToLower().Contains(searchTerm))
                .OrderByDescending(d => d.CachedRating)
                .Take(50)
                .ToListAsync();

            return _mapper.Map<IEnumerable<DestinationDto>>(destinations);
        }

        public async Task<DestinationDto?> UpdateDestinationCacheAsync(int id, UpdateCacheRequest request)
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
                .ThenByDescending(d => d.UserDestinations.Count)
                .Take(take)
                .ToListAsync();

            return _mapper.Map<IEnumerable<DestinationDto>>(destinations);
        }

        #region Category Auto-Detection

        private async Task<int> DetermineCategoryFromGoogleTypeAsync(string[]? googleTypes)
        {
            if (googleTypes == null || !googleTypes.Any())
                return await GetOrCreateDefaultCategoryAsync();

            var types = googleTypes.Select(t => t.Trim().ToLower()).ToArray();

            var categories = await _context.Categories
                .Where(c => !string.IsNullOrEmpty(c.GoogleTypes))
                .OrderByDescending(c => c.Priority)
                .ToListAsync();

            Category? bestMatch = null;
            int maxMatches = 0;

            foreach (var category in categories)
            {
                var categoryTypes = category.GoogleTypes
                    .Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(t => t.Trim().ToLower())
                    .ToHashSet();

                int matchCount = types.Count(t => categoryTypes.Contains(t));

                if (matchCount > maxMatches)
                {
                    maxMatches = matchCount;
                    bestMatch = category;
                }
            }

            return bestMatch?.Id ?? await GetOrCreateDefaultCategoryAsync();
        }

        private async Task<int> GetOrCreateDefaultCategoryAsync()
        {
            var defaultCategory = await _context.Categories
                .FirstOrDefaultAsync(c => c.Name == "General");

            if (defaultCategory != null)
                return defaultCategory.Id;

            // Создаем дефолтную категорию
            defaultCategory = new Category
            {
                Name = "General",
                Description = "General places of interest",
                GoogleTypes = "point_of_interest,establishment",
                Priority = 1,
                Icon = "map-pin"
            };

            await _context.Categories.AddAsync(defaultCategory);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created default 'General' category");
            return defaultCategory.Id;
        }

        private async Task CreateDefaultCategoriesAsync()
        {
            var defaultCategories = new[]
            {
                new Category
                {
                    Name = "Museums & Culture",
                    Description = "Museums, galleries and cultural attractions",
                    GoogleTypes = "museum,art_gallery,cultural_center",
                    Priority = 10,
                    Icon = "landmark"
                },
                new Category
                {
                    Name = "Restaurants & Dining",
                    Description = "Places to eat and drink",
                    GoogleTypes = "restaurant,cafe,bar,food,meal_takeaway,meal_delivery",
                    Priority = 9,
                    Icon = "utensils"
                },
                new Category
                {
                    Name = "Nature & Parks",
                    Description = "Parks, gardens and natural attractions",
                    GoogleTypes = "park,natural_feature,campground,hiking_area,national_park",
                    Priority = 8,
                    Icon = "tree"
                },
                new Category
                {
                    Name = "Shopping",
                    Description = "Shopping centers and stores",
                    GoogleTypes = "shopping_mall,store,clothing_store,convenience_store,supermarket",
                    Priority = 7,
                    Icon = "shopping-bag"
                },
                new Category
                {
                    Name = "Entertainment",
                    Description = "Entertainment venues and activities",
                    GoogleTypes = "movie_theater,amusement_park,night_club,casino,bowling_alley,stadium",
                    Priority = 6,
                    Icon = "ticket"
                },
                new Category
                {
                    Name = "Historical Sites",
                    Description = "Historical landmarks and monuments",
                    GoogleTypes = "historical_landmark,place_of_worship,monument,church,mosque,synagogue,temple",
                    Priority = 9,
                    Icon = "monument"
                },
                new Category
                {
                    Name = "Hotels & Lodging",
                    Description = "Accommodation options",
                    GoogleTypes = "lodging,hotel,resort,campground",
                    Priority = 5,
                    Icon = "bed"
                },
                new Category
                {
                    Name = "Tourist Attractions",
                    Description = "Popular tourist destinations",
                    GoogleTypes = "tourist_attraction,aquarium,zoo,landmark",
                    Priority = 8,
                    Icon = "camera"
                },
                new Category
                {
                    Name = "General",
                    Description = "General places of interest",
                    GoogleTypes = "point_of_interest,establishment",
                    Priority = 1,
                    Icon = "map-pin"
                }
            };

            await _context.Categories.AddRangeAsync(defaultCategories);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created {Count} default categories", defaultCategories.Length);
        }

        #endregion

        #region Helper Methods

        private string GetCountryCode(string countryName)
        {
            var countryCodes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "Azerbaijan", "AZ" },
                { "Азербайджан", "AZ" },
                { "Turkey", "TR" },
                { "Türkiye", "TR" },
                { "Georgia", "GE" },
                { "Грузия", "GE" },
                { "Russia", "RU" },
                { "Россия", "RU" },
                { "United States", "US" },
                { "United Kingdom", "GB" },
                { "France", "FR" },
                { "Germany", "DE" },
                { "Italy", "IT" },
                { "Spain", "ES" },
                { "Iran", "IR" },
                { "Armenia", "AM" },
                { "Армения", "AM" }
            };

            return countryCodes.TryGetValue(countryName, out var code) ? code : "XX";
        }

        private string NormalizeCityName(string cityName)
        {
            return cityName.Trim();
        }

        private decimal CalculateDistance(decimal lat1, decimal lon1, decimal lat2, decimal lon2)
        {
            const double R = 6371; // Радиус Земли в километрах

            var dLat = (double)(lat2 - lat1) * Math.PI / 180;
            var dLon = (double)(lon2 - lon1) * Math.PI / 180;

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos((double)lat1 * Math.PI / 180) * Math.Cos((double)lat2 * Math.PI / 180) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return (decimal)(R * c);
        }

        #endregion

        #region Filter Auto-Population

        private async Task AutoPopulateFilterValuesAsync(
           int destinationId,
           SavePlaceRequest request,
           bool updateExisting = false)
        {
            var destination = await _context.Destinations
                .Include(d => d.Category)
                .Include(d => d.FilterValues) // ✅ Загружаем существующие фильтры
                .FirstOrDefaultAsync(d => d.Id == destinationId);

            if (destination == null) return;

            // ✅ Если это обновление - удаляем старые фильтры
            if (updateExisting && destination.FilterValues.Any())
            {
                _logger.LogInformation(
                    "Removing {Count} existing filter values for destination {DestinationId}",
                    destination.FilterValues.Count, destinationId);

                _context.FilterValues.RemoveRange(destination.FilterValues);
                await _context.SaveChangesAsync();
            }

            // Получаем все фильтры, связанные с категорией этого места
            var categoryFilters = await _context.CategoryFilters
                .Where(cf => cf.CategoryId == destination.CategoryId)
                .Include(cf => cf.FilterAttribute)
                .ToListAsync();

            if (!categoryFilters.Any())
            {
                _logger.LogInformation(
                    "No filters configured for category {CategoryId} ({CategoryName})",
                    destination.CategoryId,
                    destination.Category?.Name ?? "Unknown");
                return;
            }

            _logger.LogInformation(
                "Auto-populating {FilterCount} filters for destination {DestinationId} in category '{CategoryName}'",
                categoryFilters.Count, destinationId, destination.Category?.Name);

            // Заполняем значения фильтров на основе данных из Google Places
            int filledCount = 0;
            foreach (var categoryFilter in categoryFilters)
            {
                var filterAttribute = categoryFilter.FilterAttribute;
                string? value = null;

                // Маппим данные из Google Places на наши фильтры
                value = filterAttribute.Name.ToLower() switch
                {
                    "rating" => request.Rating?.ToString("F1"),
                    "price_level" => request.PriceLevel?.ToString(),
                    "opening_hours" => request.OpeningHours,
                    "phone" => request.Phone,
                    "website" => request.Website,
                    "wheelchair_accessible" => request.WheelchairAccessible?.ToString().ToLower(),
                    "takeout" => request.Takeout?.ToString().ToLower(),
                    "delivery" => request.Delivery?.ToString().ToLower(),
                    "dine_in" => request.DineIn?.ToString().ToLower(),
                    "reservable" => request.Reservable?.ToString().ToLower(),
                    "serves_beer" => request.ServesBeer?.ToString().ToLower(),
                    "serves_wine" => request.ServesWine?.ToString().ToLower(),
                    "serves_vegetarian" => request.ServesVegetarian?.ToString().ToLower(),
                    _ => null
                };

                // Если значение есть - сохраняем
                if (!string.IsNullOrEmpty(value))
                {
                    var filterValue = new FilterValue
                    {
                        DestinationId = destinationId,
                        FilterAttributeId = filterAttribute.Id,
                        Value = value
                    };

                    await _context.FilterValues.AddAsync(filterValue);
                    filledCount++;

                    _logger.LogDebug(
                        "Set filter '{FilterName}' = '{Value}' for destination {DestinationId}",
                        filterAttribute.Name, value, destinationId);
                }
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Successfully populated {FilledCount}/{TotalCount} filters for destination {DestinationId}",
                filledCount, categoryFilters.Count, destinationId);
        }
        #endregion
    }
}