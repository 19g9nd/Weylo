namespace weylo.user.api.DTOS
{
    public class DestinationDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string? CachedAddress { get; set; }
        public string? CachedDescription { get; set; }
        public decimal? CachedRating { get; set; }
        public string? CachedImageUrl { get; set; }
        public string GooglePlaceId { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string CityName { get; set; } = string.Empty;
        public DateTime? CacheUpdatedAt { get; set; }
    }
}