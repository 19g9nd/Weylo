namespace weylo.user.api.Services.Interfaces
{
    public interface ICurrentUserService
    {
        int UserId { get; }
        string? Username { get; }
        string? Email { get; }
        string? Role { get; }
        bool IsAuthenticated { get; }
    }
}