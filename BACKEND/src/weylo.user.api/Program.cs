using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using weylo.shared.Configuration;
using weylo.shared.Services.Interfaces;
using weylo.shared.Services;
using weylo.user.api.Data;
using weylo.user.api.Services.Interfaces;
using weylo.user.api.Services;
using weylo.user.api.Mappings;
using System.Reflection;
using System.Security.Claims;
using weylo.user.api.Mappings.Interfaces;
using weylo.shared.Converters;
using weylo.shared.Converters.weylo.shared.Converters;
using Microsoft.AspNetCore.Authentication;

var builder = WebApplication.CreateBuilder(args);

// --- Controllers + Swagger ---
builder.Services.AddControllers();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Add both converters
        options.JsonSerializerOptions.Converters.Add(new TimeOnlyJsonConverter());
        options.JsonSerializerOptions.Converters.Add(new NullableTimeOnlyJsonConverter());

        // CRITICAL: Make JSON case-insensitive
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;

        // Don't serialize null values
        options.JsonSerializerOptions.DefaultIgnoreCondition =
            System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Weylo User API",
        Version = "v1",
        Description = "User profile API for Weylo"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });

    var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFilename);
    if (File.Exists(xmlPath))
        c.IncludeXmlComments(xmlPath);

    c.DescribeAllParametersInCamelCase();
});

// --- Database ---
builder.Services.AddDbContext<UserDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("PSQL")));

// --- JWT ---
var jwtSection = builder.Configuration.GetSection("JwtSettings");
builder.Services.Configure<JwtSettings>(jwtSection);
var jwtSettings = jwtSection.Get<JwtSettings>()
    ?? throw new InvalidOperationException("JWT settings not configured");
var key = Encoding.ASCII.GetBytes(jwtSettings.Key);

builder.Services.AddSingleton(jwtSettings);
builder.Services.AddScoped<IJwtService, JwtService>();

builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = Environment.GetEnvironmentVariable("ConnectionStrings__RedisDb");
    options.InstanceName = "WeatherCache_";
});

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidateAudience = true,
        ValidAudience = jwtSettings.Audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero,
        NameClaimType = ClaimTypes.Name,
        RoleClaimType = ClaimTypes.Role
    };

    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogWarning("Authentication failed: {Error}", context.Exception.Message);

            if (context.HttpContext.Request.Path.StartsWithSegments("/swagger"))
                return Task.CompletedTask;

            context.Response.StatusCode = 401;
            context.Response.ContentType = "application/json";

            var errorMessage = context.Exception switch
            {
                SecurityTokenExpiredException => "Token has expired",
                SecurityTokenNotYetValidException => "Token is not yet valid",
                SecurityTokenInvalidSignatureException => "Invalid token signature",
                SecurityTokenInvalidIssuerException => "Invalid token issuer",
                SecurityTokenInvalidAudienceException => "Invalid token audience",
                _ => "Invalid authentication token"
            };

            var response = new
            {
                error = "Authentication failed",
                message = errorMessage,
                details = "Please log in again"
            };

            return context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(response));
        },

        OnChallenge = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogWarning("JWT challenge: {Error}", context.ErrorDescription);

            if (context.HttpContext.Request.Path.StartsWithSegments("/swagger"))
                return Task.CompletedTask;

            context.HandleResponse();

            context.Response.StatusCode = 401;
            context.Response.ContentType = "application/json";

            var response = new
            {
                error = "User not authenticated",
                message = "Please log in to access this resource",
                path = context.HttpContext.Request.Path
            };

            return context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(response));
        }
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("Admin"));

    options.AddPolicy("SuperAdminOnly", policy =>
        policy.RequireRole("SuperAdmin"));

    options.AddPolicy("AdminOrSuperAdmin", policy =>
        policy.RequireAssertion(context =>
            context.User.IsInRole("Admin") || context.User.IsInRole("SuperAdmin")));
});
// --- App services ---
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IDestinationService, DestinationService>();
builder.Services.AddScoped<IRouteService, RouteService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IGooglePlacesCategoryMapper, GooglePlacesCategoryMapper>();
builder.Services.AddScoped<DatabaseInitializer>();
builder.Services.AddHttpContextAccessor();

// --- AutoMapper ---
builder.Services.AddAutoMapper(cfg => cfg.AddProfile<MappingProfile>());

// --- CORS ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});
var app = builder.Build();

// --- Database init & default categories (scoped, как в Admin API) ---
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<DatabaseInitializer>>(); // ✅ логгер нужного типа
    var context = services.GetRequiredService<UserDbContext>();
    var initializer = new DatabaseInitializer(context, logger);

    await initializer.InitializeAsync();
}

// --- Middleware ---
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Weylo User API v1");
    c.RoutePrefix = "swagger";
    c.DisplayRequestDuration();
});
app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();