using System.ComponentModel.DataAnnotations;
using SharedUser = weylo.shared.Models.User;

namespace weylo.identity.Models
{
    public class User : SharedUser
    {
        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        public string? EmailVerificationToken { get; set; }
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpiry { get; set; }
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiry { get; set; }
    }
}