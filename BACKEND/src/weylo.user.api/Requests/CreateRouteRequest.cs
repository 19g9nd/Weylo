using System.ComponentModel.DataAnnotations;

namespace weylo.user.api.Requests
{
    public class CreateRouteRequest
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }
    }
}