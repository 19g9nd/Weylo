using System.ComponentModel.DataAnnotations;

namespace weylo.user.api.DTOS
{
    public class ChangeUsernameDto
    {
        [Required]
        public string NewUsername { get; set; } = string.Empty;
    }
}