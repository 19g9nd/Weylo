namespace weylo.user.api.Requests
{
    public class FilterDestinationsRequest
    {
        public int? CategoryId { get; set; }
        public List<FilterCriteria> Filters { get; set; } = new();
    }

    public class FilterCriteria
    {
        public int FilterAttributeId { get; set; }
        public string Value { get; set; } = string.Empty;
        public string Operator { get; set; } = "equals"; // "equals", "greater", "less", "contains"
    }
}