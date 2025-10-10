using System.ComponentModel.DataAnnotations;

namespace weylo.user.api.Requests
{
    public class ReorderDestinationsRequest
    {
        [Required]
        [MinLength(1)]
        public List<int> DestinationOrder { get; set; } = new List<int>();
    }
}