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

        /// <summary>Get all routes for the current user</summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RouteDto>>> GetUserRoutes()
        {
            try
            {
                var routes = await _routeService.GetUserRoutesAsync();
                return Ok(routes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user routes");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>Get route details</summary>
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

        /// <summary>Create new route</summary>
        [HttpPost]
        public async Task<ActionResult<RouteDto>> CreateRoute([FromBody] CreateRouteRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors) });

                var route = await _routeService.CreateRouteAsync(request);
                return CreatedAtAction(nameof(GetRoute), new { id = route.Id }, route);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating route");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>Update route info</summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<RouteDto>> UpdateRoute(int id, [FromBody] UpdateRouteRequest request)
        {
            try
            {
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

        /// <summary>Delete route</summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRoute(int id)
        {
            try
            {
                var result = await _routeService.DeleteRouteAsync(id);
                return result ? Ok(new { message = "Route deleted successfully" }) : NotFound(new { error = "Route not found" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting route {RouteId}", id);
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>Add destination to route</summary>
        [HttpPost("{routeId}/items")]
        public async Task<ActionResult<RouteItemDto>> AddDestinationToRoute(int routeId, [FromBody] AddDestinationToRouteRequest request)
        {
            try
            {
                var routeItem = await _routeService.AddDestinationToRouteAsync(routeId, request);
                return Ok(routeItem);
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

        /// <summary>Update a specific route item</summary>
        [HttpPut("items/{routeItemId}")]
        public async Task<ActionResult<RouteItemDto>> UpdateRouteItem(int routeItemId, [FromBody] UpdateRouteItemRequest request)
        {
            try
            {
                var routeItem = await _routeService.UpdateRouteItemAsync(routeItemId, request);
                return Ok(routeItem);
            }
            catch (BadHttpRequestException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating route item {RouteItemId}", routeItemId);
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>Reorder destinations in route</summary>
        [HttpPut("{routeId}/items/reorder")]
        public async Task<IActionResult> ReorderDestinations(int routeId, [FromBody] ReorderDestinationsRequest request)
        {
            try
            {
                var result = await _routeService.ReorderRouteDestinationsAsync(
                    routeId,
                    request.DayNumber,
                    request.DestinationOrder);

                return result
                    ? Ok(new { message = "Destinations reordered successfully" })
                    : BadRequest(new { error = "Failed to reorder destinations" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reordering destinations in route {RouteId}", routeId);
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>Remove destination from route</summary>
        [HttpDelete("{routeId}/items/{routeItemId}")]
        public async Task<IActionResult> RemoveDestinationFromRoute(int routeId, int routeItemId)
        {
            try
            {
                var result = await _routeService.RemoveDestinationFromRouteAsync(routeId, routeItemId);
                return result
                    ? Ok(new { message = "Destination removed from route successfully" })
                    : NotFound(new { error = "Route item not found" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing route item {RouteItemId} from route {RouteId}", routeItemId, routeId);
                return StatusCode(500, new { error = "Internal server error" });
            }
        }
    }
}