using Microsoft.AspNetCore.Mvc;
using weylo.user.api.DTOS;
using weylo.user.api.Requests;
using weylo.user.api.Services.Interfaces;

namespace weylo.user.api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RouteController : ControllerBase
    {
        private readonly IRouteService _routeService;
        private readonly ILogger<RouteController> _logger;

        public RouteController(IRouteService routeService, ILogger<RouteController> logger)
        {
            _routeService = routeService;
            _logger = logger;
        }

        /// <summary>
        /// Get all routes for the current user
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RouteDto>>> GetUserRoutes()
        {
            try
            {
                var routes = await _routeService.GetUserRoutesAsync();
                return Ok(routes);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user routes");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Get route details
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<RouteDetailsDto>> GetRoute(int id)
        {
            try
            {
                var route = await _routeService.GetRouteDetailsAsync(id);
                return Ok(route);
            }
            catch (BadHttpRequestException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting route {RouteId}", id);
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Create new route
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<RouteDto>> CreateRoute([FromBody] CreateRouteRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors) });
                }

                var route = await _routeService.CreateRouteAsync(request);

                return CreatedAtAction(
                    nameof(GetRoute),
                    new { id = route.Id },
                    new { data = route }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating route");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Update existing route
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<RouteDto>> UpdateRoute(int id, [FromBody] UpdateRouteRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors) });
                }

                var route = await _routeService.UpdateRouteAsync(id, request);
                return Ok(route);
            }
            catch (BadHttpRequestException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating route {RouteId}", id);
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Delete route
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRoute(int id)
        {
            try
            {
                var result = await _routeService.DeleteRouteAsync(id);

                if (result)
                {
                    return Ok(new { message = "Route deleted successfully" });
                }
                else
                {
                    return NotFound(new { error = "Route not found" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting route {RouteId}", id);
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Add destination to route
        /// </summary>
        [HttpPost("{routeId}/destinations")]
        public async Task<ActionResult<RouteDestinationDto>> AddDestinationToRoute(
            int routeId,
            [FromBody] AddDestinationToRouteRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors) });
                }

                var routeDestination = await _routeService.AddDestinationToRouteAsync(routeId, request);
                return Ok(routeDestination);
            }
            catch (BadHttpRequestException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding destination to route {RouteId}", routeId);
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Remove destination from route
        /// </summary>
        [HttpDelete("{routeId}/destinations/{destinationId}")]
        public async Task<IActionResult> RemoveDestinationFromRoute(int routeId, int destinationId)
        {
            try
            {
                var result = await _routeService.RemoveDestinationFromRouteAsync(routeId, destinationId);

                if (result)
                {
                    return Ok(new { message = "Destination removed from route successfully" });
                }
                else
                {
                    return NotFound(new { error = "Destination or route not found" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing destination {DestinationId} from route {RouteId}", destinationId, routeId);
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Update route destination
        /// </summary>
        [HttpPut("destinations/{routeDestinationId}")]
        public async Task<ActionResult<RouteDestinationDto>> UpdateRouteDestination(
            int routeDestinationId,
            [FromBody] UpdateRouteDestinationRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors) });
                }

                var routeDestination = await _routeService.UpdateRouteDestinationAsync(routeDestinationId, request);
                return Ok(routeDestination);
            }
            catch (BadHttpRequestException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating route destination {RouteDestinationId}", routeDestinationId);
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Reorder destinations in a route
        /// </summary>
        [HttpPut("{routeId}/destinations/reorder")]
        public async Task<IActionResult> ReorderDestinations(
            int routeId,
            [FromBody] ReorderDestinationsRequest request)
        {
            try
            {
                var result = await _routeService.ReorderRouteDestinationsAsync(routeId, request.DestinationOrder);

                if (result)
                {
                    return Ok(new { message = "Destinations reordered successfully" });
                }
                else
                {
                    return BadRequest(new { error = "Failed to reorder destinations" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reordering destinations in route {RouteId}", routeId);
                return StatusCode(500, new { error = "Internal server error" });
            }
        }
    }
}