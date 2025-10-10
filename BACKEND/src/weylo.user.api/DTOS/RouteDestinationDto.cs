namespace weylo.user.api.DTOS
{
    public class RouteDestinationDto
    {
        public int Id { get; set; }
        public int Order { get; set; }
        public DateTime? PlannedVisitDate { get; set; }
        public TimeSpan? EstimatedDuration { get; set; }
        public string? UserNotes { get; set; }
        public bool IsVisited { get; set; }
        public DateTime? ActualVisitDate { get; set; }
        public DestinationDto Destination { get; set; } = null!;
    }
}