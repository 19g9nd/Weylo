using System.ComponentModel.DataAnnotations;

namespace weylo.user.api.Requests
{
    public class CreateCategoryRequest
    {
        [Required(ErrorMessage = "Category name is required")]
        [StringLength(100, ErrorMessage = "Category name cannot exceed 100 characters")]
        public string Name { get; set; }

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string Description { get; set; }

        // Опционально: какие Google Types относятся к этой категории
        // Можно указать несколько через запятую: "restaurant,cafe,bar"
        public string GoogleTypes { get; set; }

        // Опционально: иконка или цвет для категории
        public string Icon { get; set; }
        
        public string Color { get; set; }
        
        // Для сортировки в UI
        public int? DisplayOrder { get; set; }
        
        // Можно ли автоматически назначать эту категорию местам
        public bool IsAutoAssignable { get; set; } = true;
    }
}