namespace weylo.shared.Models
{
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