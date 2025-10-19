using System.ComponentModel.DataAnnotations.Schema;

namespace weylo.shared.Models
{
    public class UserFavourite
    {
        public int Id { get; set; }

        [ForeignKey(nameof(User))] 
        public int UserId { get; set; }

        [ForeignKey(nameof(Destination))]
        public int DestinationId { get; set; }

        public DateTime SavedAt { get; set; } = DateTime.UtcNow;
        public string? PersonalNotes { get; set; }

        // Navigation properties
        public User User { get; set; } = null!;
        public Destination Destination { get; set; } = null!;

    }
}
