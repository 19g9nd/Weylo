namespace weylo.user.api.Requests
{
    public class SearchDestinationsRequest
    {
        public string? Query { get; set; }
        public int? CityId { get; set; }
        public int? CategoryId { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}