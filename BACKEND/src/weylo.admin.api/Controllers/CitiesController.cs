using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using weylo.admin.api.Data;
using weylo.shared.Models;

namespace weylo.admin.api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CitiesController : ControllerBase
    {
        private readonly AdminDbContext _context;

        public CitiesController(AdminDbContext context)
        {
            _context = context;
        }

        // GET: api/admin/cities
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetCities()
        {
            var cities = await _context.Cities
                .Include(c => c.Country)
                .OrderBy(c => c.Country.Name)
                .ThenBy(c => c.Name)
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.Latitude,
                    c.Longitude,
                    c.CountryId,
                    CountryName = c.Country.Name,
                    CountryCode = c.Country.Code
                })
                .ToListAsync();

            return Ok(cities);
        }

        // GET: api/admin/cities/5
        [HttpGet("{id}")]
        public async Task<ActionResult<City>> GetCity(int id)
        {
            var city = await _context.Cities
                .Include(c => c.Country)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (city == null)
            {
                return NotFound();
            }

            return city;
        }

        // POST: api/admin/cities
        [HttpPost]
        public async Task<ActionResult<City>> PostCity(City city)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (!await _context.Countries.AnyAsync(c => c.Id == city.CountryId))
            {
                return BadRequest("Country not found");
            }

            _context.Cities.Add(city);
            await _context.SaveChangesAsync();

            var createdCity = await _context.Cities
                .Include(c => c.Country)
                .FirstOrDefaultAsync(c => c.Id == city.Id);

            return CreatedAtAction(nameof(GetCity), new { id = city.Id }, createdCity);
        }

        // PUT: api/admin/cities/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCity(int id, City city)
        {
            if (id != city.Id)
            {
                return BadRequest("ID mismatch");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (!await _context.Countries.AnyAsync(c => c.Id == city.CountryId))
            {
                return BadRequest("Country not found");
            }

            _context.Entry(city).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CityExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/admin/cities/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCity(int id)
        {
            var city = await _context.Cities.FindAsync(id);
            if (city == null)
            {
                return NotFound();
            }

            var hasDestinations = await _context.Destinations.AnyAsync(d => d.CityId == id);
            if (hasDestinations)
            {
                return BadRequest("Cannot delete city that has destinations");
            }

            _context.Cities.Remove(city);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool CityExists(int id)
        {
            return _context.Cities.Any(e => e.Id == id);
        }
    }
}