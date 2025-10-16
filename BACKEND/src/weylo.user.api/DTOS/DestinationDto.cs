namespace weylo.user.api.DTOS
{
    public class DestinationDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string GooglePlaceId { get; set; } = string.Empty;

        // Cached data
        public string? CachedDescription { get; set; }
        public decimal? CachedRating { get; set; }
        public string? CachedImageUrl { get; set; }
        public string? CachedAddress { get; set; }
        public DateTime? CacheUpdatedAt { get; set; }
        public string GoogleType { get; set; } = "general";

        // Related data
        public int CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public int CityId { get; set; }
        public string? CityName { get; set; }
        public string? CountryName { get; set; }
        public string? CountryCode { get; set; }

        public List<FilterValueDto> FilterValues { get; set; } = new();

        // Usage statistics
        public int UsageCount { get; set; } // How many routes include this destination
        public DateTime CreatedAt { get; set; }
    }
}