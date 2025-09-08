using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using weylo.shared.Configuration;
using weylo.identity.Data;
using weylo.identity.Services;
using weylo.identity.Services.Interfaces;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger + JWT
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Weylo API",
        Version = "v1",
        Description = "Identity and authentication API for Weylo"
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
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    var assembly = Assembly.GetExecutingAssembly();
    var assemblyName = assembly.GetName().Name;
    var baseDirectory = AppContext.BaseDirectory;

    Console.WriteLine($"Assembly name: {assemblyName}");
    Console.WriteLine($"Base directory: {baseDirectory}");

    var possibleXmlFiles = new[]
    {
        $"{assemblyName}.xml",
        "weylo.identity.xml",
        $"{assembly.GetName().Name}.xml"
    };

    bool xmlFound = false;

    foreach (var xmlFile in possibleXmlFiles)
    {
        var xmlPath = Path.Combine(baseDirectory, xmlFile);
        Console.WriteLine($"Checking XML file: {xmlPath}");

        if (File.Exists(xmlPath))
        {
            Console.WriteLine($"Found XML file: {xmlPath}");
            c.IncludeXmlComments(xmlPath);
            xmlFound = true;
            break;
        }
    }

    if (!xmlFound)
    {
        Console.WriteLine("XML documentation file not found. Listing files in base directory:");
        try
        {
            var files = Directory.GetFiles(baseDirectory, "*.xml");
            foreach (var file in files)
            {
                Console.WriteLine($"  XML file found: {Path.GetFileName(file)}");
                c.IncludeXmlComments(file);
                xmlFound = true;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error listing files: {ex.Message}");
        }
    }

    if (!xmlFound)
    {
        Console.WriteLine("Warning: No XML documentation files found. Make sure GenerateDocumentationFile is enabled in .csproj");
    }
    c.DescribeAllParametersInCamelCase();
});

// Database (PostgreSQL)
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("PSQL")));

// JWT config
var jwtSettingsSection = builder.Configuration.GetSection("JwtSettings");
builder.Services.Configure<JwtSettings>(jwtSettingsSection);

var jwtSettings = jwtSettingsSection.Get<JwtSettings>()
    ?? throw new InvalidOperationException("JWT settings not configured");
var key = Encoding.ASCII.GetBytes(jwtSettings.Key);
Console.WriteLine($"JWT Issuer: {jwtSettings.Issuer}");
Console.WriteLine($"JWT Audience: {jwtSettings.Audience}");
Console.WriteLine($"JWT Key: {key.Length} bytes long");
Console.WriteLine($"Access token expiry: {jwtSettings.AccessTokenExpiryInMinutes} minutes");
Console.WriteLine($"Refresh token expiry: {jwtSettings.RefreshTokenExpiryInDays} days");

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
        ClockSkew = TimeSpan.Zero
    };
});

// Register services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();

    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();

        await context.Database.CanConnectAsync();
        logger.LogInformation("Successfully connected to database");

        await context.Database.EnsureCreatedAsync();
        logger.LogInformation("Database initialized successfully");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while initializing the database");
    }
}

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Weylo API v1");
    c.RoutePrefix = "swagger";
    c.DisplayRequestDuration();
    c.EnableDeepLinking();
    c.EnableFilter();
    c.ShowExtensions();
    c.EnableValidator();
});

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();