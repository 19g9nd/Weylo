using Microsoft.EntityFrameworkCore;
using weylo.shared.Models;
using weylo.user.api.Data;
using weylo.user.api.Services.Interfaces;

namespace weylo.user.api.Services
{
    public class UserService : IUserService
    {
        private readonly UserDbContext _context;
        public UserService(UserDbContext context)
        {
            _context = context;
        }
        
        public async Task<bool> ChangeUsernameAsync(int userId, string newUsername)
        {
            // Check if the new username is already taken
            bool isUsernameTaken = await _context.Users
                .AnyAsync(u => u.Username == newUsername && u.Id != userId);

            if (isUsernameTaken)
            {
                return false;
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return false;
            }

            user.Username = newUsername;
            user.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<User?> GetUserByIdAsync(int userId)
        {
            return await _context.Users.FindAsync(userId);
        }

    }
}