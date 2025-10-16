namespace weylo.shared.Models
{
    public class CategoryFilter
    {
        public int CategoryId { get; set; }
        public int FilterAttributeId { get; set; }
        
        // Navigation properties
        public Category Category { get; set; } = null!;
        public FilterAttribute FilterAttribute { get; set; } = null!;
    }
}