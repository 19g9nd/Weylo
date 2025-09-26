using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using weylo.admin.api.Data;

namespace weylo.admin.api.Middleware
{
    public class CountrySupportMiddleware : IMiddleware
    {
        private readonly ILogger<CountrySupportMiddleware> _logger;

        public CountrySupportMiddleware(ILogger<CountrySupportMiddleware> logger)
        {
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, RequestDelegate next)
        {
            var dbContext = context.RequestServices.GetRequiredService<AdminDbContext>();

            if (ShouldCheckCountrySupport(context.Request.Path))
            {
                var countryCode = ExtractCountryCode(context);

                if (!string.IsNullOrEmpty(countryCode))
                {
                    var isSupported = await IsCountrySupportedAsync(dbContext, countryCode);

                    if (!isSupported)
                    {
                        await WriteUnsupportedCountryResponse(context, countryCode);
                        return;
                    }
                }
            }

            await next(context);
        }

        private static bool ShouldCheckCountrySupport(PathString path)
        {
            var pathValue = path.Value?.ToLowerInvariant();

            return pathValue != null && (
                pathValue.Contains("/cities") ||
                pathValue.Contains("/destinations") ||
                pathValue.Contains("/routes") ||
                pathValue.Contains("/search")
            );
        }

        private static string? ExtractCountryCode(HttpContext context)
        {
            if (context.Request.Query.ContainsKey("countryCode"))
            {
                return context.Request.Query["countryCode"].ToString().ToUpper();
            }

            if (context.Request.RouteValues.ContainsKey("countryCode"))
            {
                return context.Request.RouteValues["countryCode"]?.ToString()?.ToUpper();
            }

            if (context.Request.Headers.ContainsKey("X-Country-Code"))
            {
                return context.Request.Headers["X-Country-Code"].ToString().ToUpper();
            }

            return null;
        }

        private static async Task<bool> IsCountrySupportedAsync(AdminDbContext dbContext, string countryCode)
        {
            return await dbContext.Countries
                .AnyAsync(c => c.Code.ToUpper() == countryCode.ToUpper());
        }

        private static async Task WriteUnsupportedCountryResponse(HttpContext context, string countryCode)
        {
            context.Response.StatusCode = 400;
            context.Response.ContentType = "application/json";

            var response = new
            {
                error = "unsupported_country",
                message = $"Country '{countryCode}' is not supported by this service",
                countryCode = countryCode,
                supportedCountries = "/api/countries/codes"
            };

            var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(jsonResponse);
        }
    }

    public static class CountrySupportMiddlewareExtensions
    {
        public static IApplicationBuilder UseCountrySupport(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<CountrySupportMiddleware>();
        }
    }
}
