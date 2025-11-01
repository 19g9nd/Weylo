using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using weylo.shared.Models;
using weylo.user.api.Data;
using weylo.user.api.Mappings.Interfaces;

namespace weylo.user.api.Services
{
    public class GooglePlacesCategoryMapper : IGooglePlacesCategoryMapper
    {
        private readonly UserDbContext _context;
        private readonly ILogger<GooglePlacesCategoryMapper> _logger;

        // Hierarchical mapping: specific types first, generic types last
        private static readonly Dictionary<string, (string Category, int Priority)> GoogleTypeToCategoryMap = new()
        {
            // === RESTAURANTS & DINING (Priority: 100-109) ===
            ["restaurant"] = ("Restaurants & Dining", 105),
            ["cafe"] = ("Restaurants & Dining", 105),
            ["bar"] = ("Restaurants & Dining", 104),
            ["bakery"] = ("Restaurants & Dining", 104),
            ["meal_takeaway"] = ("Restaurants & Dining", 103),
            ["meal_delivery"] = ("Restaurants & Dining", 103),
            ["food"] = ("Restaurants & Dining", 102),
            ["night_club"] = ("Restaurants & Dining", 104),
            ["fast_food_restaurant"] = ("Restaurants & Dining", 105),
            ["ice_cream_shop"] = ("Restaurants & Dining", 103),
            ["pizza_restaurant"] = ("Restaurants & Dining", 105),
            ["sandwich_shop"] = ("Restaurants & Dining", 104),
            ["seafood_restaurant"] = ("Restaurants & Dining", 105),
            ["steak_house"] = ("Restaurants & Dining", 105),
            ["sushi_restaurant"] = ("Restaurants & Dining", 105),
            ["vegan_restaurant"] = ("Restaurants & Dining", 105),
            ["vegetarian_restaurant"] = ("Restaurants & Dining", 105),
            ["american_restaurant"] = ("Restaurants & Dining", 105),
            ["chinese_restaurant"] = ("Restaurants & Dining", 105),
            ["french_restaurant"] = ("Restaurants & Dining", 105),
            ["greek_restaurant"] = ("Restaurants & Dining", 105),
            ["indian_restaurant"] = ("Restaurants & Dining", 105),
            ["indonesian_restaurant"] = ("Restaurants & Dining", 105),
            ["italian_restaurant"] = ("Restaurants & Dining", 105),
            ["japanese_restaurant"] = ("Restaurants & Dining", 105),
            ["korean_restaurant"] = ("Restaurants & Dining", 105),
            ["mediterranean_restaurant"] = ("Restaurants & Dining", 105),
            ["mexican_restaurant"] = ("Restaurants & Dining", 105),
            ["middle_eastern_restaurant"] = ("Restaurants & Dining", 105),
            ["spanish_restaurant"] = ("Restaurants & Dining", 105),
            ["thai_restaurant"] = ("Restaurants & Dining", 105),
            ["turkish_restaurant"] = ("Restaurants & Dining", 105),
            ["vietnamese_restaurant"] = ("Restaurants & Dining", 105),
            ["breakfast_restaurant"] = ("Restaurants & Dining", 104),
            ["brunch_restaurant"] = ("Restaurants & Dining", 104),
            ["lunch_restaurant"] = ("Restaurants & Dining", 104),
            ["dinner_theater"] = ("Restaurants & Dining", 103),
            ["hamburger_restaurant"] = ("Restaurants & Dining", 105),
            ["ramen_restaurant"] = ("Restaurants & Dining", 105),

            // === HOTELS & LODGING (Priority: 110-119) ===
            ["lodging"] = ("Hotels & Lodging", 115),
            ["hotel"] = ("Hotels & Lodging", 118),
            ["resort_hotel"] = ("Hotels & Lodging", 118),
            ["extended_stay_hotel"] = ("Hotels & Lodging", 117),
            ["hostel"] = ("Hotels & Lodging", 116),
            ["motel"] = ("Hotels & Lodging", 116),
            ["guest_house"] = ("Hotels & Lodging", 115),
            ["bed_and_breakfast"] = ("Hotels & Lodging", 116),
            ["campground"] = ("Hotels & Lodging", 113),
            ["rv_park"] = ("Hotels & Lodging", 113),
            ["cottage"] = ("Hotels & Lodging", 115),
            ["resort"] = ("Hotels & Lodging", 117),

            // === SHOPPING (Priority: 70-79) ===
            ["store"] = ("Shopping", 72),
            ["shopping_mall"] = ("Shopping", 78),
            ["clothing_store"] = ("Shopping", 75),
            ["jewelry_store"] = ("Shopping", 75),
            ["shoe_store"] = ("Shopping", 75),
            ["book_store"] = ("Shopping", 75),
            ["supermarket"] = ("Shopping", 76),
            ["convenience_store"] = ("Shopping", 74),
            ["department_store"] = ("Shopping", 77),
            ["electronics_store"] = ("Shopping", 75),
            ["furniture_store"] = ("Shopping", 74),
            ["hardware_store"] = ("Shopping", 74),
            ["home_goods_store"] = ("Shopping", 74),
            ["liquor_store"] = ("Shopping", 73),
            ["pet_store"] = ("Shopping", 73),
            ["sporting_goods_store"] = ("Shopping", 74),
            ["toy_store"] = ("Shopping", 74),
            ["gift_shop"] = ("Shopping", 73),
            ["market"] = ("Shopping", 75),
            ["pharmacy"] = ("Shopping", 74),
            ["drugstore"] = ("Shopping", 74),

            // === MUSEUMS & CULTURE (Priority: 90-99) ===
            ["museum"] = ("Museums & Culture", 98),
            ["art_gallery"] = ("Museums & Culture", 97),
            ["library"] = ("Museums & Culture", 95),
            ["cultural_center"] = ("Museums & Culture", 96),
            ["performing_arts_theater"] = ("Museums & Culture", 96),
            ["arts_organization"] = ("Museums & Culture", 94),
            ["concert_hall"] = ("Museums & Culture", 96),
            ["historical_landmark"] = ("Museums & Culture", 97),

            // === HISTORICAL SITES (Priority: 95-99) ===
            ["church"] = ("Historical Sites", 97),
            ["mosque"] = ("Historical Sites", 97),
            ["synagogue"] = ("Historical Sites", 97),
            ["hindu_temple"] = ("Historical Sites", 97),
            ["buddhist_temple"] = ("Historical Sites", 97),
            ["place_of_worship"] = ("Historical Sites", 96),
            ["monastery"] = ("Historical Sites", 96),
            ["shrine"] = ("Historical Sites", 96),
            ["memorial"] = ("Historical Sites", 95),
            ["monument"] = ("Historical Sites", 96),
            ["city_hall"] = ("Historical Sites", 93),
            ["courthouse"] = ("Historical Sites", 92),

            // === TOURIST ATTRACTIONS (Priority: 80-89) ===
            ["tourist_attraction"] = ("Tourist Attractions", 85),
            ["amusement_park"] = ("Tourist Attractions", 88),
            ["amusement_center"] = ("Tourist Attractions", 87),
            ["aquarium"] = ("Tourist Attractions", 88),
            ["zoo"] = ("Tourist Attractions", 88),
            ["landmark"] = ("Tourist Attractions", 86),
            ["visitor_center"] = ("Tourist Attractions", 85),
            ["observation_deck"] = ("Tourist Attractions", 87),
            ["planetarium"] = ("Tourist Attractions", 87),

            // === NATURE & PARKS (Priority: 85-89) ===
            ["park"] = ("Nature & Parks", 88),
            ["national_park"] = ("Nature & Parks", 89),
            ["natural_feature"] = ("Nature & Parks", 87),
            ["hiking_area"] = ("Nature & Parks", 88),
            ["nature_reserve"] = ("Nature & Parks", 89),
            ["beach"] = ("Nature & Parks", 88),
            ["mountain"] = ("Nature & Parks", 87),
            ["lake"] = ("Nature & Parks", 87),
            ["forest"] = ("Nature & Parks", 88),
            ["garden"] = ("Nature & Parks", 87),
            ["botanical_garden"] = ("Nature & Parks", 88),
            ["dog_park"] = ("Nature & Parks", 85),
            ["picnic_ground"] = ("Nature & Parks", 85),

            // === ENTERTAINMENT (Priority: 75-84) ===
            ["movie_theater"] = ("Entertainment", 82),
            ["bowling_alley"] = ("Entertainment", 80),
            ["casino"] = ("Entertainment", 81),
            ["spa"] = ("Entertainment", 79),
            ["gym"] = ("Entertainment", 77),
            ["fitness_center"] = ("Entertainment", 77),
            ["stadium"] = ("Entertainment", 83),
            ["sports_club"] = ("Entertainment", 78),
            ["sports_complex"] = ("Entertainment", 79),
            ["golf_course"] = ("Entertainment", 80),
            ["recreation_center"] = ("Entertainment", 78),
            ["roller_rink"] = ("Entertainment", 79),
            ["skating_rink"] = ("Entertainment", 79),
            ["swimming_pool"] = ("Entertainment", 77),
            ["water_park"] = ("Entertainment", 82),
            ["arcade"] = ("Entertainment", 80),
            ["escape_room"] = ("Entertainment", 81),

            // === GENERIC TYPES (Priority: 1-10) - LOWEST PRIORITY ===
            ["point_of_interest"] = ("General", 5),
            ["establishment"] = ("General", 3),
            ["geocode"] = ("General", 1),
            ["premise"] = ("General", 2),
        };

