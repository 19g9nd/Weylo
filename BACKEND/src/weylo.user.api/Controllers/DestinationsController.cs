using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using weylo.shared.Constants;
using weylo.user.api.DTOS;
using weylo.user.api.Requests;
using weylo.user.api.Services.Interfaces;

namespace weylo.user.api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DestinationsController : ControllerBase
    {
        private readonly IDestinationService _service;
        private readonly ILogger<DestinationsController> _logger;

        public DestinationsController(
            IDestinationService service,
            ILogger<DestinationsController> logger)
        {
            _service = service;
            _logger = logger;
        }

        /// <summary>
        /// Save a new place/destination to the catalogue
        /// </summary>
        [HttpPost("save")]
        public async Task<ActionResult<DestinationDto>> SavePlace([FromBody] SavePlaceRequest request)
        {
            try
            {
                var result = await _service.SavePlaceAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving place");
                return StatusCode(500, new { error = "Failed to save place" });
            }
        }

        /// <summary>
        /// Get user's favourite destinations
        /// </summary>
        [HttpGet("favourites")]
        public async Task<ActionResult<IEnumerable<UserFavouriteDto>>> GetFavourites()
        {
            try
            {
                var destinations = await _service.GetUserFavouritesAsync();
                return Ok(destinations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user destinations");
                return StatusCode(500, new { error = "Failed to load destinations" });
            }
        }

        /// <summary>
        /// Add a destination to user's favourites
        /// </summary>
        [HttpPost("favourites/{destinationId}")]
        public async Task<ActionResult<UserFavouriteDto>> AddToFavourites(int destinationId)
        {
            try
            {
                var result = await _service.AddToFavouritesAsync(destinationId);
                return Ok(result);
            }
            catch (BadHttpRequestException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding destination {DestinationId} to user", destinationId);
                return StatusCode(500, new { error = "Failed to add destination to user" });
            }
        }

        /// <summary>
        /// Remove a destination from user's favourites
        /// </summary>
        [HttpDelete("favourites/{destinationId}")]
        public async Task<IActionResult> RemoveFromFavourites(int destinationId)
        {
            try
            {
                var removed = await _service.RemoveFromFavouritesAsync(destinationId);
                if (!removed)
                    return NotFound(new { error = "Destination not found or already removed" });

                return NoContent();
            }
            catch (BadHttpRequestException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing user destination {DestinationId}", destinationId);
                return StatusCode(500, new { error = "Failed to remove destination" });
            }
        }

        /// <summary>
        /// Update user-specific destination data (favorites, notes)
        /// </summary>
        [HttpPut("favourites/{userFavouriteId}")]
        public async Task<ActionResult<UserFavouriteDto>> UpdateUserFavourite(
     int userFavouriteId,
     [FromBody] UpdateUserFavouriteRequest request)
        {
            try
            {
                var result = await _service.UpdateFavouriteAsync(userFavouriteId, request);
                return Ok(result);
            }
            catch (BadHttpRequestException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user favourite destination {UserFavouriteId}", userFavouriteId);
                return StatusCode(500, new { error = "Failed to update user favourite destination" });
            }
        }

        /// <summary>
        /// Get all destinations catalog (public or admin)
        /// </summary>
        [HttpGet("catalogue")]
        public async Task<ActionResult<IEnumerable<DestinationDto>>> GetCatalogue()
        {
            try
            {
                return Ok(await _service.GetDestinationsAsync());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting destinations catalogue");
                return StatusCode(500, new { error = "Failed to load catalogue" });
            }
        }

        /// <summary>
        /// Get popular destinations
        /// </summary>
        [HttpGet("popular")]
        public async Task<ActionResult<IEnumerable<DestinationDto>>> GetPopular([FromQuery] int take = 20)
        {
            try
            {
                var result = await _service.GetPopularDestinationsAsync(take);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting popular destinations");
                return StatusCode(500, new { error = "Failed to load popular destinations" });
            }
        }

        /// <summary>
        /// Get specific destination by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<DestinationDto>> GetDestination(int id)
        {
            try
            {
                var result = await _service.GetDestinationAsync(id);
                return result == null ? NotFound() : Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting destination {DestinationId}", id);
                return StatusCode(500, new { error = "Failed to load destination" });
            }
        }

        /// <summary>
        /// Get destinations by city
        /// </summary>
        [HttpGet("by-city/{cityId}")]
        public async Task<ActionResult<IEnumerable<DestinationDto>>> GetDestinationsByCity(int cityId)
        {
            try
            {
                return Ok(await _service.GetDestinationsByCityAsync(cityId));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting destinations for city {CityId}", cityId);
                return StatusCode(500, new { error = "Failed to load destinations" });
            }
        }
        /// <summary>
        /// Admin: Update destination details
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<DestinationDto>> UpdateDestination(
            int id,
            [FromBody] AdminUpdateDestinationRequest request)
        {
            try
            {
                var result = await _service.AdminUpdateDestinationAsync(id, request);

                if (result == null)
                    return NotFound(new { error = "Destination not found" });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating destination {DestinationId}", id);
                return StatusCode(500, new { error = "Failed to update destination" });
            }
        }

        /// <summary>
        /// Admin: Delete destination
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Policy = Policies.AdminOrSuperAdmin)]
        public async Task<IActionResult> DeleteDestination(int id)
        {
            try
            {
                var deleted = await _service.AdminDeleteDestinationAsync(id);

                if (!deleted)
                {
                    return BadRequest(new
                    {
                        error = "Cannot delete destination. It may be used in routes/favourites or doesn't exist."
                    });
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting destination {DestinationId}", id);
                return StatusCode(500, new { error = "Failed to delete destination" });
            }
        }
        
        /// <summary>
        /// Filter destinations with query parameters (simple filters)
        /// </summary>
        [HttpGet("filter")]
        public async Task<ActionResult<IEnumerable<DestinationDto>>> FilterDestinations(
    [FromQuery] int? categoryId = null,
    [FromQuery] int? cityId = null,
    [FromQuery] string? subcategories = null,
    [FromQuery] float? minRating = null,
    [FromQuery] int? maxPriceLevel = null,
    [FromQuery] bool? wheelchairAccessible = null,
    [FromQuery] bool? takeout = null,
    [FromQuery] bool? delivery = null,
    [FromQuery] int take = 20)
        {
            try
            {
                var filter = new DestinationFilterRequest
                {
                    CategoryId = categoryId,
                    CityId = cityId,
                    Subcategories = !string.IsNullOrEmpty(subcategories)
                        ? subcategories.Split(',', StringSplitOptions.RemoveEmptyEntries)
                        : null,
                    MinRating = minRating,
                    MaxPriceLevel = maxPriceLevel,
                    WheelchairAccessible = wheelchairAccessible,
                    Takeout = takeout,
                    Delivery = delivery,
                    Take = take
                };

                var destinations = await _service.FilterDestinationsAsync(filter);
                return Ok(destinations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error filtering destinations");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Search destinations by query
        /// </summary>
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<DestinationDto>>> Search([FromQuery] string query)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query))
                {
                    return BadRequest(new { error = "Search query is required" });
                }

                return Ok(await _service.SearchDestinationsAsync(query));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching destinations with query: {Query}", query);
                return StatusCode(500, new { error = "Search failed" });
            }
        }
    }
}