namespace weylo.user.api.Requests
{
    public class UpdateRouteDestinationRequest
    {
        public int? OrderInDay { get; set; }
        public DateTime? PlannedVisitDate { get; set; }
        public string? EstimatedDuration { get; set; }
        public string? UserNotes { get; set; }
        public bool? IsVisited { get; set; }
        public DateTime? ActualVisitDate { get; set; }
    }
}