using Microsoft.EntityFrameworkCore;
using weylo.shared.Data;

namespace weylo.admin.api.Data
{
     public class AdminDbContext : BaseDbContext
    {
        public AdminDbContext(DbContextOptions<AdminDbContext> options)
       : base(options) { }
    } 
}   