using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using weylo.shared.Constants;
using weylo.user.api.DTOS;
using weylo.user.api.Requests;
using weylo.user.api.Services.Interfaces;

namespace weylo.user.api.Controllers
{
    /// <summary>
    /// Controller for managing categories and related operations
    /// </summary>
    [ApiController]
    [Route("api/categories")]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public CategoriesController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        /// <summary>
        /// Get all available categories
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoryDto>>> GetAllCategories()
        {
            var categories = await _categoryService.GetCategoriesAsync();
            return Ok(categories);
        }

        /// <summary>
        /// Get specific category by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<CategoryDto>> GetCategory(int id)
        {
            var category = await _categoryService.GetCategoryWithDestinationsAsync(id);
            if (category == null)
                return NotFound($"Category with id {id} not found");

            return Ok(category);
        }

        /// <summary>
        /// Check if a category can be deleted (used by admin panel)
        /// </summary>
        [HttpGet("{id}/can-delete")]
        [Authorize(Policy = Policies.AdminOrSuperAdmin)]
        public async Task<ActionResult<CategoryDeletionResult>> CanDeleteCategory(int id)
        {
            var result = await _categoryService.CanDeleteCategoryAsync(id);
            return Ok(result);
        }

        /// <summary>
        /// Get all destinations belonging to a specific category
        /// </summary>
        [HttpGet("{categoryId}/destinations")]
        public async Task<ActionResult<IEnumerable<DestinationDto>>> GetDestinationsByCategory(int categoryId)
        {
            var destinations = await _categoryService.GetDestinationsByCategoryAsync(categoryId);
            return Ok(destinations);
        }

        /// <summary>
        /// Update an existing category (admin only)
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Policy = Policies.AdminOrSuperAdmin)]
        public async Task<ActionResult<CategoryDto>> UpdateCategory(int id, UpdateCategoryRequest request)
        {
            try
            {
                var category = await _categoryService.UpdateCategoryAsync(id, request);
                if (category == null)
                    return NotFound($"Category with id {id} not found");

                return Ok(category);
            }
            catch (BadHttpRequestException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
        /// <summary>
        /// Create a new category (admin only)
        /// </summary>
        [HttpPost]
        [Authorize(Policy = Policies.AdminOrSuperAdmin)]
        public async Task<ActionResult<CategoryDto>> CreateCategory(CreateCategoryRequest request)
        {
            try
            {
                var category = await _categoryService.CreateCategoryAsync(request);
                return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
            }
            catch (BadHttpRequestException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Update a destination's category assignment (admin only)
        /// </summary>
        [HttpPut("{categoryId}/destinations/{destinationId}")]
        [Authorize(Policy = Policies.AdminOrSuperAdmin)]
        public async Task<ActionResult<DestinationDto>> UpdateDestinationCategory(
            int destinationId,
            int categoryId)
        {
            try
            {
                var destination = await _categoryService.UpdateDestinationCategoryAsync(
                    destinationId, categoryId);
                return Ok(destination);
            }
            catch (BadHttpRequestException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Transfer all destinations from one category to another (admin only)
        /// </summary>
        [HttpPost("transfer")]
        [Authorize(Policy = Policies.AdminOrSuperAdmin)]
        public async Task<ActionResult<CategoryTransferResult>> TransferCategoryDestinations(
            TransferCategoryRequest request)
        {
            try
            {
                var result = await _categoryService.TransferCategoryDestinationsAsync(
                    request.FromCategoryId, request.ToCategoryId);
                return Ok(result);
            }
            catch (BadHttpRequestException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Delete a category (admin only)
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Policy = Policies.AdminOrSuperAdmin)]
        public async Task<ActionResult<CategoryDeletionResult>> DeleteCategory(int id)
        {
            try
            {
                var result = await _categoryService.DeleteCategoryAsync(id);
                return Ok(result);
            }
            catch (BadHttpRequestException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }

    /// <summary>
    /// Request for transferring destinations between categories
    /// </summary>
    public class TransferCategoryRequest
    {
        public int FromCategoryId { get; set; }
        public int ToCategoryId { get; set; }
    }

    /// <summary>
    /// Result of category deletion validation
    /// </summary>
    public class CategoryDeletionResult
    {
        public bool CanDelete { get; set; }
        public string Reason { get; set; }
        public int RelatedDestinationsCount { get; set; }
        public int RelatedFiltersCount { get; set; }
    }

    /// <summary>
    /// Result of category transfer operation
    /// </summary>
    public class CategoryTransferResult
    {
        public bool Success { get; set; }
        public int TransferredDestinationsCount { get; set; }
        public string FromCategoryName { get; set; }
        public string ToCategoryName { get; set; }
    }
}