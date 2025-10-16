using weylo.user.api.DTOS;
using weylo.user.api.Requests;

namespace weylo.user.api.Services.Interfaces
{
    public interface IFilterService
    {
        // Categories
        Task<CategoryDto> CreateCategoryAsync(CreateCategoryRequest request);
        Task<IEnumerable<CategoryDto>> GetCategoriesAsync();
        Task<CategoryDeletionResult> DeleteCategoryAsync(int id);
        Task<CategoryDeletionResult> CanDeleteCategoryAsync(int id);
        Task<CategoryTransferResult> TransferCategoryDestinationsAsync(int fromCategoryId, int toCategoryId);
        Task<DestinationDto> UpdateDestinationCategoryAsync(int destinationId, int categoryId);
        Task<CategoryDto> GetCategoryWithDestinationsAsync(int id);
        Task<IEnumerable<DestinationDto>> GetDestinationsByCategoryAsync(int categoryId);

        // Filter Attributes
        Task<FilterAttributeDto> CreateFilterAttributeAsync(CreateFilterAttributeRequest request);
        Task<IEnumerable<FilterAttributeDto>> GetFilterAttributesAsync();
        Task<bool> DeleteFilterAttributeAsync(int id);

        // Category Filters
        Task<CategoryFilterDto> AddFilterToCategoryAsync(AddFilterToCategoryRequest request);
        Task<List<CategoryFilterDto>> InitializeDefaultFiltersForCategoryAsync(int categoryId);
        Task<bool> RemoveFilterFromCategoryAsync(int categoryId, int filterAttributeId);
        Task<IEnumerable<CategoryFilterDto>> GetCategoryFiltersAsync(int categoryId);

        // Filter Values
        Task<FilterValueDto> SetFilterValueAsync(SetFilterValueRequest request);
        Task<bool> RemoveFilterValueAsync(int destinationId, int filterAttributeId);

        // Filtering
        Task<IEnumerable<DestinationDto>> GetFilteredDestinationsAsync(FilterDestinationsRequest request);
        Task<FilterMetadataDto> GetFilterMetadataAsync(int categoryId);
    }

    public class CategoryDeletionResult
    {
        public bool CanDelete { get; set; }
        public string Reason { get; set; }
        public int RelatedDestinationsCount { get; set; }
        public int RelatedFiltersCount { get; set; }
    }

    public class CategoryTransferResult
    {
        public bool Success { get; set; }
        public int TransferredDestinationsCount { get; set; }
        public string FromCategoryName { get; set; }
        public string ToCategoryName { get; set; }
    }
}