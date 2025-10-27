namespace weylo.user.api.Requests
{
    public class UpdateRouteItemRequest
    {
        public int? DayNumber { get; set; }
        public int? OrderInDay { get; set; }
        public string? UserNotes { get; set; }
        public DateTime? PlannedTime { get; set; }
        public bool? IsVisited { get; set; }
    }
}