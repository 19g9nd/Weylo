namespace weylo.user.api.Requests
{
    public class AddDestinationToRouteRequest
    {
        public int DestinationId { get; set; }
        public int DayNumber { get; set; }
        public int OrderInDay { get; set; }
        public string? UserNotes { get; set; }
        public DateTime? PlannedVisitDate { get; set; }
        public string? EstimatedDuration { get; set; }
    }
}