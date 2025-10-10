using System.ComponentModel.DataAnnotations;

namespace weylo.user.api.Requests
{
    public class AddDestinationToRouteRequest
    {
        [Required]
        public int DestinationId { get; set; }

        [Required]
        [Range(1, 100)]
        public int Order { get; set; }

        public DateTime? PlannedVisitDate { get; set; }
        public TimeSpan? EstimatedDuration { get; set; }

        [MaxLength(500)]
        public string? UserNotes { get; set; }
    }
}