using System.Security.Claims;
using weylo.shared.Models;

namespace weylo.shared.Services.Interfaces
{
    public interface IJwtService
    {
        string GenerateAccessToken(User user);
        ClaimsPrincipal? ValidateToken(string token);
    }
}