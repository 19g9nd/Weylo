namespace weylo.user.api.DTOS
{
    public class RouteDayDto
    {
        public int Id { get; set; }
        public int DayNumber { get; set; }
        public DateTime? Date { get; set; }
        public string? Notes { get; set; }
        public List<RouteDestinationDto> RouteDestinations { get; set; } = new();
    }
}