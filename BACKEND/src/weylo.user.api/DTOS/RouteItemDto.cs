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
        public TimeOnly? PlannedTime { get; set; } // Will serialize as "14:00:00"
        public bool IsVisited { get; set; }
        public DestinationDto Destination { get; set; } = null!;
    }
}