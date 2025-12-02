using System.ComponentModel.DataAnnotations;

namespace weylo.identity.DTOS
{
    public class VerifyOtpDto
    {
        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required, StringLength(6, MinimumLength = 6)]
        public string OtpCode { get; set; } = string.Empty;

        [Required]
        public OtpPurpose Purpose { get; set; }
    }
}