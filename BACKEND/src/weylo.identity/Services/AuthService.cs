using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using weylo.shared.Configuration;
using weylo.identity.Data;
using weylo.identity.DTOS;
using weylo.shared.Utils;
using weylo.shared.Models;

namespace weylo.identity.Services.Interfaces
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly JwtSettings _jwtSettings;
        private readonly IEmailService _emailService;

        public AuthService(ApplicationDbContext context, IOptions<JwtSettings> jwtSettings, IEmailService emailService)
        {
            _context = context;
            _jwtSettings = jwtSettings.Value;
            _emailService = emailService;
        }
        public async Task<(AuthResponseDto? response, string? error)> MobileRegisterAsync(RegisterDto registerDto)
        {
            try
            {
                // Check if user already exists
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == registerDto.Email || u.Username == registerDto.Username);

                if (existingUser != null)
                {
                    return (null, "User with this email or username already exists");
                }

                // Create new user (not verified yet)
                var user = new User
                {
                    Email = registerDto.Email,
                    Username = registerDto.Username,
                    PasswordHash = PasswordHelper.HashPassword(registerDto.Password),
                    IsEmailVerified = false,
                    EmailVerificationToken = null, // We'll use OTP instead
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Generate and send OTP code
                var otpResult = await RequestOtpAsync(new RequestOtpDto
                {
                    Email = registerDto.Email,
                    Purpose = OtpPurpose.EmailVerification
                });

                if (!otpResult.success)
                {
                    // Rollback user creation if OTP sending fails
                    _context.Users.Remove(user);
                    await _context.SaveChangesAsync();
                    return (null, $"Registration failed: {otpResult.error}");
                }

                // Generate tokens (user can use the app but with limited access until verified)
                var accessToken = GenerateJwtToken(user);
                var refreshToken = GenerateRefreshToken();

                // Save refresh token
                user.RefreshToken = refreshToken;
                user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryInDays);
                await _context.SaveChangesAsync();

                return (new AuthResponseDto
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpiryInMinutes),
                }, null);
            }
            catch (Exception)
            {
                return (null, "Registration failed. Please try again.");
            }
        }
        public async Task<(AuthResponseDto? response, string? error)> RegisterAsync(RegisterDto registerDto)
        {
            // Check if user already exists
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == registerDto.Email || u.Username == registerDto.Username);

            if (existingUser != null)
            {
                return (null, "User with this email or username already exists");
            }

            // Create new user
            var user = new User
            {
                Email = registerDto.Email,
                Username = registerDto.Username,
                PasswordHash = PasswordHelper.HashPassword(registerDto.Password),
                IsEmailVerified = false,
                EmailVerificationToken = GenerateRandomToken(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Send verification email
            await _emailService.SendVerificationEmailAsync(user.Email, user.EmailVerificationToken);

            // Generate tokens
            var accessToken = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();

            // Save refresh token
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
            await _context.SaveChangesAsync();

            return (new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15)
            }, null);
        }

        public async Task<(AuthResponseDto? response, string? error)> LoginAsync(LoginDto loginDto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == loginDto.Email);

            if (user == null || !PasswordHelper.VerifyPassword(loginDto.Password, user.PasswordHash))
            {
                return (null, "Invalid email or password");
            }

            // Generate tokens
            var accessToken = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();

            // Save refresh token
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryInDays);
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return (new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpiryInMinutes)
            }, null);
        }

        public async Task<(AuthResponseDto? response, string? error)> RefreshTokenAsync(string refreshToken)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken && u.RefreshTokenExpiry > DateTime.UtcNow);

            if (user == null)
            {
                return (null, "Invalid or expired refresh token");
            }

            // Generate new tokens
            var newAccessToken = GenerateJwtToken(user);
            var newRefreshToken = GenerateRefreshToken();

            // Update refresh token
            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryInDays);
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return (new AuthResponseDto
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpiryInMinutes)
            }, null);
        }

        public async Task<bool> LogoutAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<(bool success, string? error)> ForgotPasswordAsync(string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
            {
                // Don't reveal if user exists
                return (true, null);
            }

            user.PasswordResetToken = GenerateRandomToken();
            user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _emailService.SendPasswordResetEmailAsync(user.Email, user.PasswordResetToken);

            return (true, null);
        }

        public async Task<(bool success, string? error)> ResetPasswordAsync(ResetPasswordDto resetPasswordDto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.PasswordResetToken == resetPasswordDto.Token
                    && u.PasswordResetTokenExpiry > DateTime.UtcNow);

            if (user == null)
            {
                return (false, "Invalid or expired reset token");
            }

            user.PasswordHash = PasswordHelper.HashPassword(resetPasswordDto.NewPassword);
            user.PasswordResetToken = null;
            user.PasswordResetTokenExpiry = null;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return (true, null);
        }
        public async Task<(bool success, string? error)> ChangePasswordAsync(int userId, ChangePasswordDto changePasswordDto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return (false, "User not found");

            // Verify current password
            if (!PasswordHelper.VerifyPassword(changePasswordDto.CurrentPassword, user.PasswordHash))
                return (false, "Current password is incorrect");

            // Hash new password
            user.PasswordHash = PasswordHelper.HashPassword(changePasswordDto.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
                return (true, null);
            }
            catch
            {
                return (false, "Failed to change password");
            }
        }
        public async Task<(bool success, string? error)> VerifyEmailAsync(string token)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.EmailVerificationToken == token);

            if (user == null)
            {
                return (false, "Invalid verification token");
            }

            user.IsEmailVerified = true;
            user.EmailVerificationToken = null;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return (true, null);
        }

        public async Task<(bool success, string? error)> ResendVerificationEmailAsync(string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
                return (false, "User not found.");

            if (user.IsEmailVerified)
                return (false, "Email already confirmed.");

            // Генерируем новый токен
            user.EmailVerificationToken = GenerateRandomToken();
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _emailService.SendVerificationEmailAsync(user.Email, user.EmailVerificationToken);

            return (true, null);
        }

        public async Task<(bool success, string? error)> RequestOtpAsync(RequestOtpDto request)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

                if (user == null)
                {
                    // Не раскрываем существование email для безопасности
                    return (true, null);
                }

                if (request.Purpose == OtpPurpose.EmailVerification && user.IsEmailVerified)
                {
                    return (false, "Email is already verified");
                }

                // Удаляем старые неиспользованные OTP коды для этого email и purpose
                var oldOtps = await _context.OtpCodes
                    .Where(o => o.Email == request.Email && o.Purpose == request.Purpose.ToString() && !o.IsUsed)
                    .ToListAsync();

                _context.OtpCodes.RemoveRange(oldOtps);

                // Генерируем 6-значный код
                var otpCode = new Random().Next(100000, 999999).ToString();

                // Создаем новый OTP
                var otp = new OtpCode
                {
                    Email = request.Email,
                    Code = otpCode,
                    Purpose = request.Purpose.ToString(),
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(10),
                    IsUsed = false,
                    Attempts = 0
                };

                _context.OtpCodes.Add(otp);
                await _context.SaveChangesAsync();

                // Отправляем email
                await _emailService.SendOtpEmailAsync(request.Email, otpCode, request.Purpose.ToString());

                return (true, null);
            }
            catch (Exception ex)
            {
                return (false, $"Failed to send OTP: {ex.Message}");
            }
        }

        public async Task<(bool success, string? error)> VerifyOtpAsync(VerifyOtpDto request)
        {
            try
            {
                var otp = await _context.OtpCodes
                    .Where(o => o.Email == request.Email
                        && o.Code == request.OtpCode
                        && o.Purpose == request.Purpose.ToString()
                        && !o.IsUsed)
                    .OrderByDescending(o => o.CreatedAt)
                    .FirstOrDefaultAsync();

                if (otp == null)
                {
                    return (false, "Invalid or expired OTP code");
                }

                if (otp.Attempts >= 3)
                {
                    return (false, "Too many attempts. Please request a new code");
                }

                if (otp.ExpiresAt < DateTime.UtcNow)
                {
                    return (false, "OTP code expired");
                }

                // Увеличиваем счетчик попыток
                otp.Attempts++;
                await _context.SaveChangesAsync();

                if (otp.Code != request.OtpCode)
                {
                    return (false, "Invalid OTP code");
                }

                // Помечаем как использованный
                otp.IsUsed = true;
                await _context.SaveChangesAsync();

                // Если это верификация email, обновляем пользователя
                if (request.Purpose == OtpPurpose.EmailVerification)
                {
                    var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
                    if (user != null)
                    {
                        user.IsEmailVerified = true;
                        user.EmailVerificationToken = null;
                        user.UpdatedAt = DateTime.UtcNow;
                        await _context.SaveChangesAsync();
                    }
                }

                return (true, null);
            }
            catch (Exception ex)
            {
                return (false, $"Failed to verify OTP: {ex.Message}");
            }
        }

        public async Task<(bool success, string? error)> DeleteAccountAsync(int userId, string password)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                    return (false, "User not found");

                // Verify password before deletion
                if (!PasswordHelper.VerifyPassword(password, user.PasswordHash))
                    return (false, "Incorrect password");

                // Delete all user-related data
                var otpCodes = await _context.OtpCodes
                    .Where(o => o.Email == user.Email)
                    .ToListAsync();
                _context.OtpCodes.RemoveRange(otpCodes);

                var routes = await _context.UserRoutes
                    .Where(r => r.UserId == userId)
                    .ToListAsync();
                _context.UserRoutes.RemoveRange(routes);

                var favourites = await _context.UserFavourites
                    .Where(f => f.UserId == userId)
                    .ToListAsync();
                _context.UserFavourites.RemoveRange(favourites);

                _context.Users.Remove(user);

                await _context.SaveChangesAsync();

                return (true, null);
            }
            catch (Exception ex)
            {
                return (false, $"Failed to delete account: {ex.Message}");
            }
        }

        public async Task<(bool success, string? error)> ResetPasswordWithOtpAsync(ResetPasswordWithOtpDto request)
        {
            try
            {
                // Сначала проверяем OTP
                var verifyResult = await VerifyOtpAsync(new VerifyOtpDto
                {
                    Email = request.Email,
                    OtpCode = request.OtpCode,
                    Purpose = OtpPurpose.PasswordReset
                });

                if (!verifyResult.success)
                {
                    return (false, verifyResult.error);
                }

                // Находим пользователя
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
                if (user == null)
                {
                    return (false, "User not found");
                }

                // Обновляем пароль
                user.PasswordHash = PasswordHelper.HashPassword(request.NewPassword);
                user.PasswordResetToken = null;
                user.PasswordResetTokenExpiry = null;
                user.UpdatedAt = DateTime.UtcNow;

                // Очищаем refresh token для безопасности
                user.RefreshToken = null;
                user.RefreshTokenExpiry = null;

                await _context.SaveChangesAsync();

                return (true, null);
            }
            catch (Exception ex)
            {
                return (false, $"Failed to reset password: {ex.Message}");
            }
        }

        // Добавьте helper метод для очистки старых OTP (опционально)
        public async Task CleanupExpiredOtpCodesAsync()
        {
            var expiredOtps = await _context.OtpCodes
                .Where(o => o.ExpiresAt < DateTime.UtcNow || o.IsUsed)
                .ToListAsync();

            _context.OtpCodes.RemoveRange(expiredOtps);
            await _context.SaveChangesAsync();
        }

        private string GenerateJwtToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_jwtSettings.Key
    ?? throw new InvalidOperationException("JWT Key not configured")
);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim("sub", user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim(ClaimTypes.Role, user.Role ?? "User"),
                }),
                Expires = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpiryInMinutes),
                Issuer = _jwtSettings.Issuer,
                Audience = _jwtSettings.Audience,
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        private string GenerateRandomToken()
        {
            return Guid.NewGuid().ToString("N");
        }

    }

}