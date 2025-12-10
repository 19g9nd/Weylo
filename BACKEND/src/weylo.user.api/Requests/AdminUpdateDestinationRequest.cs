namespace weylo.user.api.Requests
{
    public class AdminUpdateDestinationRequest
    {
        public string? Name { get; set; }
        public int? CategoryId { get; set; }
        public string? CachedAddress { get; set; }
        public string? CachedDescription { get; set; }
        public string? CachedImageUrl { get; set; }
    }
}