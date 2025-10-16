using System.ComponentModel.DataAnnotations;

namespace weylo.user.api.Requests
{
    public class UpdateCategoryRequest
    {
        [StringLength(100, ErrorMessage = "Category name cannot exceed 100 characters")]
        public string Name { get; set; }

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string Description { get; set; }

        public string GoogleTypes { get; set; }
        public string Icon { get; set; }
        public string Color { get; set; }
        public int? DisplayOrder { get; set; }
        public bool? IsAutoAssignable { get; set; }
    }
}