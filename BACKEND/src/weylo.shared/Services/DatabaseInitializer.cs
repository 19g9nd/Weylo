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
                new { Name = "Museums & Culture", Description = "Museums, galleries and cultural attractions",
                      GoogleTypes = "museum,art_gallery,cultural_center", Priority = 10, Icon = "landmark" },
                new { Name = "Restaurants & Dining", Description = "Places to eat and drink",
                      GoogleTypes = "restaurant,cafe,bar,food,meal_takeaway,meal_delivery", Priority = 9, Icon = "utensils" },
                new { Name = "Nature & Parks", Description = "Parks, gardens and natural attractions",
                      GoogleTypes = "park,natural_feature,campground,hiking_area,national_park", Priority = 8, Icon = "tree" },
                new { Name = "Shopping", Description = "Shopping centers and stores",
                      GoogleTypes = "shopping_mall,store,clothing_store,convenience_store,supermarket", Priority = 7, Icon = "shopping-bag" },
                new { Name = "Entertainment", Description = "Entertainment venues and activities",
                      GoogleTypes = "movie_theater,amusement_park,night_club,casino,bowling_alley,stadium", Priority = 6, Icon = "ticket" },
                new { Name = "Historical Sites", Description = "Historical landmarks and monuments",
                      GoogleTypes = "historical_landmark,place_of_worship,monument,church,mosque,synagogue,temple", Priority = 9, Icon = "monument" },
                new { Name = "Hotels & Lodging", Description = "Accommodation options",
                      GoogleTypes = "lodging,hotel,resort,campground", Priority = 5, Icon = "bed" },
                new { Name = "Tourist Attractions", Description = "Popular tourist destinations",
                      GoogleTypes = "tourist_attraction,aquarium,zoo,landmark", Priority = 8, Icon = "camera" },
                new { Name = "General", Description = "General places of interest",
                      GoogleTypes = "point_of_interest,establishment", Priority = 1, Icon = "map-pin" }
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
                    _logger.LogInformation("➕ Created category: {Name}", catDef.Name);
                }
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("✅ Categories initialized");
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
