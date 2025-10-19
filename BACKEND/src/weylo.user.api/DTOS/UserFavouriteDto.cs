namespace weylo.user.api.DTOS
{
    public class UserFavouriteDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int DestinationId { get; set; }
        public DateTime SavedAt { get; set; }
        public string? PersonalNotes { get; set; }

        // Full destination info
        public DestinationDto Destination { get; set; } = null!;
    }
}