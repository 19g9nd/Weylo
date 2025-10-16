using System.ComponentModel.DataAnnotations;

namespace weylo.shared.Models
{
    public class RouteDestination
    {
        public int Id { get; set; }

        public int RouteDayId { get; set; }
        public int UserDestinationId { get; set; }
        public int OrderInDay { get; set; }
        public DateTime? PlannedVisitDate { get; set; }
        public string? EstimatedDuration { get; set; }

        [MaxLength(500)]
        public string? UserNotes { get; set; }

        public bool IsVisited { get; set; } = false;
        public DateTime? ActualVisitDate { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public RouteDay RouteDay { get; set; } = null!;
        public UserDestination UserDestination { get; set; } = null!;
    }
}