using Microsoft.EntityFrameworkCore;
using weylo.shared.Data;

namespace weylo.user.api.Data
{
    public class UserDbContext : BaseDbContext
    {
        public UserDbContext(DbContextOptions<UserDbContext> options)
       : base(options) { }
    }
}