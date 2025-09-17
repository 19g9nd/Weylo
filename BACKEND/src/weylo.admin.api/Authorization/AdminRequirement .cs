using Microsoft.AspNetCore.Authorization;

namespace weylo.admin.api.Authorization
{
    public class AdminRequirement : IAuthorizationRequirement
    {
        public string RequiredRole { get; }

        public AdminRequirement(string requiredRole)
        {
            RequiredRole = requiredRole;
        }
    }
}