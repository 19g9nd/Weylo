namespace weylo.shared.Models
{
    public class FilterAttribute
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty; // "rating", "price_level", "subcategories"
        public string DisplayName { get; set; } = string.Empty; // "Rating", "Price Level", "Cuisine Type"
        public string DataType { get; set; } = string.Empty; // "number", "string", "boolean", "multi_select"
        
        // multi_select filter (like, subcategories)
        public string? PossibleValues { get; set; } // JSON: ["italian", "japanese", ...]
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public ICollection<FilterValue> FilterValues { get; set; } = new List<FilterValue>();
        public ICollection<CategoryFilter> CategoryFilters { get; set; } = new List<CategoryFilter>();
    }
}