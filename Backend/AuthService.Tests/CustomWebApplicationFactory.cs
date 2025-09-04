using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using AuthService.Data;
using System;
using System.Linq;

namespace AuthService.Tests
{
    public class CustomWebApplicationFactory<TProgram> : WebApplicationFactory<TProgram> where TProgram : class
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing"); // Set environment to Testing

            builder.ConfigureServices(services =>
            {
                // Remove all DbContextOptions and DbContext registrations
                var dbContextOptionsDescriptors = services.Where(
                    d => d.ServiceType == typeof(DbContextOptions<AuthDbContext>)
                         || d.ServiceType == typeof(AuthDbContext)
                         || d.ServiceType.IsGenericType && d.ServiceType.GetGenericTypeDefinition() == typeof(DbContextOptions<>)
                         || d.ServiceType.IsSubclassOf(typeof(DbContext)))
                    .ToList();

                foreach (var descriptor in dbContextOptionsDescriptors)
                {
                    services.Remove(descriptor);
                }

                // Add AuthDbContext using an in-memory database for testing.
                services.AddDbContext<AuthDbContext>(options =>
                {
                    options.UseInMemoryDatabase("InMemoryAuthDb");
                });

                // Build the service provider.
                var sp = services.BuildServiceProvider();

                // Create a scope to obtain a reference to the database contexts
                using (var scope = sp.CreateScope())
                {
                    var scopedServices = scope.ServiceProvider;
                    var db = scopedServices.GetRequiredService<AuthDbContext>();

                    // Ensure the database is created.
                    db.Database.EnsureCreated();

                    // Seed the database with test data if necessary.
                    // db.Users.Add(new User { Id = Guid.NewGuid(), Username = "seeduser", PasswordHash = "hashedpassword" });
                    // db.SaveChanges();
                }
            });
        }
    }
}
