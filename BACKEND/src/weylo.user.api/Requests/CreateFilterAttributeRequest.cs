namespace weylo.user.api.Requests
{
    public class CreateFilterAttributeRequest
    {
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string DataType { get; set; } = string.Empty; // "number", "string", "boolean"
    }
}