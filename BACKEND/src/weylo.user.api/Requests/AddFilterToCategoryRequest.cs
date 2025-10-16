namespace weylo.user.api.Requests
{
    public class AddFilterToCategoryRequest
    {
        public int CategoryId { get; set; }
        public int FilterAttributeId { get; set; }
    }
}