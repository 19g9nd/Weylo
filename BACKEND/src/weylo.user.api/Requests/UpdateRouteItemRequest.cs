namespace weylo.user.api.Requests
{
    public class UpdateRouteItemRequest
    {
        public int? DayNumber { get; set; }
        public int? OrderInDay { get; set; }
        public string? UserNotes { get; set; }
        public TimeOnly? PlannedTime { get; set; }
        public bool? IsVisited { get; set; }
    }
}