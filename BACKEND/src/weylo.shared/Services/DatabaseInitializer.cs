using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using weylo.shared.Models;

namespace weylo.shared.Services
{
    public class DatabaseInitializer
    {
        private readonly DbContext _context;
        private readonly ILogger<DatabaseInitializer> _logger;

        public DatabaseInitializer(DbContext context, ILogger<DatabaseInitializer> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task InitializeAsync()
        {
            try
            {
                await _context.Database.CanConnectAsync();
                _logger.LogInformation("✅ Connected to database");

                await InitializeCategoriesAsync();
                await InitializeFilterAttributesAsync(); // 🆕 NEW
                await InitializeCategoryFiltersAsync(); // 🆕 NEW
                await InitializeSuperAdminAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Database initialization failed");
            }
        }

        private async Task InitializeCategoriesAsync()
        {
            var categorySet = _context.Set<Category>();
            var existingCategories = await categorySet.ToListAsync();

            var defaultCategories = new[]
            {
                new {
                    Name = "Restaurants & Dining",
                    Description = "Places to eat and drink including restaurants, cafes, bars",
                    GoogleTypes = "restaurant,cafe,bar,bakery,food,meal_takeaway,meal_delivery,fast_food_restaurant,ice_cream_shop,pizza_restaurant,sandwich_shop",
                    Priority = 10,
                    Icon = "utensils"
                },
                new {
                    Name = "Hotels & Lodging",
                    Description = "Accommodation options including hotels, hostels, resorts",
                    GoogleTypes = "lodging,hotel,resort_hotel,hostel,motel,guest_house,bed_and_breakfast,campground,rv_park",
                    Priority = 9,
                    Icon = "bed"
                },
                new {
                    Name = "Historical Sites",
                    Description = "Historical landmarks, monuments, religious buildings",
                    GoogleTypes = "church,mosque,synagogue,hindu_temple,buddhist_temple,place_of_worship,monastery,shrine,memorial,monument,historical_landmark",
                    Priority = 10,
                    Icon = "monument"
                },
                new {
                    Name = "Museums & Culture",
                    Description = "Museums, galleries, cultural centers and performing arts",
                    GoogleTypes = "museum,art_gallery,cultural_center,library,performing_arts_theater,concert_hall",
                    Priority = 9,
                    Icon = "landmark"
                },
                new {
                    Name = "Nature & Parks",
                    Description = "Parks, gardens, natural attractions and outdoor spaces",
                    GoogleTypes = "park,national_park,natural_feature,hiking_area,nature_reserve,beach,mountain,lake,forest,garden,botanical_garden",
                    Priority = 8,
                    Icon = "tree"
                },
                new {
                    Name = "Tourist Attractions",
                    Description = "Popular tourist destinations and entertainment venues",
                    GoogleTypes = "tourist_attraction,amusement_park,aquarium,zoo,landmark,observation_deck,planetarium",
                    Priority = 8,
                    Icon = "camera"
                },
                new {
                    Name = "Shopping",
                    Description = "Shopping centers, stores and retail",
                    GoogleTypes = "shopping_mall,store,clothing_store,supermarket,convenience_store,department_store,electronics_store",
                    Priority = 7,
                    Icon = "shopping-bag"
                },
                new {
                    Name = "Entertainment",
                    Description = "Entertainment venues including theaters, stadiums, gyms",
                    GoogleTypes = "movie_theater,bowling_alley,casino,spa,gym,fitness_center,stadium,sports_club,water_park,arcade",
                    Priority = 6,
                    Icon = "ticket"
                },
                new {
                    Name = "General",
                    Description = "General places of interest",
                    GoogleTypes = "",
                    Priority = 1,
                    Icon = "map-pin"
                }
            };

            foreach (var catDef in defaultCategories)
            {
                var existing = existingCategories.FirstOrDefault(c => c.Name == catDef.Name);
                if (existing == null)
                {
                    var category = new Category
                    {
                        Name = catDef.Name,
                        Description = catDef.Description,
                        GoogleTypes = catDef.GoogleTypes,
                        Priority = catDef.Priority,
                        Icon = catDef.Icon,
                        CreatedAt = DateTime.UtcNow
                    };
                    await categorySet.AddAsync(category);
                    _logger.LogInformation("➕ Created category: {Name} (Priority: {Priority})", catDef.Name, catDef.Priority);
                }
                else
                {
                    bool needsUpdate = false;

                    if (existing.GoogleTypes != catDef.GoogleTypes)
                    {
                        existing.GoogleTypes = catDef.GoogleTypes;
                        needsUpdate = true;
                    }

                    if (existing.Priority != catDef.Priority)
                    {
                        existing.Priority = catDef.Priority;
                        needsUpdate = true;
                    }

                    if (string.IsNullOrEmpty(existing.Description))
                    {
                        existing.Description = catDef.Description;
                        needsUpdate = true;
                    }

                    if (string.IsNullOrEmpty(existing.Icon))
                    {
                        existing.Icon = catDef.Icon;
                        needsUpdate = true;
                    }

                    if (needsUpdate)
                    {
                        _logger.LogInformation("🔄 Updated category: {Name} (Priority: {Priority})", catDef.Name, catDef.Priority);
                    }
                }
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("✅ Categories initialized/updated");
        }

        private async Task InitializeFilterAttributesAsync()
        {
            var filterAttributeSet = _context.Set<FilterAttribute>();
            var existingAttributes = await filterAttributeSet.ToListAsync();

            var defaultFilters = new[]
            {
        new { Name = "rating", DisplayName = "Rating", DataType = "number" },
        new { Name = "price_level", DisplayName = "Price Level", DataType = "number" },
        new { Name = "subcategories", DisplayName = "Cuisine & Type", DataType = "multi_select" },
        new { Name = "opening_hours", DisplayName = "Opening Hours", DataType = "string" },
        new { Name = "phone", DisplayName = "Phone", DataType = "string" },
        new { Name = "website", DisplayName = "Website", DataType = "string" },
        new { Name = "wheelchair_accessible", DisplayName = "Wheelchair Accessible", DataType = "boolean" },
        new { Name = "takeout", DisplayName = "Takeout", DataType = "boolean" },
        new { Name = "delivery", DisplayName = "Delivery", DataType = "boolean" },
        new { Name = "dine_in", DisplayName = "Dine-in", DataType = "boolean" },
        new { Name = "reservable", DisplayName = "Reservations", DataType = "boolean" },
        new { Name = "serves_beer", DisplayName = "Serves Beer", DataType = "boolean" },
        new { Name = "serves_wine", DisplayName = "Serves Wine", DataType = "boolean" },
        new { Name = "serves_vegetarian", DisplayName = "Vegetarian Options", DataType = "boolean" },
        new { Name = "free_wifi", DisplayName = "Free WiFi", DataType = "boolean" },
        new { Name = "parking", DisplayName = "Parking", DataType = "boolean" }
    };

            foreach (var filterDef in defaultFilters)
            {
                var existing = existingAttributes.FirstOrDefault(f => f.Name == filterDef.Name);
                if (existing == null)
                {
                    var filter = new FilterAttribute
                    {
                        Name = filterDef.Name,
                        DisplayName = filterDef.DisplayName,
                        DataType = filterDef.DataType
                    };
                    await filterAttributeSet.AddAsync(filter);
                    _logger.LogInformation("➕ Created filter attribute: {Name}", filterDef.DisplayName);
                }
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("✅ Filter attributes initialized");
        }

        private async Task InitializeCategoryFiltersAsync()
        {
            var categoryFilterSet = _context.Set<CategoryFilter>();
            var categories = await _context.Set<Category>().ToListAsync();
            var filterAttributes = await _context.Set<FilterAttribute>().ToListAsync();

            var categoryFilterMappings = new Dictionary<string, string[]>
            {
                ["Restaurants & Dining"] = new[]
                {
                    "rating", "price_level", "subcategories", "opening_hours",
                    "phone", "website", "wheelchair_accessible", "takeout",
                    "delivery", "dine_in", "reservable", "serves_beer",
                    "serves_wine", "serves_vegetarian"
                },
                ["Hotels & Lodging"] = new[]
                {
                    "rating", "price_level", "opening_hours", "phone",
                    "website", "wheelchair_accessible", "free_wifi", "parking"
                },
                ["Historical Sites"] = new[]
                {
                    "rating", "opening_hours", "phone", "website", "wheelchair_accessible"
                },
                ["Museums & Culture"] = new[]
                {
                    "rating", "price_level", "opening_hours", "phone",
                    "website", "wheelchair_accessible"
                },
                ["Nature & Parks"] = new[]
                {
                    "rating", "opening_hours", "wheelchair_accessible"
                },
                ["Tourist Attractions"] = new[]
                {
                    "rating", "price_level", "opening_hours", "phone",
                    "website", "wheelchair_accessible"
                },
                ["Shopping"] = new[]
                {
                    "rating", "opening_hours", "phone", "website", "wheelchair_accessible"
                },
                ["Entertainment"] = new[]
                {
                    "rating", "price_level", "opening_hours", "phone",
                    "website", "wheelchair_accessible", "parking"
                },
                ["General"] = new[]
                {
                    "rating", "opening_hours", "phone", "website"
                }
            };

            int addedCount = 0;

            foreach (var mapping in categoryFilterMappings)
            {
                var category = categories.FirstOrDefault(c => c.Name == mapping.Key);
                if (category == null) continue;

                foreach (var filterName in mapping.Value)
                {
                    var filterAttribute = filterAttributes.FirstOrDefault(f => f.Name == filterName);
                    if (filterAttribute == null) continue;

                    var existing = await categoryFilterSet
                        .FirstOrDefaultAsync(cf =>
                            cf.CategoryId == category.Id &&
                            cf.FilterAttributeId == filterAttribute.Id);

                    if (existing == null)
                    {
                        var categoryFilter = new CategoryFilter
                        {
                            CategoryId = category.Id,
                            FilterAttributeId = filterAttribute.Id,
                        };
                        await categoryFilterSet.AddAsync(categoryFilter);
                        addedCount++;
                    }
                }
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("✅ Category filters initialized ({Count} added)", addedCount);
        }

        private async Task InitializeSuperAdminAsync()
        {
            var userSet = _context.Set<User>();

            string superAdminEmail = "superadmin@weylo.com";

            var existingAdmin = await userSet.FirstOrDefaultAsync(u => u.Email == superAdminEmail);

            if (existingAdmin == null)
            {
                var superAdmin = new User
                {
                    Email = superAdminEmail,
                    Username = "superadmin",
                    Role = "SuperAdmin",
                    IsEmailVerified = true,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("SuperSecurePassword123!"),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await userSet.AddAsync(superAdmin);
                await _context.SaveChangesAsync();

                _logger.LogInformation("➕ Created SuperAdmin: {Email}", superAdminEmail);
            }
            else
            {
                _logger.LogInformation("🔹 SuperAdmin already exists: {Email}", superAdminEmail);
            }
        }
    }
}