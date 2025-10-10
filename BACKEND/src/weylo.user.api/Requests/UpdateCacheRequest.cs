namespace weylo.user.api.Requests
{
    public class UpdateCacheRequest
    {
        public string? Description { get; set; }
        public decimal? Rating { get; set; }
        public string? ImageUrl { get; set; }
        public string? Address { get; set; }
    }
}