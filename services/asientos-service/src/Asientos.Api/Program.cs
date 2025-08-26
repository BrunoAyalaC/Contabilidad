using Microsoft.Extensions.Diagnostics.HealthChecks;
using Asientos.Application.Services;
using Asientos.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
// Configuración de la cadena de conexión a PostgreSQL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5433;Database=asientos_db;Username=asientos_user;Password=asientos_password";

// Health checks
builder.Services.AddHealthChecks()
    .AddNpgSql(connectionString, name: "postgresql", timeout: TimeSpan.FromSeconds(3));
// JWT Authentication
var jwtKeyAs = builder.Configuration["Jwt:Key"] ?? "CHANGEME_REPLACE_WITH_SECRET_KEY_FOR_DEV_ONLY";
var jwtKeyBytesAs = Encoding.ASCII.GetBytes(jwtKeyAs);
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
        IssuerSigningKey = new SymmetricSecurityKey(jwtKeyBytesAs),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.FromSeconds(30)
    };
});
// Configuración de HttpClient y validador de cuentas
builder.Services.AddHttpClient<ICuentaContableValidator, CuentaContableValidatorHttp>();
// Configuración de la URL base del microservicio de plan contable (ajustar en appsettings.json)
// builder.Configuration["PlanContableApi:BaseUrl"] debe estar configurado, ejemplo: http://localhost:5092

// Logging estructurado en JSON limpio y moderno
builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole(options =>
{
    options.IncludeScopes = true;
    options.TimestampFormat = "yyyy-MM-dd HH:mm:ss.fff ";
});
// Middleware para agregar RequestId y User al contexto de logging
builder.Services.AddHttpContextAccessor();


builder.Services.AddDbContext<AsientosDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Middleware para logging de RequestId y User
app.Use(async (context, next) =>
{
    var logger = context.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("RequestLogger");
    var requestId = context.TraceIdentifier;
    var user = context.User?.Identity?.Name ?? "anonymous";
    using (logger.BeginScope(new Dictionary<string, object>
    {
        ["RequestId"] = requestId,
        ["User"] = user,
        ["Path"] = context.Request.Path
    }))
    {
        await next();
    }
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}


app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Endpoint de health check
app.MapHealthChecks("/health");

app.Run();
