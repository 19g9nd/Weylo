namespace weylo.shared.Models
{
    public class FilterAttribute
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty; // "Rating", "PriceLevel", "Duration"
        public string DisplayName { get; set; } = string.Empty; // "Rating", "Price Level", "Estimated Duration"
        public string DataType { get; set; } = string.Empty; // "number", "string", "boolean"
        
        // Navigation properties
        public ICollection<FilterValue> FilterValues { get; set; } = new List<FilterValue>();
        public ICollection<CategoryFilter> CategoryFilters { get; set; } = new List<CategoryFilter>();
    }
}