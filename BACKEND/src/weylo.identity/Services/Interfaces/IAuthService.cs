using weylo.identity.DTOS;
using weylo.identity.Models;

namespace weylo.identity.Services.Interfaces
{
    public interface IAuthService
    {
        Task<(AuthResponseDto? response, string? error)> RegisterAsync(RegisterDto registerDto);
        Task<(AuthResponseDto? response, string? error)> LoginAsync(LoginDto loginDto);
        Task<(AuthResponseDto? response, string? error)> RefreshTokenAsync(string refreshToken);
        Task<bool> LogoutAsync(int userId);
        Task<User?> GetUserByIdAsync(int userId);
        Task<(bool success, string? error)> ForgotPasswordAsync(string email);
        Task<(bool success, string? error)> ResetPasswordAsync(ResetPasswordDto resetPasswordDto);
        Task<(bool success, string? error)> VerifyEmailAsync(string token);
    }
}