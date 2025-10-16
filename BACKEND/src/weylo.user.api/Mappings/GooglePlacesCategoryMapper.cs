using Microsoft.EntityFrameworkCore;
using weylo.shared.Models;
using weylo.user.api.Data;
using weylo.user.api.Mappings.Interfaces;

namespace weylo.user.api.Services
{
    public class GooglePlacesCategoryMapper : IGooglePlacesCategoryMapper
    {
        private readonly UserDbContext _context;

        public GooglePlacesCategoryMapper(UserDbContext context)
        {
            _context = context;
        }

        public async Task<int?> DetermineCategoryAsync(string[] googleTypes)
        {
            if (googleTypes == null || !googleTypes.Any())
                return null;

            // Получаем все категории с их Google Types
            var categories = await _context.Categories
                .Where(c => !string.IsNullOrEmpty(c.GoogleTypes))
                .OrderByDescending(c => c.Priority) // Сначала приоритетные
                .ToListAsync();

            // Ищем наилучшее совпадение
            Category? bestMatch = null;
            int maxMatches = 0;

            foreach (var category in categories)
            {
                var categoryTypes = category.GoogleTypes
                    .Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(t => t.Trim().ToLower())
                    .ToHashSet();

                var matchCount = googleTypes
                    .Select(t => t.ToLower())
                    .Count(t => categoryTypes.Contains(t));

                if (matchCount > maxMatches)
                {
                    maxMatches = matchCount;
                    bestMatch = category;
                }
            }

            return bestMatch?.Id;
        }

        public async Task<Category?> GetBestMatchingCategoryAsync(string googlePlaceId)
        {
            // Здесь можно вызвать Google Places API для получения типов места
            // Или использовать уже сохраненный GoogleType из Destination
            var destination = await _context.Destinations
                .FirstOrDefaultAsync(d => d.GooglePlaceId == googlePlaceId);

            if (destination == null)
                return null;

            var types = destination.GoogleType.Split(',', StringSplitOptions.RemoveEmptyEntries);
            var categoryId = await DetermineCategoryAsync(types);

            return categoryId.HasValue
                ? await _context.Categories.FindAsync(categoryId.Value)
                : null;
        }
    }
}