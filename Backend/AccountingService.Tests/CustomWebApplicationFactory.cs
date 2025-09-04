using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using AccountingService.Data;
using System;
using System.Linq;

namespace AccountingService.Tests
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
                    d => d.ServiceType == typeof(DbContextOptions<AccountingDbContext>)
                         || d.ServiceType == typeof(AccountingDbContext)
                         || d.ServiceType.IsGenericType && d.ServiceType.GetGenericTypeDefinition() == typeof(DbContextOptions<>)
                         || d.ServiceType.IsSubclassOf(typeof(DbContext)))
                    .ToList();

                foreach (var descriptor in dbContextOptionsDescriptors)
                {
                    services.Remove(descriptor);
                }

                // Add AccountingDbContext using an in-memory database for testing.
                services.AddDbContext<AccountingDbContext>(options =>
                {
                    options.UseInMemoryDatabase("InMemoryAccountingDb");
                });

                // Build the service provider.
                var sp = services.BuildServiceProvider();

                // Create a scope to obtain a reference to the database contexts
                using (var scope = sp.CreateScope())
                {
                    var scopedServices = scope.ServiceProvider;
                    var db = scopedServices.GetRequiredService<AccountingDbContext>();

                    // Ensure the database is created.
                    db.Database.EnsureCreated();

                    // Seed the database with test data if necessary.
                    // db.RegisteredInvoices.Add(new RegisteredInvoice { ... });
                    // db.SaveChanges();
                }
            });
        }
    }
}
