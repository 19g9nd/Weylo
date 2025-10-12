namespace weylo.user.api.DTOS
{
    public class CountryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? GooglePlaceId { get; set; }
    }
}