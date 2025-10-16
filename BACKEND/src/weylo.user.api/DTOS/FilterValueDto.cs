namespace weylo.user.api.DTOS
{
    public class FilterValueDto
    {
        public int Id { get; set; }
        public string Value { get; set; } = string.Empty;
        public string AttributeName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string DataType { get; set; } = string.Empty;
    }
}