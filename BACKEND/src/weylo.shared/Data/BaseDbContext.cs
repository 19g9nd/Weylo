using Microsoft.EntityFrameworkCore;
using weylo.shared.Models;

namespace weylo.shared.Data
{
    public abstract class BaseDbContext : DbContext
    {
        protected BaseDbContext(DbContextOptions options) : base(options) { }

        public DbSet<User> Users { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                // Основные индексы (нужны всем сервисам)
                entity.HasIndex(e => e.Email).IsUnique();
                entity.HasIndex(e => e.Username).IsUnique();
                
                // Индексы для Identity полей (будут создаваться, но использоваться только в Identity API)
                entity.HasIndex(e => e.RefreshToken);
                entity.HasIndex(e => e.EmailVerificationToken);
                entity.HasIndex(e => e.PasswordResetToken);
                
                // Настройка свойств
                entity.Property(e => e.Email)
                    .HasMaxLength(255)
                    .IsRequired();
                    
                entity.Property(e => e.Username)
                    .HasMaxLength(100)
                    .IsRequired();
                    
                entity.Property(e => e.PasswordHash)
                    .IsRequired();
                    
                entity.Property(e => e.Role)
                    .HasMaxLength(50)
                    .HasDefaultValue("User");
                    
                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");
                    
                entity.Property(e => e.UpdatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");
                    
                // Identity-specific поля
                entity.Property(e => e.EmailVerificationToken)
                    .HasMaxLength(255)
                    .IsRequired(false);
                    
                entity.Property(e => e.PasswordResetToken)
                    .HasMaxLength(255)
                    .IsRequired(false);
                    
                entity.Property(e => e.RefreshToken)
                    .HasMaxLength(500)
                    .IsRequired(false);
            });

            ConfigureAdditionalIndexes(modelBuilder);
        }

        protected virtual void ConfigureAdditionalIndexes(ModelBuilder modelBuilder) { }
    }
}