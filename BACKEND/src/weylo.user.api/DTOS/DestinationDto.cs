namespace weylo.user.api.DTOS
{
    public class DestinationDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public int CategoryId { get; set; }
        public int CityId { get; set; }
        public string GooglePlaceId { get; set; } = string.Empty;
        public string? CachedDescription { get; set; }
        public decimal? CachedRating { get; set; }
        public string? CachedImageUrl { get; set; }
        public string? CachedAddress { get; set; }
        public DateTime? CacheUpdatedAt { get; set; }
        public string GoogleType { get; set; } = "general";
        public DateTime CreatedAt { get; set; }

        // Navigation DTOs
        public CategoryDto? Category { get; set; }
        public CityDto? City { get; set; }
        public List<FilterValueDto> FilterValues { get; set; } = new();
    }
}