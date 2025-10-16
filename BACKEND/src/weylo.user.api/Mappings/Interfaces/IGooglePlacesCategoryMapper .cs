using weylo.shared.Models;

namespace weylo.user.api.Mappings.Interfaces
{
    public interface IGooglePlacesCategoryMapper
    {
        Task<int?> DetermineCategoryAsync(string[] googleTypes);
        Task<Category?> GetBestMatchingCategoryAsync(string googlePlaceId);
    }
}