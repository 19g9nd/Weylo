namespace weylo.user.api.DTOS
{
    public class RouteDetailsDto
    {
       public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? Notes { get; set; }
        public string Status { get; set; } = "Draft";
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<RouteDayDto> RouteDays { get; set; } = new();
    }
}