namespace weylo.user.api.DTOS
{
    public class CountryDto
    {
       public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty; // "US", "UK", "AZ"
        public double SouthBound { get; set; }
        public double WestBound { get; set; }
        public double NorthBound { get; set; }
        public double EastBound { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? GooglePlaceId { get; set; }
    }
}