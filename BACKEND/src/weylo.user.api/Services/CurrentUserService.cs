using System.Security.Claims;
using weylo.user.api.Services.Interfaces;

namespace weylo.user.api.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<CurrentUserService> _logger;

        public CurrentUserService(
            IHttpContextAccessor httpContextAccessor,
            ILogger<CurrentUserService> logger)
        {
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        public int UserId
        {
            get
            {
                var user = _httpContextAccessor.HttpContext?.User;

                if (user?.Identity?.IsAuthenticated != true)
                {
                    _logger.LogWarning("User not authenticated");
                    throw new UnauthorizedAccessException("User not authenticated");
                }

                var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim))
                {
                    _logger.LogError("User ID claim not found. Available claims: {Claims}",
                        string.Join(", ", user.Claims.Select(c => c.Type)));
                    throw new UnauthorizedAccessException("User ID not found in claims");
                }

                if (!int.TryParse(userIdClaim, out int userId))
                {
                    _logger.LogError("Failed to parse user ID: {UserIdClaim}", userIdClaim);
                    throw new UnauthorizedAccessException($"Invalid user ID format: {userIdClaim}");
                }

                return userId;
            }
        }

        public string? Username
        {
            get
            {
                var user = _httpContextAccessor.HttpContext?.User;
                return user?.FindFirst(ClaimTypes.Name)?.Value;
            }
        }

        public string? Email
        {
            get
            {
                var user = _httpContextAccessor.HttpContext?.User;
                return user?.FindFirst(ClaimTypes.Email)?.Value;
            }
        }

        public string? Role
        {
            get
            {
                var user = _httpContextAccessor.HttpContext?.User;
                return user?.FindFirst(ClaimTypes.Role)?.Value;
            }
        }

        public bool IsAuthenticated
        {
            get
            {
                return _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
            }
        }
    }
}