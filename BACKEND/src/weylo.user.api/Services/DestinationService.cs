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
                var countryCode = GetCountryCode(normalizedCountryName);

                // Проверь нет ли уже страны с таким кодом
                var existingCountryWithSameCode = await _context.Countries
                    .FirstOrDefaultAsync(c => c.Code == countryCode);

                if (existingCountryWithSameCode != null)
                {
                    // Если страна с таким кодом уже существует, используй её
                    country = existingCountryWithSameCode;
                    _logger.LogInformation($"Using existing country {country.Name} with code {country.Code} for {normalizedCountryName}");
                }
                else
                {
                    country = new Country
                    {
                        Name = normalizedCountryName,
                        Code = countryCode
                    };
                    _context.Countries.Add(country);
                    await _context.SaveChangesAsync();
                }
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
                        Math.Abs(c.Latitude - request.Latitude) < 0.1 &&
                        Math.Abs(c.Longitude - request.Longitude) < 0.1)
                    .ToListAsync();

                city = nearbyCities.FirstOrDefault(c =>
                    CalculateDistance(c.Latitude, c.Longitude, request.Latitude, request.Longitude) < 10.0);

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
        public async Task<bool> DeleteDestinationAsync(int id)
        {
            var destination = await _context.Destinations
                .Include(d => d.UserFavourites)
                .Include(d => d.RouteItems)  // ← ДОБАВИТЬ проверку маршрутов
                .FirstOrDefaultAsync(d => d.Id == id);

            if (destination == null) return false;

            // Проверяем И фавориты И маршруты
            if (destination.UserFavourites.Any() || destination.RouteItems.Any())
                return false;

            _context.Destinations.Remove(destination);
            await _context.SaveChangesAsync();
            return true;
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

        // === ФАВОРИТЫ ===

        public async Task<UserFavouriteDto> AddToFavouritesAsync(int destinationId)
        {
            var userId = _currentUserService.UserId;

            var destination = await _context.Destinations
                .Include(d => d.Category)
                .Include(d => d.City)
                    .ThenInclude(c => c.Country)
                .FirstOrDefaultAsync(d => d.Id == destinationId);

            if (destination == null)
                throw new BadHttpRequestException($"Destination with id {destinationId} not found");

            // ЗАМЕНА: UserDestinations → UserFavourites
            var existingUserFavourite = await _context.UserFavourites
                .FirstOrDefaultAsync(uf => uf.UserId == userId && uf.DestinationId == destinationId);

            if (existingUserFavourite != null)
                throw new BadHttpRequestException($"Destination already in favourites");

            // ЗАМЕНА: UserDestination → UserFavourite
            var userFavourite = new UserFavourite
            {
                UserId = userId,
                DestinationId = destinationId,
                SavedAt = DateTime.UtcNow
            };

            await _context.UserFavourites.AddAsync(userFavourite);
            await _context.SaveChangesAsync();

            await _context.Entry(userFavourite)
                .Reference(uf => uf.Destination)
                .Query()
                .Include(d => d.Category)
                .Include(d => d.City)
                    .ThenInclude(c => c.Country)
                .LoadAsync();

            return _mapper.Map<UserFavouriteDto>(userFavourite);
        }

        public async Task<bool> RemoveFromFavouritesAsync(int destinationId)
        {
            var userId = _currentUserService.UserId;

            var userFavourite = await _context.UserFavourites
                .FirstOrDefaultAsync(uf => uf.UserId == userId && uf.DestinationId == destinationId);

            if (userFavourite == null)
                return false;

            // УБРАТЬ проверку на использование в маршрутах
            // Фавориты можно удалять всегда, даже если они в маршрутах
            _context.UserFavourites.Remove(userFavourite);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<UserFavouriteDto> UpdateFavouriteAsync(int userFavouriteId, UpdateUserFavouriteRequest request)
        {
            var userId = _currentUserService.UserId;

            // ЗАМЕНА: UserDestinations → UserFavourites
            var userFavourite = await _context.UserFavourites
                .Include(uf => uf.Destination)
                    .ThenInclude(d => d.Category)
                .Include(uf => uf.Destination)
                    .ThenInclude(d => d.City)
                        .ThenInclude(c => c.Country)
                .FirstOrDefaultAsync(uf => uf.Id == userFavouriteId && uf.UserId == userId);

            if (userFavourite == null)
                throw new BadHttpRequestException($"User favourite with id {userFavouriteId} not found");

            if (request.PersonalNotes != null)
                userFavourite.PersonalNotes = request.PersonalNotes;

            await _context.SaveChangesAsync();

            return _mapper.Map<UserFavouriteDto>(userFavourite);
        }

        public async Task<IEnumerable<UserFavouriteDto>> GetUserFavouritesAsync()
        {
            var userId = _currentUserService.UserId;

            var userFavourites = await _context.UserFavourites
                .Where(uf => uf.UserId == userId)
                .Include(uf => uf.Destination)
                    .ThenInclude(d => d.City)
                        .ThenInclude(c => c.Country)
                .Include(uf => uf.Destination)
                    .ThenInclude(d => d.Category)
                // УБРАТЬ: .Include(uf => uf.RouteItems) - фаворитам не нужно знать о маршрутах
                .OrderByDescending(uf => uf.SavedAt)
                .ToListAsync();

            return _mapper.Map<IEnumerable<UserFavouriteDto>>(userFavourites);
        }

        public async Task<IEnumerable<DestinationDto>> GetPopularDestinationsAsync(int take = 20)
        {
            var destinations = await _context.Destinations
                .Include(d => d.City).ThenInclude(c => c.Country)
                .Include(d => d.Category)
                .Where(d => d.CachedRating.HasValue)
                .OrderByDescending(d => d.CachedRating)
                .ThenByDescending(d => d.UserFavourites.Count)  // ← ВОТ ТАК
                .Take(take)
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

        #region Category Auto-Detection
        private async Task<int> DetermineCategoryFromGoogleTypeAsync(string[]? googleTypes)
        {
            if (googleTypes == null || !googleTypes.Any())
                return await GetDefaultCategoryIdAsync();

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

            return bestMatch?.Id ?? await GetDefaultCategoryIdAsync();
        }

        private async Task<int> GetDefaultCategoryIdAsync()
        {
            var defaultCategory = await _context.Categories
                .FirstOrDefaultAsync(c => c.Name == "General");

            return defaultCategory?.Id ?? 1; // Fallback
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
        { "USA", "US" },
        { "United Kingdom", "GB" },
        { "UK", "GB" },
        { "France", "FR" },
        { "Germany", "DE" },
        { "Italy", "IT" },
        { "Spain", "ES" },
        { "Iran", "IR" },
        { "Armenia", "AM" },
        { "Армения", "AM" }
    };
            return countryCodes.TryGetValue(countryName, out var code) ? code : "UN";
        }

        private string NormalizeCityName(string cityName)
        {
            return cityName.Trim();
        }

        private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371; // Радиус Земли в километрах

            var dLat = (lat2 - lat1) * Math.PI / 180;
            var dLon = (lon2 - lon1) * Math.PI / 180;

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return R * c;
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