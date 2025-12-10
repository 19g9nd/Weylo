using weylo.identity.DTOS;

namespace weylo.identity.Services.Interfaces
{
    public interface IAuthService
    {
        Task<(AuthResponseDto? response, string? error)> RegisterAsync(RegisterDto registerDto);
        Task<(AuthResponseDto? response, string? error)> MobileRegisterAsync(RegisterDto registerDto);
        Task<(AuthResponseDto? response, string? error)> LoginAsync(LoginDto loginDto);
        Task<(AuthResponseDto? response, string? error)> RefreshTokenAsync(string refreshToken);
        Task<bool> LogoutAsync(int userId);
        Task<(bool success, string? error)> ForgotPasswordAsync(string email);
        Task<(bool success, string? error)> ResetPasswordAsync(ResetPasswordDto resetPasswordDto);
        Task<(bool success, string? error)> DeleteAccountAsync(int userId, string password);
        Task<(bool success, string? error)> ChangePasswordAsync(int userId, ChangePasswordDto changePasswordDto);
        Task<(bool success, string? error)> VerifyEmailAsync(string token);
        Task<(bool success, string? error)> ResendVerificationEmailAsync(string email);
        Task<(bool success, string? error)> RequestOtpAsync(RequestOtpDto request);
        Task<(bool success, string? error)> VerifyOtpAsync(VerifyOtpDto request);
        Task<(bool success, string? error)> ResetPasswordWithOtpAsync(ResetPasswordWithOtpDto request);
    }
}