namespace weylo.user.api.DTOS
{
    public class UserRouteDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int UserId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? Notes { get; set; }
        public string Status { get; set; } = "Draft";
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation
        public UserDto? User { get; set; }
        public List<RouteItemDto> RouteItems { get; set; } = new();
    }
}