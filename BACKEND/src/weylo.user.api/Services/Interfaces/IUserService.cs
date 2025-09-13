using weylo.shared.Models;

namespace weylo.user.api.Services.Interfaces
{
    public interface IUserService
    {
        Task<User?> GetUserByIdAsync(int userId);
        Task<bool> ChangeUsernameAsync(int userId, string newUsername);
    }
}