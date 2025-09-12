using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using weylo.identity.DTOS;
using weylo.identity.Services.Interfaces;

namespace weylo.identity.Controllers
{
    /// <summary>
    /// Controller for managing user authentication and authorization
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        /// <summary>
        /// Initializes the authentication controller
        /// </summary>
        /// <param name="authService">Authentication service</param>
        /// <param name="logger">Logger</param>
        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        /// <summary>
        /// Register a new user
        /// </summary>
        /// <param name="registerDto">User registration data</param>
        /// <returns>Registration result</returns>
        /// <remarks>
        /// Example request:
        /// 
        ///     POST /api/auth/register
        ///     {
        ///         "email": "user@example.com",
        ///         "username": "username",
        ///         "password": "SecurePassword123!"
        ///     }
        /// 
        /// </remarks>
        /// <response code="200">Registration successful. Please check your email to verify your account</response>
        /// <response code="400">Invalid request data or user already exists</response>
        [HttpPost("register")]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(typeof(object), 400)]
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

        /// <summary>
        /// User login
        /// </summary>
        /// <param name="loginDto">Login credentials (email and password)</param>
        /// <returns>JWT tokens and user information</returns>
        /// <remarks>
        /// Example request:
        /// 
        ///     POST /api/auth/login
        ///     {
        ///         "email": "user@example.com",
        ///         "password": "SecurePassword123!"
        ///     }
        /// 
        /// </remarks>
        /// <response code="200">Login successful</response>
        /// <response code="400">Invalid request data</response>
        /// <response code="401">Invalid email or password</response>
        [HttpPost("login")]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(typeof(object), 400)]
        [ProducesResponseType(typeof(object), 401)]
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

        /// <summary>
        /// Refresh JWT access token
        /// </summary>
        /// <param name="refreshTokenDto">Refresh token</param>
        /// <returns>New JWT tokens</returns>
        /// <remarks>
        /// Example request:
        /// 
        ///     POST /api/auth/refresh
        ///     {
        ///         "refreshToken": "your-refresh-token-here"
        ///     }
        /// 
        /// </remarks>
        /// <response code="200">Token refreshed successfully</response>
        /// <response code="400">Invalid request data</response>
        /// <response code="401">Invalid refresh token</response>
        [HttpPost("refresh")]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(typeof(object), 400)]
        [ProducesResponseType(typeof(object), 401)]
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

        /// <summary>
        /// User logout
        /// </summary>
        /// <returns>Logout result</returns>
        /// <response code="200">Logout successful</response>
        /// <response code="400">Logout failed</response>
        /// <response code="401">User not authorized</response>
        [HttpPost("logout")]
        [Authorize]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(typeof(object), 400)]
        [ProducesResponseType(typeof(object), 401)]
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

        /// <summary>
        /// Request password recovery
        /// </summary>
        /// <param name="forgotPasswordDto">User email for password recovery</param>
        /// <returns>Password reset link sending result</returns>
        /// <remarks>
        /// Example request:
        /// 
        ///     POST /api/auth/forgot-password
        ///     {
        ///         "email": "user@example.com"
        ///     }
        /// 
        /// </remarks>
        /// <response code="200">If email exists, password reset link has been sent</response>
        /// <response code="400">Invalid request data</response>
        [HttpPost("forgot-password")]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(typeof(object), 400)]
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

        /// <summary>
        /// Reset user password
        /// </summary>
        /// <param name="resetPasswordDto">Password reset data (token and new password)</param>
        /// <returns>Password reset result</returns>
        /// <remarks>
        /// Example request:
        /// 
        ///     POST /api/auth/reset-password
        ///     {
        ///         "token": "reset-token-from-email",
        ///         "newPassword": "NewSecurePassword123!"
        ///     }
        /// 
        /// </remarks>
        /// <response code="200">Password reset successfully</response>
        /// <response code="400">Invalid request data or invalid token</response>
        [HttpPost("reset-password")]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(typeof(object), 400)]
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
        
        /// <summary>
        /// Change user password
        /// </summary>
        /// <param name="changePasswordDto">Password change data</param>
        /// <returns>Password change result</returns>
        /// <remarks>
        /// Example request:
        /// 
        ///     POST /api/auth/change-password
        ///     {
        ///         "currentPassword": "CurrentPassword123!",
        ///         "newPassword": "NewSecurePassword123!",
        ///         "confirmPassword": "NewSecurePassword123!"
        ///     }
        /// 
        /// </remarks>
        /// <response code="200">Password changed successfully</response>
        /// <response code="400">Invalid request data or current password incorrect</response>
        /// <response code="401">User not authorized</response>
        [HttpPost("change-password")]
        [Authorize]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(typeof(object), 400)]
        [ProducesResponseType(typeof(object), 401)]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Get user ID from JWT token - use the same claim type as in token generation
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { error = "Invalid user token" });
            }

            var (success, error) = await _authService.ChangePasswordAsync(userId, changePasswordDto);

            if (!success)
            {
                return BadRequest(new { error = error ?? "Failed to change password" });
            }

            return Ok(new { message = "Password changed successfully" });
        }

        /// <summary>
        /// Email address verification
        /// </summary>
        /// <param name="token">Verification token from email</param>
        /// <returns>Email verification result</returns>
        /// <response code="200">Email verified successfully</response>
        /// <response code="400">Invalid or missing token</response>
        [HttpGet("verify-email")]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(typeof(object), 400)]
        public async Task<IActionResult> VerifyEmail([FromQuery] string token)
        {
            if (string.IsNullOrEmpty(token))
            {
                return BadRequest(new { error = "Token is required" });
            }

            var (success, error) = await _authService.VerifyEmailAsync(token);

            if (!success)
            {
                return BadRequest(new { error });
            }

            return Ok(new { message = "Email verified successfully" });
        }

        /// <summary>
        /// Resend email verification email
        /// </summary>
        /// <param name="request">User email for resending</param>
        /// <returns>Resend result</returns>
        /// <remarks>
        /// Example request:
        /// 
        ///     POST /api/auth/resend-verification-email
        ///     {
        ///         "email": "user@example.com"
        ///     }
        /// 
        /// </remarks>
        /// <response code="200">Verification email sent again</response>
        /// <response code="400">Invalid request data or sending error</response>
        [HttpPost("resend-verification-email")]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(typeof(object), 400)]
        public async Task<IActionResult> ResendVerificationEmail([FromBody] ResendEmailDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (success, error) = await _authService.ResendVerificationEmailAsync(request.Email);

            if (!success)
                return BadRequest(new { error });

            return Ok(new { message = "Verification email sent again" });
        }
    }
}