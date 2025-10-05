using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using weylo.admin.api.Data;
using weylo.shared.Models;

namespace weylo.admin.api.Controllers
{
    [Route("api/admin/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly AdminDbContext _context;

        public CategoriesController(AdminDbContext context)
        {
            _context = context;
        }

        // GET: api/admin/categories
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
        {
            return await _context.Categories
                .OrderBy(c => c.Name)
                .ToListAsync();
        }

        // GET: api/admin/categories/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Category>> GetCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);

            if (category == null)
            {
                return NotFound();
            }

            return category;
        }

        // POST: api/admin/categories
        [HttpPost]
        public async Task<ActionResult<Category>> PostCategory(CategoryDto categoryDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            bool categoryExists = await _context.Categories
                .AnyAsync(c => c.Name.ToLower() == categoryDto.Name.Trim().ToLower());

            if (categoryExists)
            {
                return BadRequest("A category with this name already exists.");
            }

            var category = new Category
            {
                Name = categoryDto.Name.Trim(),
                Description = categoryDto.Description,
                Icon = categoryDto.Icon,
                GoogleTypes = categoryDto.GoogleTypes
            };

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
        }

        // PUT: api/admin/categories/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCategory(int id, CategoryDto categoryDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound();
            }

            bool nameTaken = await _context.Categories
                .AnyAsync(c => c.Id != id && c.Name.ToLower() == categoryDto.Name.Trim().ToLower());

            if (nameTaken)
            {
                return BadRequest("A category with this name already exists.");
            }

            category.Name = categoryDto.Name.Trim();
            category.Description = categoryDto.Description;
            category.Icon = categoryDto.Icon;
            category.GoogleTypes = categoryDto.GoogleTypes;
            _context.Entry(category).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CategoryExists(id))
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

        // DELETE: api/admin/categories/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound();
            }

            var hasDestinations = await _context.Destinations
                .AnyAsync(d => d.CategoryId == id);

            if (hasDestinations)
            {
                return BadRequest("Cannot delete category that is used by destinations.");
            }

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool CategoryExists(int id)
        {
            return _context.Categories.Any(e => e.Id == id);
        }
    }

    public class CategoryDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Icon { get; set; }
        public string? GoogleTypes { get; set; }
    }
}