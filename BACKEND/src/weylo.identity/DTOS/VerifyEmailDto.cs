using System.ComponentModel.DataAnnotations;

namespace weylo.identity.DTOS
{
    public class VerifyEmailDto
    {
        [Required]
        public string Token { get; set; } = string.Empty;
    }
}