using System.ComponentModel.DataAnnotations;

namespace weylo.user.api.Requests
{
    public class UpdateRouteDestinationRequest
    {
        [Range(1, 100)]
        public int? Order { get; set; }

        public DateTime? PlannedVisitDate { get; set; }
        public TimeSpan? EstimatedDuration { get; set; }

        [MaxLength(500)]
        public string? UserNotes { get; set; }

        public bool? IsVisited { get; set; }
        public DateTime? ActualVisitDate { get; set; }
    }
}