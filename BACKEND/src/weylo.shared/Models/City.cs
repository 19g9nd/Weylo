using System.ComponentModel.DataAnnotations;

namespace weylo.shared.Models
{
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
}