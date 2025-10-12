namespace weylo.user.api.DTOS
{
    public class CityDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int CountryId { get; set; }
        public string? CountryName { get; set; }
        public string? CountryCode { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string GooglePlaceId { get; set; } = string.Empty;
    }
}