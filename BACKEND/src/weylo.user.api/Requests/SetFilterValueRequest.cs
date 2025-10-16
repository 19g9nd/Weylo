namespace weylo.user.api.Requests
{
    public class SetFilterValueRequest
    {
        public int DestinationId { get; set; }
        public int FilterAttributeId { get; set; }
        public string Value { get; set; } = string.Empty;
    }
}