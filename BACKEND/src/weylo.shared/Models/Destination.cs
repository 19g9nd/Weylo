using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace weylo.shared.Models
{
    public class Destination
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        public double Latitude { get; set; }
        public double Longitude { get; set; }

        [ForeignKey(nameof(Category))]
        public int CategoryId { get; set; }

        [ForeignKey(nameof(City))]
        public int CityId { get; set; }

        [Required]
        [MaxLength(255)]
        public string GooglePlaceId { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? CachedDescription { get; set; }

        public decimal? CachedRating { get; set; }

        [MaxLength(500)]
        public string? CachedImageUrl { get; set; }

        [MaxLength(500)]
        public string? CachedAddress { get; set; }

        public DateTime? CacheUpdatedAt { get; set; }

        [MaxLength(100)]
        public string GoogleType { get; set; } = "general";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Category Category { get; set; } = null!;
        public City City { get; set; } = null!;
        public ICollection<FilterValue> FilterValues { get; set; } = new List<FilterValue>();
        public ICollection<RouteItem> RouteItems { get; set; } = new List<RouteItem>();
        public ICollection<UserFavourite> UserFavourites { get; set; } = new List<UserFavourite>();
    }
}