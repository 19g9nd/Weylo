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

        public DestinationsController(IDestinationService service)
        {
            _service = service;
        }

        [HttpPost("save")]
        public async Task<ActionResult<DestinationDto>> SavePlace([FromBody] SavePlaceRequest request)
        {
            var result = await _service.SavePlaceAsync(request);
            return Ok(result);
        }

        [HttpGet("catalogue")]
        public async Task<ActionResult<IEnumerable<DestinationDto>>> GetDestinationsCatalogue()
        {
            return Ok(await _service.GetDestinationsAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DestinationDto>> GetDestination(int id)
        {
            var result = await _service.GetDestinationAsync(id);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDestination(int id)
        {
            var deleted = await _service.DeleteDestinationAsync(id);
            return deleted ? NoContent() : NotFound();
        }

        [HttpGet("by-city/{cityId}")]
        public async Task<ActionResult<IEnumerable<DestinationDto>>> GetDestinationsByCity(int cityId)
        {
            return Ok(await _service.GetDestinationsByCityAsync(cityId));
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<DestinationDto>>> Search([FromQuery] string query)
        {
            return Ok(await _service.SearchDestinationsAsync(query));
        }

        [HttpPut("{id}/cache")]
        public async Task<IActionResult> UpdateCache(int id, [FromBody] UpdateCacheRequest request)
        {
            var updated = await _service.UpdateDestinationCacheAsync(id, request);
            return updated == null ? NotFound() : NoContent();
        }
    }
}