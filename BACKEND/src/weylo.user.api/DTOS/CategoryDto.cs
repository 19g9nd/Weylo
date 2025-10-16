namespace weylo.user.api.DTOS
{
    public class CategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string GoogleTypes { get; set; }
        public string Icon { get; set; }
        public string Color { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsAutoAssignable { get; set; }
        public DateTime CreatedAt { get; set; }
        
        // Statistics
        public int DestinationsCount { get; set; }
        public int UserDestinationsCount { get; set; }
    }

    public class CategoryWithDestinationsDto : CategoryDto
    {
        public List<DestinationShortDto> Destinations { get; set; } = new();
    }

    public class DestinationShortDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string CachedAddress { get; set; }
        public decimal? CachedRating { get; set; }
        public string CachedImageUrl { get; set; }
        public CityShortDto City { get; set; }
    }

    public class CityShortDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public CountryShortDto Country { get; set; }
    }

    public class CountryShortDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Code { get; set; }
    }
}