using System.ComponentModel.DataAnnotations;

namespace weylo.shared.Models
{
    public class RouteDay
    {
        public int Id { get; set; }

        public int UserRouteId { get; set; }

        public int DayNumber { get; set; } // day 1, day 2, etc.

        public DateTime? Date { get; set; } // Date for the day, optional

        [MaxLength(500)]
        public string? Notes { get; set; } // Optional notes for the day

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public UserRoute UserRoute { get; set; } = null!;
        public ICollection<RouteDestination> RouteDestinations { get; set; } = new List<RouteDestination>();
    }
}