using weylo.shared.Models;
using weylo.user.api.Controllers.Data;
using weylo.user.api.Services.Interfaces;

namespace weylo.user.api.Services
{
    public class UserService : IUserService
    {
        private readonly UserDbContext _context;
        public UserService(UserDbContext context)
        {
            this._context = context;
        }
        public async Task<User?> GetUserByIdAsync(int userId)
        {
            return await _context.Users.FindAsync(userId);
        }

    }
}