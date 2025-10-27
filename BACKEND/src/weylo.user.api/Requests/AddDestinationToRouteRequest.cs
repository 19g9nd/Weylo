namespace weylo.user.api.Requests
{
    public class AddDestinationToRouteRequest
    {
        public int DestinationId { get; set; }
        public int DayNumber { get; set; } = 1;
        public int OrderInDay { get; set; }
        public string? UserNotes { get; set; }
        public DateTime? PlannedTime { get; set; }
    }
}