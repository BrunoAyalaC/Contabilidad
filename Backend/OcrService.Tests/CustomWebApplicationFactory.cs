using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OcrService.Data;
using System;
using System.Linq;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace OcrService.Tests
{
    public class CustomWebApplicationFactory<TProgram> : WebApplicationFactory<TProgram> where TProgram : class
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing"); // Set environment to Testing

            // Add JwtSettings for testing directly to the WebHostBuilder's configuration
            builder.ConfigureAppConfiguration((context, conf) =>
            {
                conf.AddInMemoryCollection(new Dictionary<string, string>
                {
                    {"JwtSettings:SecretKey", "YourSuperSecretKeyThatIsAtLeast32CharactersLong"},
                    {"JwtSettings:Issuer", "AuthService"},
                    {"JwtSettings:Audience", "AuthServiceClients"}
                });
            });

            builder.ConfigureServices(services =>
            {
                // Remove all DbContextOptions and DbContext registrations
                var dbContextOptionsDescriptors = services.Where(
                    d => d.ServiceType == typeof(DbContextOptions<OcrDbContext>)
                         || d.ServiceType == typeof(OcrDbContext)
                         || d.ServiceType.IsGenericType && d.ServiceType.GetGenericTypeDefinition() == typeof(DbContextOptions<>)
                         || d.ServiceType.IsSubclassOf(typeof(DbContext)))
                    .ToList();

                foreach (var descriptor in dbContextOptionsDescriptors)
                {
                    services.Remove(descriptor);
                }

                // Add OcrDbContext using an in-memory database for testing.
                services.AddDbContext<OcrDbContext>(options =>
                {
                    options.UseInMemoryDatabase("InMemoryOcrDb");
                });

                // Configure a dummy authentication scheme for testing
                services.AddAuthentication(defaultScheme: "TestAuth")
                    .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>("TestAuth", options => { });

                // Replace the default IAuthenticationService with a mock one
                services.AddTransient<IAuthenticationService, TestAuthenticationService>();

                // Build the service provider.
                var sp = services.BuildServiceProvider();

                // Create a scope to obtain a reference to the database contexts
                using (var scope = sp.CreateScope())
                {
                    var scopedServices = scope.ServiceProvider;
                    var db = scopedServices.GetRequiredService<OcrDbContext>();

                    // Ensure the database is created.
                    db.Database.EnsureCreated();

                    // Seed the database with test data if necessary.
                    // db.OcrJobs.Add(new OcrJob { ... });
                    // db.SaveChanges();
                }
            });
        }
    }

    public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
    {
        public TestAuthHandler(IOptionsMonitor<AuthenticationSchemeOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder,
            ISystemClock clock) : base(options, logger, encoder, clock)
        {
        }

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var claims = new[] { new Claim(ClaimTypes.Name, "TestUser"), new Claim(ClaimTypes.NameIdentifier, "1") };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, "TestAuth");

            var result = AuthenticateResult.Success(ticket);

            return Task.FromResult(result);
        }
    }

    public class TestAuthenticationService : IAuthenticationService
    {
        public Task<AuthenticateResult> AuthenticateAsync(HttpContext context, string scheme)
        {
            var claims = new[] { new Claim(ClaimTypes.Name, "TestUser"), new Claim(ClaimTypes.NameIdentifier, "1") };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, "TestAuth");

            return Task.FromResult(AuthenticateResult.Success(ticket));
        }

        public Task ChallengeAsync(HttpContext context, string scheme, AuthenticationProperties properties)
        {
            context.Response.StatusCode = 401;
            return Task.CompletedTask;
        }

        public Task ForbidAsync(HttpContext context, string scheme, AuthenticationProperties properties)
        {
            context.Response.StatusCode = 403;
            return Task.CompletedTask;
        }

        public Task SignInAsync(HttpContext context, string scheme, ClaimsPrincipal principal, AuthenticationProperties properties)
        {
            return Task.CompletedTask;
        }

        public Task SignOutAsync(HttpContext context, string scheme, AuthenticationProperties properties)
        {
            return Task.CompletedTask;
        }
    }
}
