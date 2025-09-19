using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using weylo.admin.api.DTOS;
using weylo.admin.api.Services.Interfaces;
using weylo.shared.Constants;

namespace weylo.admin.api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {

        private readonly IAdminService _adminService;
        private readonly ILogger<AdminController> _logger;

        public AdminController(IAdminService adminService, ILogger<AdminController> logger)
        {
            _adminService = adminService;
            _logger = logger;
        }

        /// <summary>
        /// Get list of users
        /// </summary>
        [HttpGet("users")]
        [Authorize(Policy = Policies.AdminOrSuperAdmin)]
        public async Task<ActionResult<List<UserDto>>> GetUsers()
        {
            try
            {
                var users = await _adminService.GetUsersAsync();

                var userDtos = users.Select(u => new UserDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    Username = u.Username,
                    Role = u.Role,
                    IsEmailVerified = u.IsEmailVerified,
                    CreatedAt = u.CreatedAt,
                    UpdatedAt = u.UpdatedAt
                }).ToList();

                return Ok(userDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Delete a user (cannot delete self or SuperAdmin)
        /// </summary>
        [HttpDelete("users/{userId}")]
        [Authorize(Policy = Policies.AdminOrSuperAdmin)]
        public async Task<ActionResult> DeleteUser(int userId)
        {
            try
            {
                var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
                if (currentUserIdClaim == null)
                    return Unauthorized("Cannot identify current user");

                var currentUserId = int.Parse(currentUserIdClaim.Value);

                var targetUser = await _adminService.GetUserByIdAsync(userId);
                if (targetUser == null)
                    return NotFound("User not found");

                if (currentUserId == userId)
                    return BadRequest("Cannot delete your own account");

                var currentUserRole = User.FindFirst("role")?.Value ?? "";
                if (targetUser.Role == Roles.SuperAdmin && currentUserRole != Roles.SuperAdmin)
                    return Forbid("You cannot delete a SuperAdmin");

                var result = await _adminService.DeleteUserAsync(userId);
                if (!result)
                    return StatusCode(500, "Failed to delete user");

                _logger.LogInformation("User {UserId} deleted by {AdminId}", userId, currentUserId);
                return Ok("User deleted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user {UserId}", userId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Change a user's role
        /// </summary>
        [HttpPut("users/{userId}/role")]
        [Authorize(Policy = Policies.SuperAdminOnly)]
        public async Task<ActionResult> ChangeUserRole(int userId, [FromBody] ChangeRoleRequest request)
        {
            try
            {
                var validRoles = new[] { Roles.User, Roles.Admin, Roles.SuperAdmin };
                if (!validRoles.Contains(request.NewRole))
                    return BadRequest("Invalid role");

                var currentUserId = int.Parse(User.FindFirst("sub")?.Value ?? "0");
                var targetUser = await _adminService.GetUserByIdAsync(userId);
                if (targetUser == null)
                    return NotFound("User not found");

                if (currentUserId == userId)
                    return BadRequest("You cannot change your own role");

                if (targetUser.Role == Roles.SuperAdmin && request.NewRole != Roles.SuperAdmin)
                    return BadRequest("Cannot remove SuperAdmin role from another SuperAdmin");

                var result = await _adminService.ChangeUserRoleAsync(userId, request.NewRole);
                if (!result)
                    return StatusCode(500, "Failed to update role");

                _logger.LogInformation(
                    "User {UserId} role changed to {NewRole} by {AdminId}",
                    userId, request.NewRole, currentUserId
                );

                return Ok("User role updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing user role for {UserId}", userId);
                return StatusCode(500, "Internal server error");
            }
        }

    }
}


// POST   /api/admin/categories
// PUT    /api/admin/categories/{id}
// DELETE /api/admin/categories/{id}

// POST   /api/admin/destinations
// PUT    /api/admin/destinations/{id}
// DELETE /api/admin/destinations/{id}

// GET    /api/admin/routes
// POST   /api/admin/routes/{id}/add-city
