namespace weylo.shared.Models
{
    public class RouteItem
    {
        public int Id { get; set; }
        public int RouteId { get; set; }
        public int DestinationId { get; set; }
        public int DayNumber { get; set; } // day 1, 2, 3...
        public int OrderInDay { get; set; }
        public string? UserNotes { get; set; }
        public TimeOnly? PlannedTime { get; set; }
        public bool IsVisited { get; set; }

        // Navigation properties
        public UserRoute Route { get; set; } = null!;
        public Destination Destination { get; set; } = null!;
    }
}