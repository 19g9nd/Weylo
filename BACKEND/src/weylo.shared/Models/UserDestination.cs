using System.ComponentModel.DataAnnotations.Schema;

namespace weylo.shared.Models
{
    public class UserDestination
    {
        public int Id { get; set; }

        [ForeignKey(nameof(User))]
        public int UserId { get; set; }

        [ForeignKey(nameof(Destination))]
        public int DestinationId { get; set; }

        public DateTime SavedAt { get; set; } = DateTime.UtcNow;
        public bool IsFavorite { get; set; }
        public string? PersonalNotes { get; set; }

        // Navigation properties
        public User User { get; set; } = null!;
        public Destination Destination { get; set; } = null!;

        public ICollection<RouteDestination> RouteDestinations { get; set; } = new List<RouteDestination>();
    }
}
