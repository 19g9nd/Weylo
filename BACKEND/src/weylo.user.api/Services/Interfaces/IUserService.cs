using weylo.shared.Models;

namespace weylo.user.api.Services.Interfaces
{
    public interface IUserService
    {
        Task<User?> GetUserByIdAsync(int userId);
    }
}