using Microsoft.EntityFrameworkCore;
using weylo.shared.Models;

namespace weylo.shared.Data
{
    public abstract class BaseDbContext : DbContext
    {
        protected BaseDbContext(DbContextOptions options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Country> Countries { get; set; }
        public DbSet<City> Cities { get; set; }
        public DbSet<Destination> Destinations { get; set; }
        public DbSet<UserRoute> UserRoutes { get; set; }
        public DbSet<RouteDay> RouteDays { get; set; }
        public DbSet<UserDestination> UserDestinations { get; set; }
        public DbSet<RouteDestination> RouteDestinations { get; set; }
        public DbSet<FilterAttribute> FilterAttributes { get; set; }
        public DbSet<FilterValue> FilterValues { get; set; }
        public DbSet<CategoryFilter> CategoryFilters { get; set; }

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

                entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
                entity.Property(e => e.Username).HasMaxLength(100).IsRequired();
                entity.Property(e => e.PasswordHash).IsRequired();
                entity.Property(e => e.Role).HasMaxLength(50).HasDefaultValue("User");
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            // --- Category ---
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasIndex(e => e.Name).IsUnique();
                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.Icon).HasMaxLength(50);
                entity.Property(e => e.GoogleTypes).HasMaxLength(500);

                entity.HasMany(c => c.CategoryFilters)
                    .WithOne(cf => cf.Category)
                    .HasForeignKey(cf => cf.CategoryId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(c => c.Destinations)
                    .WithOne(d => d.Category)
                    .HasForeignKey(d => d.CategoryId)
                    .OnDelete(DeleteBehavior.Restrict);
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

                entity.HasMany(c => c.Destinations)
                    .WithOne(d => d.City)
                    .HasForeignKey(d => d.CityId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // --- Destination ---
            modelBuilder.Entity<Destination>(entity =>
            {
                entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
                entity.Property(e => e.GooglePlaceId).HasMaxLength(255).IsRequired();
                entity.Property(e => e.CachedDescription).HasMaxLength(1000);
                entity.Property(e => e.CachedImageUrl).HasMaxLength(500);
                entity.Property(e => e.CachedAddress).HasMaxLength(500);
                entity.Property(e => e.GoogleType).HasMaxLength(100).HasDefaultValue("general");
                entity.Property(e => e.CachedRating).HasPrecision(3, 1);
                entity.Property(e => e.Latitude).HasPrecision(9, 6);
                entity.Property(e => e.Longitude).HasPrecision(9, 6);

                entity.HasMany(d => d.FilterValues)
                    .WithOne(fv => fv.Destination)
                    .HasForeignKey(fv => fv.DestinationId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(d => d.UserDestinations)
                    .WithOne(ud => ud.Destination)
                    .HasForeignKey(ud => ud.DestinationId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.GooglePlaceId).IsUnique();
                entity.HasIndex(e => new { e.CityId, e.Name });
                entity.HasIndex(e => e.CategoryId);
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

                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.Status);
            });

            // --- RouteDay ---
            modelBuilder.Entity<RouteDay>(entity =>
            {
                entity.HasOne(rd => rd.UserRoute)
                    .WithMany(ur => ur.RouteDays)
                    .HasForeignKey(rd => rd.UserRouteId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(e => e.Notes).HasMaxLength(500);
                entity.HasIndex(rd => new { rd.UserRouteId, rd.DayNumber }).IsUnique();
            });

            // --- UserDestination ---
            modelBuilder.Entity<UserDestination>(entity =>
            {
                entity.HasOne(ud => ud.User)
                    .WithMany()
                    .HasForeignKey(ud => ud.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(ud => ud.RouteDestinations)
                    .WithOne(rd => rd.UserDestination)
                    .HasForeignKey(rd => rd.UserDestinationId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(ud => new { ud.UserId, ud.DestinationId }).IsUnique();
                entity.HasIndex(ud => ud.UserId);
                entity.HasIndex(ud => ud.DestinationId);
            });

            // --- RouteDestination ---
            modelBuilder.Entity<RouteDestination>(entity =>
            {
                entity.Property(e => e.UserNotes).HasMaxLength(500);

                entity.HasOne(rd => rd.RouteDay)
                    .WithMany(day => day.RouteDestinations)
                    .HasForeignKey(rd => rd.RouteDayId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(rd => new { rd.RouteDayId, rd.OrderInDay });
                entity.HasIndex(rd => rd.UserDestinationId);
            });

            // --- FilterAttribute ---
            modelBuilder.Entity<FilterAttribute>(entity =>
            {
                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
                entity.Property(e => e.DisplayName).HasMaxLength(100).IsRequired();
                entity.Property(e => e.DataType).HasMaxLength(50).IsRequired();

                entity.HasIndex(e => e.Name);
                entity.HasIndex(e => e.DataType);
            });

            // --- FilterValue ---
            modelBuilder.Entity<FilterValue>(entity =>
            {
                entity.Property(e => e.Value).HasMaxLength(200).IsRequired();

                entity.HasOne(fv => fv.FilterAttribute)
                    .WithMany(fa => fa.FilterValues)
                    .HasForeignKey(fv => fv.FilterAttributeId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(fv => new { fv.DestinationId, fv.FilterAttributeId }).IsUnique();
                entity.HasIndex(fv => fv.Value);
                entity.HasIndex(fv => fv.FilterAttributeId);
            });

            // --- CategoryFilter ---
            modelBuilder.Entity<CategoryFilter>(entity =>
            {
                entity.HasKey(cf => new { cf.CategoryId, cf.FilterAttributeId });

                entity.HasOne(cf => cf.FilterAttribute)
                    .WithMany(fa => fa.CategoryFilters)
                    .HasForeignKey(cf => cf.FilterAttributeId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            ConfigureAdditionalIndexes(modelBuilder);
        }

        protected virtual void ConfigureAdditionalIndexes(ModelBuilder modelBuilder) { }
    }
}