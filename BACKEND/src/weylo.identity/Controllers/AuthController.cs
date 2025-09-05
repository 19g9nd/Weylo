using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using weylo.identity.DTOS;
using weylo.identity.Services.Interfaces;

namespace weylo.identity.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var (response, error) = await _authService.RegisterAsync(registerDto);

            if (error != null)
            {
                return BadRequest(new { error });
            }

            return Ok(new
            {
                message = "Registration successful. Please check your email to verify your account.",
                data = response
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var (response, error) = await _authService.LoginAsync(loginDto);

            if (error != null)
            {
                return Unauthorized(new { error });
            }

            return Ok(new
            {
                message = "Login successful",
                data = response
            });
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto refreshTokenDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var (response, error) = await _authService.RefreshTokenAsync(refreshTokenDto.RefreshToken);

            if (error != null)
            {
                return Unauthorized(new { error });
            }

            return Ok(new
            {
                message = "Token refreshed successfully",
                data = response
            });
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized();
            }

            var success = await _authService.LogoutAsync(userId);

            if (!success)
            {
                return BadRequest(new { error = "Logout failed" });
            }

            return Ok(new { message = "Logout successful" });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized();
            }

            var user = await _authService.GetUserByIdAsync(userId);

            if (user == null)
            {
                return NotFound(new { error = "User not found" });
            }

            return Ok(new
            {
                data = new UserResponseDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    Username = user.Username,
                    IsEmailVerified = user.IsEmailVerified,
                    CreatedAt = user.CreatedAt
                }
            });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto forgotPasswordDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var (success, error) = await _authService.ForgotPasswordAsync(forgotPasswordDto.Email);

            if (error != null)
            {
                return BadRequest(new { error });
            }

            return Ok(new { message = "If the email exists, a password reset link has been sent" });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto resetPasswordDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var (success, error) = await _authService.ResetPasswordAsync(resetPasswordDto);

            if (error != null)
            {
                return BadRequest(new { error });
            }

            return Ok(new { message = "Password has been reset successfully" });
        }

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailDto verifyEmailDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var (success, error) = await _authService.VerifyEmailAsync(verifyEmailDto.Token);

            if (error != null)
            {
                return BadRequest(new { error });
            }

            return Ok(new { message = "Email verified successfully" });
        }
    }
}