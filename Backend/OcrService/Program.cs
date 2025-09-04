using OcrService.Models;
using OcrService.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Polly;
using Polly.Extensions.Http;
using System.Net.Http;

namespace OcrService
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllers();
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            // OcrDbContext configuration removed as per refactoring.

            // Configure JWT Authentication
            var jwtSettings = builder.Configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"] ?? string.Empty;

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings["Issuer"],
                    ValidAudience = jwtSettings["Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
                };
            });

            builder.Services.AddAuthorization();

            // Add CORS policy for development to allow the frontend dev server
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAllDev", policy =>
                {
                    policy.AllowAnyOrigin()
                          .AllowAnyHeader()
                          .AllowAnyMethod();
                });
            });

            // Configure temporary directory for file uploads
            var tempUploadPath = Path.Combine(builder.Environment.ContentRootPath, "Uploads");
            if (!Directory.Exists(tempUploadPath))
            {
                Directory.CreateDirectory(tempUploadPath);
            }
            builder.Services.AddSingleton(tempUploadPath); // Register as singleton

            // Configure directory to persist pending imports in case Accounting is unreachable
            var pendingDir = Path.Combine(builder.Environment.ContentRootPath, "PendingImports");
            if (!Directory.Exists(pendingDir))
            {
                Directory.CreateDirectory(pendingDir);
            }
            builder.Services.AddSingleton(pendingDir);

            // Configure EF Core DbContext for pending imports (use ConnectionStrings:DefaultConnection or localdb fallback)
            var defaultConn = builder.Configuration.GetConnectionString("DefaultConnection") ??
                              "Server=(localdb)\\mssqllocaldb;Database=OcrService_Db;Trusted_Connection=True;MultipleActiveResultSets=True;";
            builder.Services.AddDbContext<OcrService.Data.OcrDbContext>(options =>
                options.UseSqlServer(defaultConn));

            // Configure HttpClient for Accounting service; base address can be overridden via configuration
            // Default to the typical local Accounting service port used in this workspace (5002).
            // Honor configuration when provided (appsettings or environment variables).
            var accountingBase = builder.Configuration.GetValue<string>("AccountingService:BaseUrl") ?? "http://localhost:5002";
            // Polly: retry and circuit-breaker policies
            var retryPolicy = HttpPolicyExtensions
                .HandleTransientHttpError()
                .OrResult(msg => (int)msg.StatusCode == 429)
                .WaitAndRetryAsync(new[] { TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(3), TimeSpan.FromSeconds(7) });

            var circuitBreaker = HttpPolicyExtensions
                .HandleTransientHttpError()
                .CircuitBreakerAsync(3, TimeSpan.FromSeconds(30));

            builder.Services.AddHttpClient("Accounting", client =>
            {
                client.BaseAddress = new Uri(accountingBase);
                client.Timeout = TimeSpan.FromSeconds(30);
            })
            .AddPolicyHandler(retryPolicy)
            .AddPolicyHandler(circuitBreaker);

            // Register background worker that will retry pending imports
            builder.Services.AddHostedService<Services.PendingImportWorker>();

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            // Ensure routing and CORS middleware are registered in correct order
            app.UseRouting();

            // In dev allow all to avoid preflight issues from the frontend dev server.
            app.UseCors("AllowAllDev");

            app.UseHttpsRedirection();

            if (!app.Environment.IsEnvironment("Testing"))
            {
                app.UseAuthentication();
                app.UseAuthorization();
            }

            app.MapControllers();

            app.Run();
        }
    }
}