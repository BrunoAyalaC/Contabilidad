using Xunit;
using AuthService.Controllers;
using AuthService.Data;
using AuthService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Net;

namespace AuthService.Tests
{
    public class AuthControllerTests
    {
        private AuthDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AuthDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new AuthDbContext(options);
        }

        private IConfiguration GetConfiguration()
        {
            var inMemorySettings = new Dictionary<string, string> {
                {"JwtSettings:SecretKey", "supersecretkeythatisatleast32characterslong"},
                {"JwtSettings:Issuer", "AuthService"},
                {"JwtSettings:Audience", "AuthServiceClients"}
            };

            IConfiguration configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();
            return configuration;
        }

        private AuthController CreateAuthController(AuthDbContext context, IConfiguration configuration)
        {
            var controller = new AuthController(context, configuration);
            // Mock HttpContext for unit tests
            var httpContext = new DefaultHttpContext();
            httpContext.Connection.RemoteIpAddress = IPAddress.Parse("127.0.0.1");
            httpContext.Request.Headers["User-Agent"] = "UnitTest";
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
            return controller;
        }

        [Fact]
        public async Task Register_ShouldCreateNewUser()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var configuration = GetConfiguration();
            var controller = CreateAuthController(context, configuration);
            var request = new RegisterRequest { Username = "testuser", Email = "test@example.com", Password = "Password123!" };

            // Act
            var result = await controller.Register(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
            Assert.Equal("User registered successfully.", (okResult.Value as dynamic).message);
            Assert.True(await context.Users.AnyAsync(u => u.Username == "testuser"));
        }

        [Fact]
        public async Task Register_ShouldReturnBadRequest_WhenUsernameExists()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var configuration = GetConfiguration();
            var controller = CreateAuthController(context, configuration);
            var existingUser = new User { Username = "existinguser", Email = "existing@example.com", PasswordHash = controller.HashPassword("Password123!") };
            context.Users.Add(existingUser);
            await context.SaveChangesAsync();

            var request = new RegisterRequest { Username = "existinguser", Email = "new@example.com", Password = "Password123!" };

            // Act
            var result = await controller.Register(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequestResult.Value);
            Assert.Equal("USERNAME_TAKEN", (badRequestResult.Value as dynamic).code);
        }

        [Fact]
        public async Task Login_ShouldReturnTokens_ForValidCredentials()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var configuration = GetConfiguration();
            var controller = CreateAuthController(context, configuration);
            var password = "Password123!";
            var user = new User { Username = "loginuser", Email = "login@example.com", PasswordHash = controller.HashPassword(password), RefreshTokens = new List<RefreshToken>() };
            context.Users.Add(user);
            await context.SaveChangesAsync();

            var request = new LoginRequest { Username = "loginuser", Password = password };

            // Act
            var result = await controller.Login(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
            Assert.NotNull((okResult.Value as dynamic).accessToken);
            Assert.NotNull((okResult.Value as dynamic).refreshToken);
        }

        [Fact]
        public async Task Login_ShouldReturnUnauthorized_ForInvalidCredentials()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var configuration = GetConfiguration();
            var controller = CreateAuthController(context, configuration);
            var request = new LoginRequest { Username = "nonexistent", Password = "wrongpassword" };

            // Act
            var result = await controller.Login(request);

            // Assert
            var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
            Assert.NotNull(unauthorizedResult.Value);
            Assert.Equal("INVALID_CREDENTIALS", (unauthorizedResult.Value as dynamic).code);
        }

        [Fact]
        public async Task SeedAdminUser_ShouldCreateAdminUser_WhenInDevelopment()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var inMemorySettings = new Dictionary<string, string> {
                {"JwtSettings:SecretKey", "supersecretkeythatisatleast32characterslong"},
                {"JwtSettings:Issuer", "AuthService"},
                {"JwtSettings:Audience", "AuthServiceClients"},
                {"IsDevelopment", "true"} // Simulate Development environment
            };
            IConfiguration configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();
            var controller = CreateAuthController(context, configuration);

            // Act
            var result = await controller.SeedAdminUser();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
            Assert.Equal("Admin user 'admin/admin' created successfully.", (okResult.Value as dynamic).message);
            Assert.True(await context.Users.AnyAsync(u => u.Username == "admin"));
        }

        [Fact]
        public async Task SeedAdminUser_ShouldReturnForbid_WhenNotInDevelopment()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            var inMemorySettings = new Dictionary<string, string> {
                {"JwtSettings:SecretKey", "supersecretkeythatisatleast32characterslong"},
                {"JwtSettings:Issuer", "AuthService"},
                {"JwtSettings:Audience", "AuthServiceClients"},
                {"IsDevelopment", "false"} // Simulate Production environment
            };
            IConfiguration configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();
            var controller = CreateAuthController(context, configuration);

            // Act
            var result = await controller.SeedAdminUser();

            // Assert
            Assert.IsType<ForbidResult>(result);
        }
    }
}
