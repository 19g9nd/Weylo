using System.ComponentModel.DataAnnotations;

namespace weylo.identity.DTOS
{
    public class ResendEmailDTO
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }
}