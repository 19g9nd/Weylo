using Microsoft.EntityFrameworkCore;
using weylo.admin.api.Services.Interfaces;
using weylo.shared.Constants;
using weylo.shared.Data;
using weylo.shared.Models;
using weylo.shared.Utils;

namespace weylo.admin.api.Services
{
    public class DataSeeder : IDataSeeder
    {
        private readonly BaseDbContext _context;
        private readonly ILogger<DataSeeder> _logger;
        private readonly IConfiguration _configuration;

        public DataSeeder(
            BaseDbContext context,
            ILogger<DataSeeder> logger,
            IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
        }
        public async Task SeedAsync()
        {
            try
            {
                await _context.Database.EnsureCreatedAsync();
                var superAdmin = await _context.Users
                    .FirstOrDefaultAsync(u => u.Role == Roles.SuperAdmin);

                if (superAdmin != null)
                {
                    _logger.LogInformation("SuperAdmin already exists with email: {Email}", superAdmin.Email);
                    return;
                }

                var email = _configuration["SUPERADMIN_EMAIL"];
                var username = _configuration["SUPERADMIN_USERNAME"];
                var password = _configuration["SUPERADMIN_PASSWORD"];

                if (string.IsNullOrEmpty(password))
                {
                    _logger.LogError("SUPERADMIN_PASSWORD not configured in environment variables");
                    throw new InvalidOperationException("SuperAdmin password must be configured");
                }

                // create new SuperAdmin
                var newSuperAdmin = new User
                {
                    Email = email,
                    Username = username,
                    PasswordHash = PasswordHelper.HashPassword(password),
                    Role = Roles.SuperAdmin,
                    IsEmailVerified = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Users.Add(newSuperAdmin);
                await _context.SaveChangesAsync();

                _logger.LogInformation("SuperAdmin created successfully with email: {Email}", email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to seed SuperAdmin");
                throw;
            }
        }
    }
}