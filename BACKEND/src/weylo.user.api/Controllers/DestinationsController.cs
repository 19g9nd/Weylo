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
        public async Task<ActionResult<IEnumerable<DestinationDto>>> GetMyDestinations()
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