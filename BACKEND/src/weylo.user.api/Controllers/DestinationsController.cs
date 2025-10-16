using Microsoft.AspNetCore.Mvc;
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
        /// Get user's saved destinations
        /// </summary>
        [HttpGet("my")]
        public async Task<ActionResult<IEnumerable<UserDestinationDto>>> GetMyDestinations()
        {
            try
            {
                var destinations = await _service.GetUserDestinationsAsync();
                return Ok(destinations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user destinations");
                return StatusCode(500, new { error = "Failed to load destinations" });
            }
        }

        /// <summary>
        /// Add a destination to user's collection
        /// </summary>
        [HttpPost("my/{destinationId}")]
        public async Task<ActionResult<UserDestinationDto>> AddToUser(int destinationId)
        {
            try
            {
                var result = await _service.AddDestinationToUserAsync(destinationId);
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
        /// Remove a destination from user's collection
        /// </summary>
        [HttpDelete("my/{destinationId}")]
        public async Task<IActionResult> RemoveFromUser(int destinationId)
        {
            try
            {
                var removed = await _service.RemoveDestinationFromUserAsync(destinationId);
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
        [HttpPut("my/{userDestinationId}")]
        public async Task<ActionResult<UserDestinationDto>> UpdateUserDestination(
            int userDestinationId,
            [FromBody] UpdateUserDestinationRequest request)
        {
            try
            {
                var result = await _service.UpdateUserDestinationAsync(userDestinationId, request);
                return Ok(result);
            }
            catch (BadHttpRequestException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user destination {UserDestinationId}", userDestinationId);
                return StatusCode(500, new { error = "Failed to update user destination" });
            }
        }

        /// <summary>
        /// Toggle favorite status for a user's destination
        /// </summary>
        [HttpPut("my/{userDestinationId}/favorite")]
        public async Task<ActionResult<UserDestinationDto>> ToggleFavorite(int userDestinationId)
        {
            try
            {
                var result = await _service.ToggleFavoriteAsync(userDestinationId);
                return Ok(result);
            }
            catch (BadHttpRequestException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling favorite for destination {UserDestinationId}", userDestinationId);
                return StatusCode(500, new { error = "Failed to toggle favorite" });
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
        /// Delete destination (only if not used in routes)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDestination(int id)
        {
            try
            {
                var deleted = await _service.DeleteDestinationAsync(id);
                if (!deleted)
                {
                    return BadRequest(new
                    {
                        error = "Cannot delete destination. It may be used in routes or doesn't exist."
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

        /// <summary>
        /// Update cached information for a destination
        /// </summary>
        [HttpPut("{id}/cache")]
        public async Task<IActionResult> UpdateCache(int id, [FromBody] UpdateCacheRequest request)
        {
            try
            {
                var updated = await _service.UpdateDestinationCacheAsync(id, request);
                return updated == null ? NotFound() : NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating cache for destination {DestinationId}", id);
                return StatusCode(500, new { error = "Failed to update cache" });
            }
        }
    }
}