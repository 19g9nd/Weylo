using Microsoft.EntityFrameworkCore;
using weylo.identity.Models;

namespace weylo.identity.Data
{
    public class ApplicationDbContext : DbContext
    {
         public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(e => e.Email).IsUnique();
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.RefreshToken);
                entity.HasIndex(e => e.EmailVerificationToken);
                entity.HasIndex(e => e.PasswordResetToken);
            });
        }
    }
}