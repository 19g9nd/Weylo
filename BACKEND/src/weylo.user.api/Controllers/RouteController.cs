// using Microsoft.AspNetCore.Mvc;
// using weylo.user.api.DTOS;
// using weylo.user.api.Requests;
// using weylo.user.api.Services.Interfaces;

// namespace weylo.user.api.Controllers
// {
//     [ApiController]
//     [Route("api/[controller]")]
//     public class RouteController : ControllerBase
//     {
//         private readonly IRouteService _routeService;
//         private readonly ILogger<RouteController> _logger;

//         public RouteController(IRouteService routeService, ILogger<RouteController> logger)
//         {
//             _routeService = routeService;
//             _logger = logger;
//         }

//         /// <summary>Get all routes for the current user</summary>
//         [HttpGet]
//         public async Task<ActionResult<IEnumerable<RouteDto>>> GetUserRoutes()
//         {
//             try
//             {
//                 var routes = await _routeService.GetUserRoutesAsync();
//                 return Ok(routes);
//             }
//             catch (UnauthorizedAccessException ex)
//             {
//                 return Unauthorized(new { error = ex.Message });
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Error getting user routes");
//                 return StatusCode(500, new { error = "Internal server error" });
//             }
//         }

//         /// <summary>Get route details</summary>
//         [HttpGet("{id}")]
//         public async Task<ActionResult<RouteDetailsDto>> GetRoute(int id)
//         {
//             try
//             {
//                 var route = await _routeService.GetRouteDetailsAsync(id);
//                 return Ok(route);
//             }
//             catch (BadHttpRequestException ex)
//             {
//                 return NotFound(new { error = ex.Message });
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Error getting route {RouteId}", id);
//                 return StatusCode(500, new { error = "Internal server error" });
//             }
//         }

//         /// <summary>Create new route</summary>
//         [HttpPost]
//         public async Task<ActionResult<RouteDto>> CreateRoute([FromBody] CreateRouteRequest request)
//         {
//             try
//             {
//                 if (!ModelState.IsValid)
//                     return BadRequest(new { errors = ModelState.Values.SelectMany(v => v.Errors) });

//                 var route = await _routeService.CreateRouteAsync(request);
//                 return CreatedAtAction(nameof(GetRoute), new { id = route.Id }, route);
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Error creating route");
//                 return StatusCode(500, new { error = "Internal server error" });
//             }
//         }

//         /// <summary>Update route info</summary>
//         [HttpPut("{id}")]
//         public async Task<ActionResult<RouteDto>> UpdateRoute(int id, [FromBody] UpdateRouteRequest request)
//         {
//             try
//             {
//                 var route = await _routeService.UpdateRouteAsync(id, request);
//                 return Ok(route);
//             }
//             catch (BadHttpRequestException ex)
//             {
//                 return NotFound(new { error = ex.Message });
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Error updating route {RouteId}", id);
//                 return StatusCode(500, new { error = "Internal server error" });
//             }
//         }

//         /// <summary>Delete route</summary>
//         [HttpDelete("{id}")]
//         public async Task<IActionResult> DeleteRoute(int id)
//         {
//             try
//             {
//                 var result = await _routeService.DeleteRouteAsync(id);
//                 return result ? Ok(new { message = "Route deleted successfully" }) : NotFound(new { error = "Route not found" });
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Error deleting route {RouteId}", id);
//                 return StatusCode(500, new { error = "Internal server error" });
//             }
//         }

//         /// <summary>Add destination to route</summary>
//         [HttpPost("{routeId}/destinations")]
//         public async Task<ActionResult<RouteDestinationDto>> AddDestinationToRoute(int routeId, [FromBody] AddDestinationToRouteRequest request)
//         {
//             try
//             {
//                 var routeDestination = await _routeService.AddDestinationToRouteAsync(routeId, request);
//                 return Ok(routeDestination);
//             }
//             catch (BadHttpRequestException ex)
//             {
//                 return BadRequest(new { error = ex.Message });
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Error adding destination to route {RouteId}", routeId);
//                 return StatusCode(500, new { error = "Internal server error" });
//             }
//         }

