using System.ComponentModel.DataAnnotations;

namespace weylo.shared.Models
{
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
        public ICollection<City> Cities { get; set; } = new List<City>();
    }
}