namespace weylo.user.api.DTOS
{
        public class SavePlaceRequest
        {
            public string GooglePlaceId { get; set; } = string.Empty;
            public string Name { get; set; } = string.Empty;
            public decimal Latitude { get; set; }
            public decimal Longitude { get; set; }
            public string? Address { get; set; }
            public string? GoogleType { get; set; }
            public decimal? Rating { get; set; }
            public string? ImageUrl { get; set; }
            public string CityName { get; set; } = string.Empty;
            public string CountryName { get; set; } = string.Empty;
        }
}