//         /// <summary>Update a specific route destination</summary>
//         [HttpPut("destinations/{routeDestinationId}")]
//         public async Task<ActionResult<RouteDestinationDto>> UpdateRouteDestination(int routeDestinationId, [FromBody] UpdateRouteDestinationRequest request)
//         {
//             try
//             {
//                 var routeDestination = await _routeService.UpdateRouteDestinationAsync(routeDestinationId, request);
//                 return Ok(routeDestination);
//             }
//             catch (BadHttpRequestException ex)
//             {
//                 return NotFound(new { error = ex.Message });
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Error updating route destination {RouteDestinationId}", routeDestinationId);
//                 return StatusCode(500, new { error = "Internal server error" });
//             }
//         }

//         /// <summary>Reorder destinations in route</summary>
//         [HttpPut("{routeId}/destinations/reorder")]
//         public async Task<IActionResult> ReorderDestinations(int routeId, [FromBody] ReorderDestinationsRequest request)
//         {
//             try
//             {
//                 var result = await _routeService.ReorderRouteDestinationsAsync(routeId, request.DestinationOrder);
//                 return result
//                     ? Ok(new { message = "Destinations reordered successfully" })
//                     : BadRequest(new { error = "Failed to reorder destinations" });
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Error reordering destinations in route {RouteId}", routeId);
//                 return StatusCode(500, new { error = "Internal server error" });
//             }
//         }

//         /// <summary>Remove destination from route</summary>
//         [HttpDelete("{routeId}/destinations/{destinationId}")]
//         public async Task<IActionResult> RemoveDestinationFromRoute(int routeId, int destinationId)
//         {
//             try
//             {
//                 var result = await _routeService.RemoveDestinationFromRouteAsync(routeId, destinationId);
//                 return result
//                     ? Ok(new { message = "Destination removed from route successfully" })
//                     : NotFound(new { error = "Destination or route not found" });
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Error removing destination {DestinationId} from route {RouteId}", destinationId, routeId);
//                 return StatusCode(500, new { error = "Internal server error" });
//             }
//         }

//         /// <summary>Add a new day to route</summary>
//         [HttpPost("{routeId}/days")]
//         public async Task<ActionResult<RouteDayDto>> AddDayToRoute(int routeId, [FromBody] AddDayRequest request)
//         {
//             try
//             {
//                 var day = await _routeService.AddDayToRouteAsync(routeId, request);
//                 return Ok(day);
//             }
//             catch (BadHttpRequestException ex)
//             {
//                 return BadRequest(new { error = ex.Message });
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Error adding day to route {RouteId}", routeId);
//                 return StatusCode(500, new { error = "Internal server error" });
//             }
//         }

//         /// <summary>Update a route day</summary>
//         [HttpPut("days/{routeDayId}")]
//         public async Task<ActionResult<RouteDayDto>> UpdateDay(int routeDayId, [FromBody] UpdateDayRequest request)
//         {
//             try
//             {
//                 var day = await _routeService.UpdateDayAsync(routeDayId, request);
//                 return Ok(day);
//             }
//             catch (BadHttpRequestException ex)
//             {
//                 return BadRequest(new { error = ex.Message });
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Error updating route day {RouteDayId}", routeDayId);
//                 return StatusCode(500, new { error = "Internal server error" });
//             }
//         }

//         /// <summary>Move destination to another day</summary>
//         [HttpPut("destinations/{routeDestinationId}/move")]
//         public async Task<ActionResult<RouteDestinationDto>> MoveDestination(int routeDestinationId, [FromBody] MoveDestinationRequest request)
//         {
//             try
//             {
//                 var result = await _routeService.MoveDestinationToDayAsync(routeDestinationId, request);
//                 return Ok(result);
//             }
//             catch (BadHttpRequestException ex)
//             {
//                 return BadRequest(new { error = ex.Message });
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Error moving destination {RouteDestinationId}", routeDestinationId);
//                 return StatusCode(500, new { error = "Internal server error" });
//             }
//         }

//         /// <summary>Remove a day from route</summary>
//         [HttpDelete("{routeId}/days/{dayNumber}")]
//         public async Task<IActionResult> RemoveDayFromRoute(int routeId, int dayNumber)
//         {
//             try
//             {
//                 var result = await _routeService.RemoveDayFromRouteAsync(routeId, dayNumber);
//                 return result
//                     ? Ok(new { message = "Day removed successfully" })
//                     : BadRequest(new { error = "Cannot remove this day (may contain destinations or not found)" });
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Error removing day {DayNumber} from route {RouteId}", dayNumber, routeId);
//                 return StatusCode(500, new { error = "Internal server error" });
//             }
//         }
//     }
// }
