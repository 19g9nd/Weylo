using System.ComponentModel.DataAnnotations;

namespace weylo.user.api.Requests
{
    public class UpdateRouteRequest
    {
          [MaxLength(200)]
        public string? Name { get; set; }

        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }

        [MaxLength(50)]
        public string? Status { get; set; }
    }
}