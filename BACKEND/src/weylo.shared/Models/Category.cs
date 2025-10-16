using System.ComponentModel.DataAnnotations;

namespace weylo.shared.Models
{
    // Categories MINE (mapping on Google types)
    public class Category
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty; // "Family Places", "Extreme", "Top-10"

        [MaxLength(500)]
        public string? Description { get; set; }

        [MaxLength(50)]
        public string? Icon { get; set; }
        
        public int Priority { get; set; } = 0; // Для определения приоритета при совпадении нескольких категорий

        // Маппинг на Google Places types (через запятую)
        [MaxLength(500)]
        public string? GoogleTypes { get; set; } = string.Empty; // "museum,tourist_attraction"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<CategoryFilter> CategoryFilters { get; set; } = new List<CategoryFilter>();
        // Навигационное свойство ко всем местам этой категории
        public virtual ICollection<Destination> Destinations { get; set; } = new List<Destination>();
    }
}