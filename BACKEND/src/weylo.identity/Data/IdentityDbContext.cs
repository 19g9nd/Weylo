using Microsoft.EntityFrameworkCore;
using weylo.shared.Data;
using weylo.shared.Models;

namespace weylo.identity.Data
{
    public class ApplicationDbContext : BaseDbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        protected override void ConfigureAdditionalIndexes(ModelBuilder modelBuilder)
        {
        }
    }
}