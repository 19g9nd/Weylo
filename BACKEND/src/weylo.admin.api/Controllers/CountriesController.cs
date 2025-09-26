using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using weylo.admin.api.Data;
using weylo.admin.api.Services.Interfaces;
using weylo.shared.Models;

namespace weylo.admin.api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CountriesController : ControllerBase
    {
        private readonly AdminDbContext _context;
        private readonly IGoogleGeocodingService _geocodingService;

        public CountriesController(AdminDbContext context, IGoogleGeocodingService geocodingService)
        {
            _context = context;
            _geocodingService = geocodingService;
        }

        // GET: api/countries
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Country>>> GetCountries()
        {
            return await _context.Countries
                .OrderBy(c => c.Name)
                .ToListAsync();
        }

        // GET: api/countries/supported
        [HttpGet("supported")]
        public async Task<ActionResult<IEnumerable<object>>> GetSupportedCountries()
        {
            var countries = await _context.Countries
                .OrderBy(c => c.Name)
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.Code,
                    Bounds = new
                    {
                        South = c.SouthBound,
                        West = c.WestBound,
                        North = c.NorthBound,
                        East = c.EastBound
                    },
                    c.GooglePlaceId
                })
                .ToListAsync();

            return Ok(countries);
        }

        // GET: api/countries/codes
        [HttpGet("codes")]
        public async Task<ActionResult<IEnumerable<string>>> GetSupportedCountryCodes()
        {
            var codes = await _context.Countries
                .Select(c => c.Code)
                .ToListAsync();

            return Ok(codes);
        }

        // GET: api/countries/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Country>> GetCountry(int id)
        {
            var country = await _context.Countries.FindAsync(id);

            if (country == null)
            {
                return NotFound();
            }

            return country;
        }

        // GET: api/countries/by-code/AZ
        [HttpGet("by-code/{code}")]
        public async Task<ActionResult<Country>> GetCountryByCode(string code)
        {
            var country = await _context.Countries
                .FirstOrDefaultAsync(c => c.Code.ToUpper() == code.ToUpper());

            if (country == null)
            {
                return NotFound($"Country with code '{code}' not found or not supported");
            }

            return country;
        }

        // POST: api/countries
        [HttpPost]
        public async Task<ActionResult<Country>> CreateCountry([FromBody] CreateCountryRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                // Get country details from Google Geocoding API
                var geocodingResult = await _geocodingService.GetCountryDetailsAsync(request.CountryName);

                if (geocodingResult == null)
                {
                    return BadRequest($"Could not find country '{request.CountryName}' in Google Geocoding API");
                }

                var countryCode = geocodingResult.CountryCode;
                if (string.IsNullOrEmpty(countryCode))
                {
                    return BadRequest($"Could not determine country code for '{request.CountryName}'");
                }

                // Check if country already exists
                if (await _context.Countries.AnyAsync(c => c.Code == countryCode))
                {
                    return BadRequest($"Country with code '{countryCode}' already exists");
                }

                var country = new Country
                {
                    Name = geocodingResult.FormattedAddress,
                    Code = countryCode,
                    SouthBound = geocodingResult.SouthBound,
                    WestBound = geocodingResult.WestBound,
                    NorthBound = geocodingResult.NorthBound,
                    EastBound = geocodingResult.EastBound,
                    GooglePlaceId = geocodingResult.PlaceId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Countries.Add(country);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetCountry), new { id = country.Id }, country);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error creating country: {ex.Message}");
            }
        }

        // POST: api/countries/bulk-create
        [HttpPost("bulk-create")]
        public async Task<ActionResult<BulkCreateResult>> BulkCreateCountries([FromBody] List<string> countryNames)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var results = new List<Country>();
            var errors = new List<string>();

            foreach (var countryName in countryNames.Distinct())
            {
                try
                {
                    // Check if country might already exist by name
                    var existingCountry = await _context.Countries
                        .FirstOrDefaultAsync(c => c.Name.ToLower().Contains(countryName.ToLower()));

                    if (existingCountry != null)
                    {
                        errors.Add($"Country '{countryName}' already exists as '{existingCountry.Name}' (code: {existingCountry.Code})");
                        continue;
                    }

                    // Get country details from Google Geocoding API
                    var geocodingResult = await _geocodingService.GetCountryDetailsAsync(countryName);

                    if (geocodingResult == null)
                    {
                        errors.Add($"Could not find country '{countryName}' in Google Geocoding API");
                        continue;
                    }

                    // Extract country code
                    var countryCode = geocodingResult.CountryCode;
                    if (string.IsNullOrEmpty(countryCode))
                    {
                        errors.Add($"Could not determine country code for '{countryName}'");
                        continue;
                    }

                    // Final check by code
                    if (await _context.Countries.AnyAsync(c => c.Code == countryCode))
                    {
                        errors.Add($"Country with code '{countryCode}' already exists");
                        continue;
                    }

                    var country = new Country
                    {
                        Name = geocodingResult.FormattedAddress,
                        Code = countryCode,
                        SouthBound = geocodingResult.SouthBound,
                        WestBound = geocodingResult.WestBound,
                        NorthBound = geocodingResult.NorthBound,
                        EastBound = geocodingResult.EastBound,
                        GooglePlaceId = geocodingResult.PlaceId,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Countries.Add(country);
                    await _context.SaveChangesAsync();

                    results.Add(country);
                }
                catch (Exception ex)
                {
                    errors.Add($"Error creating country '{countryName}': {ex.Message}");
                }
            }

            return Ok(new BulkCreateResult
            {
                SuccessCount = results.Count,
                CreatedCountries = results,
                Errors = errors
            });
        }

        // PUT: api/countries/5/refresh-data
        [HttpPut("{id}/refresh-data")]
        public async Task<IActionResult> RefreshCountryData(int id)
        {
            var country = await _context.Countries.FindAsync(id);
            if (country == null)
            {
                return NotFound();
            }

            try
            {
                var geocodingResult = await _geocodingService.GetCountryDetailsAsync(country.Name);

                if (geocodingResult == null)
                {
                    return BadRequest($"Could not find country '{country.Name}' in Google Geocoding API");
                }

                // Update all data from Google
                country.Name = geocodingResult.FormattedAddress;
                country.SouthBound = geocodingResult.SouthBound;
                country.WestBound = geocodingResult.WestBound;
                country.NorthBound = geocodingResult.NorthBound;
                country.EastBound = geocodingResult.EastBound;
                country.GooglePlaceId = geocodingResult.PlaceId;

                await _context.SaveChangesAsync();

                return Ok(country);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error refreshing country data: {ex.Message}");
            }
        }

        // DELETE: api/countries/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCountry(int id)
        {
            var country = await _context.Countries.FindAsync(id);
            if (country == null)
            {
                return NotFound();
            }

            var hasCities = await _context.Cities.AnyAsync(c => c.CountryId == id);
            if (hasCities)
            {
                return BadRequest(new { message = "Cannot delete country that has cities" });
            }

            _context.Countries.Remove(country);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/countries/check-support/{countryCode}
        [HttpGet("check-support/{countryCode}")]
        public async Task<ActionResult<object>> CheckCountrySupport(string countryCode)
        {
            var isSupported = await _context.Countries
                .AnyAsync(c => c.Code.ToUpper() == countryCode.ToUpper());

            return Ok(new { CountryCode = countryCode.ToUpper(), IsSupported = isSupported });
        }


        private bool CountryExists(int id)
        {
            return _context.Countries.Any(e => e.Id == id);
        }
    }

    public class CreateCountryRequest
    {
        public string CountryName { get; set; } = string.Empty;
    }

    public class BulkCreateResult
    {
        public int SuccessCount { get; set; }
        public List<Country> CreatedCountries { get; set; } = new();
        public List<string> Errors { get; set; } = new();
    }
}