using System.ComponentModel.DataAnnotations;

namespace weylo.shared.Models
{
    public class User
    {
        public int Id { get; set; }

        [Required]
        [EmailAddress]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Username { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public bool IsEmailVerified { get; set; } = false;

        [MaxLength(50)]
        public string Role { get; set; } = "User";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Identity-specific fields (nullable for other services that don't need them)
        [MaxLength(255)]
        public string? EmailVerificationToken { get; set; }

        [MaxLength(255)]
        public string? PasswordResetToken { get; set; }

        public DateTime? PasswordResetTokenExpiry { get; set; }

        [MaxLength(500)]
        public string? RefreshToken { get; set; }

        public DateTime? RefreshTokenExpiry { get; set; }
    }

    // Categories MINE (mapping on Google types)
    public class Category
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty; // "Family Places", "Extreme", "Top-10"

        [MaxLength(500)]
        public string? Description { get; set; }

        [MaxLength(50)]
        public string? Icon { get; set; }

        // Маппинг на Google Places types (через запятую)
        [MaxLength(500)]
        public string? GoogleTypes { get; set; } = string.Empty; // "museum,tourist_attraction"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    // Countries MINE (but minimal info, mainly for cities)
    public class Country
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(3)]
        public string Code { get; set; } = string.Empty; // "US", "UK", "AZ"
        public double SouthBound { get; set; } 
        public double WestBound { get; set; } 
        public double NorthBound { get; set; }
        public double EastBound { get; set; } 
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Google Place ID for country 
        [MaxLength(255)]
        public string? GooglePlaceId { get; set; }
    }

    // Cities MINE (created with first user request)
    public class City
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public int CountryId { get; set; }

        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }

        // !!!: Google Place ID for city (to link with Google Places API)
        [Required]
        [MaxLength(255)]
        public string GooglePlaceId { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public Country Country { get; set; } = null!;
    }

    //Places-  LINKS ONLY on Google Places
    public class Destination
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty; //cache name for fast search

        public decimal Latitude { get; set; } //Cache lat/lng for fast search
        public decimal Longitude { get; set; }

        public int CategoryId { get; set; }
        public int CityId { get; set; }

        // !!!: Google Place ID - MAIN DATA SOURCE
        [Required]
        [MaxLength(255)]
        public string GooglePlaceId { get; set; } = string.Empty;

        // Main data cache  (in order to not pull google api for lists eaqch time)
        [MaxLength(1000)]
        public string? CachedDescription { get; set; }
        public decimal? CachedRating { get; set; }
        [MaxLength(500)]
        public string? CachedImageUrl { get; set; }
        [MaxLength(500)]
        public string? CachedAddress { get; set; }
        public DateTime? CacheUpdatedAt { get; set; }
        public string GoogleType { get; set; } = "general"; // !! возможно приедтся сделать несколько типов так как фильтрация по ним может быть некорректной

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Category Category { get; set; } = null!;
        public City City { get; set; } = null!;
    }

    // User routes
    public class UserRoute
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty; // "My Trip to Baku"

        public int UserId { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }

        // Статус маршрута
        [MaxLength(50)]
        public string Status { get; set; } = "Draft"; // "Draft", "Active", "Completed"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public User User { get; set; } = null!;

        // List of destinations in the route
        public ICollection<RouteDestination> RouteDestinations { get; set; } = new List<RouteDestination>();
    }

    // Link between UserRoute and Destination with additional info
    public class RouteDestination
    {
        public int Id { get; set; }

        public int UserRouteId { get; set; }
        public int DestinationId { get; set; }

        public int Order { get; set; } // visit order
        public DateTime? PlannedVisitDate { get; set; }
        public TimeSpan? EstimatedDuration { get; set; } // planned visit time

        [MaxLength(500)]
        public string? UserNotes { get; set; } // user notes

        public bool IsVisited { get; set; } = false; // visited or not toggle 
        public DateTime? ActualVisitDate { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public UserRoute UserRoute { get; set; } = null!;
        public Destination Destination { get; set; } = null!;
    }

    // DTO for Google Places integration
    public class GooglePlaceDetails
    {
        public string PlaceId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string? Address { get; set; }
        public decimal? Rating { get; set; }
        public string? ImageUrl { get; set; }
        public List<string> Types { get; set; } = new List<string>();
        public string? PhoneNumber { get; set; }
        public string? Website { get; set; }
        public List<string> Photos { get; set; } = new List<string>();
    }
}