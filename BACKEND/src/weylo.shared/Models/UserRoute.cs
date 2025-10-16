using System.ComponentModel.DataAnnotations;

namespace weylo.shared.Models
{
    // User routes
    public class UserRoute
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty; // "My Trip to Baku"

        public int UserId { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }

        [MaxLength(50)]
        public string Status { get; set; } = "Draft"; // "Draft", "Active", "Completed"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public User User { get; set; } = null!;

        // List of destinations in the route
        public ICollection<RouteDestination> RouteDestinations { get; set; } = new List<RouteDestination>();
        public ICollection<RouteDay> RouteDays { get; set; } = new List<RouteDay>();
    }
}