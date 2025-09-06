using System.Text;

namespace weylo.shared.Configuration
{
    public class JwtSettings
    {
        public string Key { get; set; } = string.Empty;
        public byte[] KeyInBytes => Encoding.UTF8.GetBytes(Key);
        public string Issuer { get; set; } = string.Empty;
        public string Audience { get; set; } = string.Empty;
        public int AccessTokenExpiryInMinutes { get; set; } = 15;
        public int RefreshTokenExpiryInDays { get; set; } = 7;

        public TimeSpan AccessTokenExpiry => TimeSpan.FromMinutes(AccessTokenExpiryInMinutes);
        public TimeSpan RefreshTokenExpiry => TimeSpan.FromDays(RefreshTokenExpiryInDays);
    }
}