namespace weylo.user.api.DTOS
{
    public class CategoryFilterDto
    {
        public int CategoryId { get; set; }
        public int FilterAttributeId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string AttributeName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string DataType { get; set; } = string.Empty;
    }
}