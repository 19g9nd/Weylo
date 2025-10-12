using Microsoft.EntityFrameworkCore;
using weylo.shared.Models;

namespace weylo.shared.Data
{
    public abstract class BaseDbContext : DbContext
    {
        protected BaseDbContext(DbContextOptions options) : base(options) { }

        // Existing
        public DbSet<User> Users { get; set; }

        // New Travel Models
        public DbSet<Category> Categories { get; set; }
        public DbSet<Country> Countries { get; set; }
        public DbSet<City> Cities { get; set; }
        public DbSet<Destination> Destinations { get; set; }
        public DbSet<UserRoute> UserRoutes { get; set; }
        public DbSet<RouteDestination> RouteDestinations { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // --- User ---
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(e => e.Email).IsUnique();
                entity.HasIndex(e => e.Username).IsUnique();

                entity.HasIndex(e => e.RefreshToken);
                entity.HasIndex(e => e.EmailVerificationToken);
                entity.HasIndex(e => e.PasswordResetToken);

                entity.Property(e => e.Email)
                    .HasMaxLength(255)
                    .IsRequired();

                entity.Property(e => e.Username)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(e => e.PasswordHash).IsRequired();

                entity.Property(e => e.Role)
                    .HasMaxLength(50)
                    .HasDefaultValue("User");

                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.UpdatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

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

            // --- Category ---
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasIndex(e => e.Name).IsUnique();
                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.Icon).HasMaxLength(50);
                entity.Property(e => e.GoogleTypes).HasMaxLength(500);
            });

            // --- Country ---
            modelBuilder.Entity<Country>(entity =>
            {
                entity.HasIndex(e => e.Code).IsUnique();
                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Code).HasMaxLength(3).IsRequired();
                entity.Property(e => e.GooglePlaceId).HasMaxLength(255);
            });

            // --- City ---
            modelBuilder.Entity<City>(entity =>
            {
                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
                entity.Property(e => e.GooglePlaceId).HasMaxLength(255).IsRequired();

                entity.HasOne(c => c.Country)
                    .WithMany()
                    .HasForeignKey(c => c.CountryId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // --- Destination ---
            modelBuilder.Entity<Destination>(entity =>
            {
                entity.Property(e => e.Name)
                    .HasMaxLength(200)
                    .IsRequired();

                entity.Property(e => e.GooglePlaceId)
                    .HasMaxLength(255)
                    .IsRequired();

                entity.Property(e => e.CachedDescription)
                    .HasMaxLength(1000);

                entity.Property(e => e.CachedImageUrl)
                    .HasMaxLength(500);

                entity.Property(e => e.CachedAddress)
                    .HasMaxLength(500);

                entity.Property(e => e.GoogleType)
                    .HasMaxLength(100)
                    .HasDefaultValue("general");

                entity.Property(e => e.CachedRating)
                    .HasPrecision(3, 1);

                entity.Property(e => e.Latitude)
                    .HasPrecision(9, 6);

                entity.Property(e => e.Longitude)
                    .HasPrecision(9, 6);

                entity.HasOne(d => d.Category)
                    .WithMany()
                    .HasForeignKey(d => d.CategoryId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.City)
                    .WithMany()
                    .HasForeignKey(d => d.CityId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.GooglePlaceId)
                    .IsUnique();

                entity.HasIndex(e => new { e.CityId, e.Name });
            });

            // --- UserRoute ---
            modelBuilder.Entity<UserRoute>(entity =>
            {
                entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
                entity.Property(e => e.Notes).HasMaxLength(1000);
                entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("Draft");

                entity.HasOne(ur => ur.User)
                    .WithMany()
                    .HasForeignKey(ur => ur.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // --- RouteDestination ---
            modelBuilder.Entity<RouteDestination>(entity =>
            {
                entity.Property(e => e.UserNotes).HasMaxLength(500);

                entity.HasOne(rd => rd.UserRoute)
                    .WithMany(ur => ur.RouteDestinations)
                    .HasForeignKey(rd => rd.UserRouteId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(rd => rd.Destination)
                    .WithMany(d => d.RouteDestinations) 
                    .HasForeignKey(rd => rd.DestinationId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(rd => new { rd.UserRouteId, rd.DestinationId }).IsUnique();

                entity.HasIndex(rd => new { rd.UserRouteId, rd.Order });
            });

            ConfigureAdditionalIndexes(modelBuilder);
        }

        protected virtual void ConfigureAdditionalIndexes(ModelBuilder modelBuilder) { }
    }
}