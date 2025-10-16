namespace weylo.user.api.DTOS
{
    public class UserDestinationDto
    {
        public int Id { get; set; }
        public DateTime SavedAt { get; set; }
        public bool IsFavorite { get; set; }
        public string? PersonalNotes { get; set; }
        public int UsageCount { get; set; }
        public DestinationDto Destination { get; set; } = null!;
    }
}