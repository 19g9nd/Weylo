using System.ComponentModel.DataAnnotations;

namespace weylo.user.api.Requests
{
    public class ChangeUsernameRequest
    {
        [Required]
        [MinLength(3)]
        [MaxLength(50)]
        public string NewUsername { get; set; } = string.Empty;
    }
}