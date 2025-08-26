using Auth.Api.Models;
using Auth.Api.Repositories;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Threading.Tasks;

namespace Auth.Api.Seed;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var provider = scope.ServiceProvider;

        var repo = provider.GetRequiredService<IUserRepository>();
        var dbContext = provider.GetRequiredService<Auth.Api.Data.AuthDbContext>();

        // Ensure DB created (simple MVP approach)
        await dbContext.Database.EnsureCreatedAsync();

        // Seed default admin user
        var existing = await repo.GetByUsernameAsync("admin");
        if (existing == null)
        {
            var hash = BCrypt.Net.BCrypt.HashPassword("P@ssw0rd!");
            var user = new User { Id = Guid.NewGuid(), Username = "admin", PasswordHash = hash, Roles = "Admin" };
            await repo.CreateAsync(user);
            await repo.SaveChangesAsync();
        }
    }
}
