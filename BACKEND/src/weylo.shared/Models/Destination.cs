using System.ComponentModel.DataAnnotations;

namespace weylo.shared.Models
{
    // Places - LINKS ONLY on Google Places
    public class Destination
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }

        public int CategoryId { get; set; }
        public int CityId { get; set; }

        // !!!: Google Place ID - MAIN DATA SOURCE
        [Required]
        [MaxLength(255)]
        public string GooglePlaceId { get; set; } = string.Empty;

        // Main data cache (in order to not pull google api for lists each time)
        [MaxLength(1000)]
        public string? CachedDescription { get; set; }
        public decimal? CachedRating { get; set; }
        [MaxLength(500)]
        public string? CachedImageUrl { get; set; }
        [MaxLength(500)]
        public string? CachedAddress { get; set; }
        public DateTime? CacheUpdatedAt { get; set; }
        public string GoogleType { get; set; } = "general";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Category Category { get; set; } = null!;
        public City City { get; set; } = null!;
        
        public ICollection<RouteDestination> RouteDestinations { get; set; } = new List<RouteDestination>();
    }
}