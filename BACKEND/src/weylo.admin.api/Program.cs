
// // Register app services
// builder.Services.AddScoped<IAdminService, AdminService>();
// builder.Services.AddScoped<IDataSeeder, DataSeeder>();

// // CORS
// builder.Services.AddCors(options =>
// {
//     options.AddPolicy("AllowAll",
//         policy =>
//         {
//             policy.AllowAnyOrigin()
//                   .AllowAnyMethod()
//                   .AllowAnyHeader();
//         });
// });

// // Build app
// var app = builder.Build();

// // Database initialization + seeding
// using (var scope = app.Services.CreateScope())
// {
//     var services = scope.ServiceProvider;
//     var logger = services.GetRequiredService<ILogger<Program>>();

//     try
//     {
//         var context = services.GetRequiredService<AdminDbContext>();
//         await context.Database.CanConnectAsync();
//         logger.LogInformation("Connected to Admin database");
//         var seeder = services.GetRequiredService<IDataSeeder>();
//         await seeder.SeedAsync();
//     }
//     catch (Exception ex)
//     {
//         logger.LogError(ex, "Admin API database initialization failed.");
//         throw;
//     }
// }

// // Middleware
// app.UseSwagger();
// app.UseSwaggerUI(c =>
// {
//     c.SwaggerEndpoint("/swagger/v1/swagger.json", "Weylo Admin API v1");
//     c.RoutePrefix = "swagger";
//     c.DisplayRequestDuration();
// });

// app.UseHttpsRedirection();
// app.UseCors("AllowAll");

// app.UseAuthentication();
// app.UseAuthorization();

// app.MapControllers();

// app.Run();

using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using weylo.shared.Configuration;
using System.Reflection;
using weylo.shared.Services.Interfaces;
using weylo.shared.Services;
using weylo.shared.Data;
using weylo.admin.api.Data;
using weylo.admin.api.Services.Interfaces;
using weylo.admin.api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger + JWT
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Weylo Admin API",
        Version = "v1",
        Description = "API for Weylo administration tasks",
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
        "weylo.admin.api.xml",
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

// // Authorization policies
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

// Database (PostgreSQL)
builder.Services.AddDbContext<AdminDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("PSQL")));

// JWT config
var jwtSettingsSection = builder.Configuration.GetSection("JwtSettings");
builder.Services.Configure<JwtSettings>(jwtSettingsSection);

var jwtSettings = jwtSettingsSection.Get<JwtSettings>()
    ?? throw new InvalidOperationException("JWT settings not configured");
var key = Encoding.ASCII.GetBytes(jwtSettings.Key);
// Регистрируем JwtSettings и JwtService (как в Admin API)
builder.Services.AddSingleton(jwtSettings);
builder.Services.AddScoped<IJwtService, JwtService>();
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
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IDataSeeder, DataSeeder>();

builder.Services.AddScoped<BaseDbContext>(provider =>
    provider.GetRequiredService<AdminDbContext>());

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
    var seeder = services.GetRequiredService<IDataSeeder>();

    try
    {
        var context = services.GetRequiredService<AdminDbContext>();

        await context.Database.CanConnectAsync();
        logger.LogInformation("Successfully connected to database");
        await seeder.SeedAsync();

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
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Weylo Admin API v1");
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