namespace weylo.user.api.Requests
{
    public class ReorderDestinationsRequest
    {
        public List<int> DestinationOrder { get; set; } = new();
    }
}