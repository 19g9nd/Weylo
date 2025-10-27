namespace weylo.user.api.Requests
{
    public class UpdateRouteRequest
    {
        public string? Name { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Notes { get; set; }
        public string? Status { get; set; }
    }
}