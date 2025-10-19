namespace weylo.user.api.DTOS
{
    public class RouteItemDto
    {
        public int Id { get; set; }
        public int RouteId { get; set; }
        public int DestinationId { get; set; }
        public int DayNumber { get; set; }
        public int OrderInDay { get; set; }
        public string? UserNotes { get; set; }
        public DateTime? PlannedTime { get; set; }
        public bool IsVisited { get; set; }
        public DestinationDto Destination { get; set; } = null!;
    }
}