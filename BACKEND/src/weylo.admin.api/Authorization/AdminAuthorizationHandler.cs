using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using weylo.shared.Constants;

namespace weylo.admin.api.Authorization
{
    public class AdminAuthorizationHandler : AuthorizationHandler<AdminRequirement>
    {
        protected override Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            AdminRequirement requirement)
        {
            var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(userRole))
            {
                return Task.CompletedTask;
            }

            if (userRole == requirement.RequiredRole)
            {
                context.Succeed(requirement);
                return Task.CompletedTask;
            }

            if (userRole == Roles.SuperAdmin)
            {
                context.Succeed(requirement);
                return Task.CompletedTask;
            }

            return Task.CompletedTask;
        }
    }
}