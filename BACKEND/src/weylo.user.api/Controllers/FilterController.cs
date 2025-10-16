using Microsoft.AspNetCore.Mvc;
using weylo.user.api.DTOS;
using weylo.user.api.Requests;
using weylo.user.api.Services.Interfaces;

namespace weylo.user.api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FiltersController : ControllerBase
    {
        private readonly IFilterService _filterService;

        public FiltersController(IFilterService filterService)
        {
            _filterService = filterService;
        }

        #region Categories Endpoints

        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<CategoryDto>>> GetCategories()
        {
            var categories = await _filterService.GetCategoriesAsync();
            return Ok(categories);
        }

        [HttpGet("categories/{id}")]
        public async Task<ActionResult<CategoryDto>> GetCategory(int id)
        {
            var category = await _filterService.GetCategoryWithDestinationsAsync(id);
            if (category == null)
                return NotFound($"Category with id {id} not found");

            return Ok(category);
        }
        /// <summary>
        /// Initialize default filters for a category based on its type
        /// </summary>
        [HttpPost("categories/{categoryId}/initialize-filters")]
        public async Task<ActionResult<List<CategoryFilterDto>>> InitializeCategoryFilters(int categoryId)
        {
            try
            {
                var result = await _filterService.InitializeDefaultFiltersForCategoryAsync(categoryId);
                return Ok(result);
            }
            catch (BadHttpRequestException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
        [HttpPost("categories")]
        public async Task<ActionResult<CategoryDto>> CreateCategory(CreateCategoryRequest request)
        {
            try
            {
                var category = await _filterService.CreateCategoryAsync(request);
                return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
            }
            catch (BadHttpRequestException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("categories/{id}")]
        public async Task<ActionResult<CategoryDeletionResult>> DeleteCategory(int id)
        {
            var result = await _filterService.DeleteCategoryAsync(id);

            if (!result.CanDelete)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpGet("categories/{id}/can-delete")]
        public async Task<ActionResult<CategoryDeletionResult>> CanDeleteCategory(int id)
        {
            var result = await _filterService.CanDeleteCategoryAsync(id);
            return Ok(result);
        }

        [HttpPost("categories/transfer")]
        public async Task<ActionResult<CategoryTransferResult>> TransferCategoryDestinations(TransferCategoryRequest request)
        {
            try
            {
                var result = await _filterService.TransferCategoryDestinationsAsync(request.FromCategoryId, request.ToCategoryId);
                return Ok(result);
            }
            catch (BadHttpRequestException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("destinations/{destinationId}/category/{categoryId}")]
        public async Task<ActionResult<DestinationDto>> UpdateDestinationCategory(int destinationId, int categoryId)
        {
            try
            {
                var destination = await _filterService.UpdateDestinationCategoryAsync(destinationId, categoryId);
                return Ok(destination);
            }
            catch (BadHttpRequestException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("categories/{categoryId}/destinations")]
        public async Task<ActionResult<IEnumerable<DestinationDto>>> GetDestinationsByCategory(int categoryId)
        {
            var destinations = await _filterService.GetDestinationsByCategoryAsync(categoryId);
            return Ok(destinations);
        }

        #endregion

        #region Filter Attributes Endpoints

        [HttpGet("attributes")]
        public async Task<ActionResult<IEnumerable<FilterAttributeDto>>> GetFilterAttributes()
        {
            var attributes = await _filterService.GetFilterAttributesAsync();
            return Ok(attributes);
        }

        [HttpPost("attributes")]
        public async Task<ActionResult<FilterAttributeDto>> CreateFilterAttribute(CreateFilterAttributeRequest request)
        {
            try
            {
                var attribute = await _filterService.CreateFilterAttributeAsync(request);
                return CreatedAtAction(nameof(GetFilterAttributes), new { id = attribute.Id }, attribute);
            }
            catch (BadHttpRequestException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("attributes/{id}")]
        public async Task<ActionResult<bool>> DeleteFilterAttribute(int id)
        {
            var result = await _filterService.DeleteFilterAttributeAsync(id);
            if (!result)
                return BadRequest("Cannot delete filter attribute - it has related data");

            return Ok(true);
        }

        #endregion

        #region Category Filters Endpoints

        [HttpGet("categories/{categoryId}/filters")]
        public async Task<ActionResult<IEnumerable<CategoryFilterDto>>> GetCategoryFilters(int categoryId)
        {
            var filters = await _filterService.GetCategoryFiltersAsync(categoryId);
            return Ok(filters);
        }

        [HttpPost("categories/{categoryId}/filters")]
        public async Task<ActionResult<CategoryFilterDto>> AddFilterToCategory(int categoryId, AddFilterToCategoryRequest request)
        {
            if (categoryId != request.CategoryId)
                return BadRequest("Category ID in URL and request body do not match");

            try
            {
                var categoryFilter = await _filterService.AddFilterToCategoryAsync(request);
                return CreatedAtAction(nameof(GetCategoryFilters), new { categoryId = categoryFilter.CategoryId }, categoryFilter);
            }
            catch (BadHttpRequestException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("categories/{categoryId}/filters/{filterAttributeId}")]
        public async Task<ActionResult<bool>> RemoveFilterFromCategory(int categoryId, int filterAttributeId)
        {
            var result = await _filterService.RemoveFilterFromCategoryAsync(categoryId, filterAttributeId);
            if (!result)
                return NotFound("Filter not found for this category");

            return Ok(true);
        }

        #endregion

        #region Filter Values Endpoints

        [HttpPost("values")]
        public async Task<ActionResult<FilterValueDto>> SetFilterValue(SetFilterValueRequest request)
        {
            try
            {
                var filterValue = await _filterService.SetFilterValueAsync(request);
                return Ok(filterValue);
            }
            catch (BadHttpRequestException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("destinations/{destinationId}/attributes/{filterAttributeId}")]
        public async Task<ActionResult<bool>> RemoveFilterValue(int destinationId, int filterAttributeId)
        {
            var result = await _filterService.RemoveFilterValueAsync(destinationId, filterAttributeId);
            if (!result)
                return NotFound("Filter value not found");

            return Ok(true);
        }

        #endregion

        #region Filtering Endpoints

        [HttpPost("destinations/filter")]
        public async Task<ActionResult<IEnumerable<DestinationDto>>> GetFilteredDestinations(FilterDestinationsRequest request)
        {
            var destinations = await _filterService.GetFilteredDestinationsAsync(request);
            return Ok(destinations);
        }

        [HttpGet("categories/{categoryId}/metadata")]
        public async Task<ActionResult<FilterMetadataDto>> GetFilterMetadata(int categoryId)
        {
            try
            {
                var metadata = await _filterService.GetFilterMetadataAsync(categoryId);
                return Ok(metadata);
            }
            catch (BadHttpRequestException ex)
            {
                return NotFound(ex.Message);
            }
        }

        #endregion
    }

    // Request DTO для передачи категорий
    public class TransferCategoryRequest
    {
        public int FromCategoryId { get; set; }
        public int ToCategoryId { get; set; }
    }

    // Result DTOs
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