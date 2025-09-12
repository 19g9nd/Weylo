using System.ComponentModel.DataAnnotations;

namespace weylo.identity.DTOS
{
    public class ResendEmailDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }
}