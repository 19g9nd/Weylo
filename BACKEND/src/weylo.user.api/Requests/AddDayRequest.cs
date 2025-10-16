namespace weylo.user.api.Requests
{
    public class AddDayRequest
    {
        public int DayNumber { get; set; }
        public DateTime? Date { get; set; }
        public string? Notes { get; set; }
    }
}