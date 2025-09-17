using weylo.shared.Models;

namespace weylo.admin.api.Services.Interfaces
{
    public interface IAdminService
    {
        Task<List<User>> GetUsersAsync();
        Task<bool> DeleteUserAsync(int userId);
        Task<bool> ChangeUserRoleAsync(int userId, string newRole);
        Task<User?> GetUserByIdAsync(int userId);
    }
}
