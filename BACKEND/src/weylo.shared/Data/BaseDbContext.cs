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
        public DbSet<UserFavourite> UserFavourites { get; set; }
        public DbSet<RouteItem> RouteItems { get; set; }
        public DbSet<FilterAttribute> FilterAttributes { get; set; }
        public DbSet<FilterValue> FilterValues { get; set; }
        public DbSet<CategoryFilter> CategoryFilters { get; set; }
        public DbSet<OtpCode> OtpCodes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // --- OtpCode ---
            modelBuilder.Entity<OtpCode>(entity =>
            {
                entity.HasIndex(e => new { e.Email, e.Code, e.Purpose });
                entity.HasIndex(e => e.Email);
                entity.HasIndex(e => e.ExpiresAt);
                entity.HasIndex(e => e.IsUsed);

                entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
                entity.Property(e => e.Code).HasMaxLength(6).IsRequired();
                entity.Property(e => e.Purpose).HasMaxLength(50).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            });
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

                // Restrict → Cascade for Destinations
                entity.HasMany(c => c.Destinations)
                    .WithOne(d => d.Category)
                    .HasForeignKey(d => d.CategoryId)
                    .OnDelete(DeleteBehavior.Cascade);
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

                // Restrict → Cascade for Country
                entity.HasOne(c => c.Country)
                    .WithMany(co => co.Cities) // ДОБАВИЛИ навигацию
                    .HasForeignKey(c => c.CountryId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Restrict → Cascade for Destinations
                entity.HasMany(c => c.Destinations)
                    .WithOne(d => d.City)
                    .HasForeignKey(d => d.CityId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // --- Destination ---
            modelBuilder.Entity<Destination>(entity =>
            {
                entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
                entity.Property(e => e.GooglePlaceId).HasMaxLength(255).IsRequired();
                entity.Property(e => e.CachedDescription).HasMaxLength(1000);
                entity.Property(e => e.CachedImageUrl).HasMaxLength(-1);
                entity.Property(e => e.CachedAddress).HasMaxLength(500);
                entity.Property(e => e.GoogleType).HasMaxLength(100).HasDefaultValue("general");
                entity.Property(e => e.CachedRating).HasPrecision(3, 1);
                entity.Property(e => e.Latitude).HasPrecision(9, 6);
                entity.Property(e => e.Longitude).HasPrecision(9, 6);

                entity.HasMany(d => d.FilterValues)
                    .WithOne(fv => fv.Destination)
                    .HasForeignKey(fv => fv.DestinationId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Restrict → Cascade for UserFavourites
                entity.HasMany(d => d.UserFavourites)
                    .WithOne(uf => uf.Destination)
                    .HasForeignKey(uf => uf.DestinationId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Restrict → Cascade for RouteItems
                entity.HasMany(d => d.RouteItems)
                    .WithOne(ri => ri.Destination)
                    .HasForeignKey(ri => ri.DestinationId)
                    .OnDelete(DeleteBehavior.Cascade);

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

                entity.HasMany(ur => ur.RouteItems)
                    .WithOne(ri => ri.Route)
                    .HasForeignKey(ri => ri.RouteId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.Status);
            });

            // --- UserFavourite ---
            modelBuilder.Entity<UserFavourite>(entity =>
            {
                entity.HasOne(uf => uf.User)
                    .WithMany()
                    .HasForeignKey(uf => uf.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(uf => uf.Destination)
                    .WithMany(d => d.UserFavourites) // UserFavourites (было UserFavorites)
                    .HasForeignKey(uf => uf.DestinationId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(uf => new { uf.UserId, uf.DestinationId }).IsUnique();
                entity.HasIndex(uf => uf.UserId);
                entity.HasIndex(uf => uf.DestinationId);
            });

            // --- RouteItem ---
            modelBuilder.Entity<RouteItem>(entity =>
            {
                entity.Property(e => e.UserNotes).HasMaxLength(500);

                entity.HasOne(ri => ri.Route)
                    .WithMany(r => r.RouteItems)
                    .HasForeignKey(ri => ri.RouteId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(ri => ri.Destination)
                    .WithMany(d => d.RouteItems)
                    .HasForeignKey(ri => ri.DestinationId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(ri => new { ri.RouteId, ri.DayNumber, ri.OrderInDay });
                entity.HasIndex(ri => ri.RouteId);
                entity.HasIndex(ri => ri.DestinationId);
            });

            // --- FilterAttribute ---
            modelBuilder.Entity<FilterAttribute>(entity =>
            {
                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
                entity.Property(e => e.DisplayName).HasMaxLength(100).IsRequired();
                entity.Property(e => e.DataType).HasMaxLength(50).IsRequired();

                entity.HasMany(fa => fa.CategoryFilters)
                    .WithOne(cf => cf.FilterAttribute)
                    .HasForeignKey(cf => cf.FilterAttributeId)
                    .OnDelete(DeleteBehavior.Cascade);

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

                entity.HasOne(fv => fv.Destination)
                    .WithMany(d => d.FilterValues)
                    .HasForeignKey(fv => fv.DestinationId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(fv => new { fv.DestinationId, fv.FilterAttributeId }).IsUnique();
                entity.HasIndex(fv => fv.Value);
                entity.HasIndex(fv => fv.FilterAttributeId);
            });

            // --- CategoryFilter ---
            modelBuilder.Entity<CategoryFilter>(entity =>
            {
                entity.HasKey(cf => new { cf.CategoryId, cf.FilterAttributeId });

                entity.HasOne(cf => cf.Category)
                    .WithMany(c => c.CategoryFilters)
                    .HasForeignKey(cf => cf.CategoryId)
                    .OnDelete(DeleteBehavior.Cascade);

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