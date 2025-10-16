namespace weylo.shared.Models
{
    public class FilterValue
    {
        public int Id { get; set; }
        public int FilterAttributeId { get; set; }
        public int DestinationId { get; set; }
        public string Value { get; set; } = string.Empty; // "4.5", "moderate", "2 hours"
        
        // Navigation properties
        public FilterAttribute FilterAttribute { get; set; } = null!;
        public Destination Destination { get; set; } = null!;
    }
}