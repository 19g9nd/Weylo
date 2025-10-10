using System.ComponentModel.DataAnnotations;

namespace weylo.shared.Models
{
    // Link between UserRoute and Destination with additional info
    public class RouteDestination
    {
        public int Id { get; set; }

        public int UserRouteId { get; set; }
        public int DestinationId { get; set; }

        public int Order { get; set; } // visit order
        public DateTime? PlannedVisitDate { get; set; }
        public TimeSpan? EstimatedDuration { get; set; } // planned visit time

        [MaxLength(500)]
        public string? UserNotes { get; set; } // user notes

        public bool IsVisited { get; set; } = false; // visited or not toggle 
        public DateTime? ActualVisitDate { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public UserRoute UserRoute { get; set; } = null!;
        public Destination Destination { get; set; } = null!;
    }
}