        public GooglePlacesCategoryMapper(UserDbContext context, ILogger<GooglePlacesCategoryMapper> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<int?> DetermineCategoryAsync(string[] googleTypes)
        {
            if (googleTypes == null || !googleTypes.Any())
            {
                _logger.LogWarning("No Google types provided for category determination");
                return null;
            }

            _logger.LogInformation("🔍 Determining category for types: {Types}", string.Join(", ", googleTypes));

            // STRATEGY: Find the MOST SPECIFIC type (highest priority)
            string? bestCategoryName = null;
            int highestPriority = 0;
            string? matchedType = null;

            foreach (var googleType in googleTypes)
            {
                var normalizedType = googleType.ToLower().Trim();

                if (GoogleTypeToCategoryMap.TryGetValue(normalizedType, out var mapping))
                {
                    if (mapping.Priority > highestPriority)
                    {
                        highestPriority = mapping.Priority;
                        bestCategoryName = mapping.Category;
                        matchedType = normalizedType;
                    }
                }
            }

            if (bestCategoryName != null)
            {
                // Find category ID in database
                var category = await _context.Categories
                    .FirstOrDefaultAsync(c => c.Name == bestCategoryName);

                if (category != null)
                {
                    _logger.LogInformation("✅ Matched '{MatchedType}' (priority: {Priority}) → Category: '{CategoryName}' (ID: {CategoryId})",
                        matchedType, highestPriority, bestCategoryName, category.Id);
                    return category.Id;
                }
                else
                {
                    _logger.LogWarning("⚠️ Category '{CategoryName}' not found in database", bestCategoryName);
                }
            }

            _logger.LogWarning("❌ No category match found for types: {Types}", string.Join(", ", googleTypes));
            return null;
        }

        public async Task<Category?> GetBestMatchingCategoryAsync(string googlePlaceId)
        {
            var destination = await _context.Destinations
                .FirstOrDefaultAsync(d => d.GooglePlaceId == googlePlaceId);

            if (destination == null)
                return null;

            var types = destination.GoogleType
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(t => t.Trim())
                .ToArray();

            var categoryId = await DetermineCategoryAsync(types);

            return categoryId.HasValue
                ? await _context.Categories.FindAsync(categoryId.Value)
                : null;
        }
    }
}