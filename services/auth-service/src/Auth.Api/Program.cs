using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Auth.Api.Data;
using Auth.Api.Services;
using Auth.Api.Repositories;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.DataProtection;
using System.IO;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddEnvironmentVariables();

builder.Services.AddDbContext<AuthDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddHostedService<TokenCleanupService>();

var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key not configured");
var key = Encoding.ASCII.GetBytes(jwtKey);

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
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.FromSeconds(30)
    };
});

var frontendOrigin = builder.Configuration["Frontend:DevOrigin"] ?? "http://localhost:5173";
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: "AllowLocalDev",
        policy =>
        {
            policy.WithOrigins(frontendOrigin)
                  .AllowCredentials()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Auth API", Version = "v1" });
});


builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection"), name: "postgresql");

// DataProtection: persist keys to filesystem when running in container or if path configured
var keysPath = builder.Configuration["DataProtection:KeysPath"] ?? Path.Combine(AppContext.BaseDirectory, "keys");
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(keysPath));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI();
}


try
{
    Auth.Api.Seed.DbSeeder.SeedAsync(app.Services).GetAwaiter().GetResult();
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("DbSeeder");
    logger.LogError(ex, "Error running DB seeder");
}

app.UseHttpsRedirection();
app.UseCors("AllowLocalDev");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();


app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = _ => false
});

app.MapHealthChecks("/health/ready");

app.MapHealthChecks("/health");

app.Run();
