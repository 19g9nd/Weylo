using System.ComponentModel.DataAnnotations;

namespace weylo.identity.DTOS
{
    public class RefreshTokenDto
    {
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }
}