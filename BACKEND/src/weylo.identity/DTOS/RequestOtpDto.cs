using System.ComponentModel.DataAnnotations;

namespace weylo.identity.DTOS
{
    public class RequestOtpDto
    {
        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public OtpPurpose Purpose { get; set; }
    }

    public enum OtpPurpose
    {
        EmailVerification,
        PasswordReset
    }
}