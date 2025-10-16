namespace weylo.user.api.DTOS
{
    public class FilterMetadataDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public List<FilterAttributeDto> AvailableFilters { get; set; } = new();
        public Dictionary<string, List<string>> FilterOptions { get; set; } = new(); // attributeName -> [values]
    }
}