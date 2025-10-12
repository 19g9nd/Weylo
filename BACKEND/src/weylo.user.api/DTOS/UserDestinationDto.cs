namespace weylo.user.api.DTOS
{
    public class UserDestinationDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string City { get; set; }
        public string Category { get; set; }

        // User-specific fields
        public string UserNotes { get; set; }
        public DateTime? PlannedVisitDate { get; set; }
        public bool IsVisited { get; set; }
        public string RouteName { get; set; }
    }
}