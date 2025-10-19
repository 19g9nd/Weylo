using System.ComponentModel.DataAnnotations;

namespace weylo.shared.Models
{
    public class City
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public int CountryId { get; set; }

        public double Latitude { get; set; }
        public double Longitude { get; set; }

        [Required]
        [MaxLength(255)]
        public string GooglePlaceId { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Country Country { get; set; } = null!;
        public ICollection<Destination> Destinations { get; set; } = new List<Destination>();
    }
}