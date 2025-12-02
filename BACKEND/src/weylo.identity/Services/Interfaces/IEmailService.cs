namespace weylo.identity.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendVerificationEmailAsync(string email, string token);
        Task SendPasswordResetEmailAsync(string email, string token);
        Task SendOtpEmailAsync(string email, string otpCode, string purpose);
    }
}