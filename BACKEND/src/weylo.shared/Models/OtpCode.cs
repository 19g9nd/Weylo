using System.ComponentModel.DataAnnotations;

namespace weylo.shared.Models
{
    public class OtpCode
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Email { get; set; } = string.Empty;

        [Required, StringLength(6)]
        public string Code { get; set; } = string.Empty;

        [Required]
        public string Purpose { get; set; } = string.Empty; // "EmailVerification" or "PasswordReset"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime ExpiresAt { get; set; }

        public bool IsUsed { get; set; } = false;

        public int Attempts { get; set; } = 0;
    }
}