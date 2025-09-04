using Xunit;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;
using System.Text;
using AuthService.Controllers;
using AuthService.Models;
using System.Net;

namespace AuthService.Tests
{
    public class AuthIntegrationTests : IClassFixture<CustomWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory<Program> _factory;

        public AuthIntegrationTests(CustomWebApplicationFactory<Program> factory)
        {
            _factory = factory;
            _client = _factory.CreateClient();
        }

        [Fact]
        public async Task Register_Endpoint_ReturnsOk_ForValidRegistration()
        {
            // Arrange
            var request = new RegisterRequest { Username = "integrationtestuser", Email = "integration@example.com", Password = "Password123!" };
            var jsonContent = new StringContent(JsonConvert.SerializeObject(request), Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/Auth/register", jsonContent);

            // Assert
            response.EnsureSuccessStatusCode(); // Status Code 200-299
            var responseString = await response.Content.ReadAsStringAsync();
            Assert.Contains("User registered successfully.", responseString);
        }

        [Fact]
        public async Task Login_Endpoint_ReturnsTokens_ForValidCredentials()
        {
            // Arrange: Register a user first
            var registerRequest = new RegisterRequest { Username = "loginintegration", Email = "loginint@example.com", Password = "Password123!" };
            var registerContent = new StringContent(JsonConvert.SerializeObject(registerRequest), Encoding.UTF8, "application/json");
            await _client.PostAsync("/api/Auth/register", registerContent);

            var loginRequest = new LoginRequest { Username = "loginintegration", Password = "Password123!" };
            var loginContent = new StringContent(JsonConvert.SerializeObject(loginRequest), Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/Auth/login", loginContent);

            // Assert
            response.EnsureSuccessStatusCode();
            var responseString = await response.Content.ReadAsStringAsync();
            dynamic result = JsonConvert.DeserializeObject(responseString);
            Assert.NotNull(result.accessToken);
            Assert.NotNull(result.refreshToken);
        }

        [Fact]
        public async Task Me_Endpoint_ReturnsUserData_ForAuthenticatedUser()
        {
            // Arrange: Register and Login a user to get a token
            var registerRequest = new RegisterRequest { Username = "meuser", Email = "me@example.com", Password = "Password123!" };
            var registerContent = new StringContent(JsonConvert.SerializeObject(registerRequest), Encoding.UTF8, "application/json");
            await _client.PostAsync("/api/Auth/register", registerContent);

            var loginRequest = new LoginRequest { Username = "meuser", Password = "Password123!" };
            var loginContent = new StringContent(JsonConvert.SerializeObject(loginRequest), Encoding.UTF8, "application/json");
            var loginResponse = await _client.PostAsync("/api/Auth/login", loginContent);
            loginResponse.EnsureSuccessStatusCode();
            dynamic loginResult = JsonConvert.DeserializeObject(await loginResponse.Content.ReadAsStringAsync());
            string accessToken = loginResult.accessToken;

            _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

            // Act
            var response = await _client.GetAsync("/api/Auth/me");

            // Assert
            response.EnsureSuccessStatusCode();
            var responseString = await response.Content.ReadAsStringAsync();
            dynamic meResult = JsonConvert.DeserializeObject(responseString);
            Assert.Equal("meuser", (string)meResult.username);
        }

        [Fact]
        public async Task Me_Endpoint_ReturnsUnauthorized_ForUnauthenticatedUser()
        {
            // Arrange: No token set

            // Act
            var response = await _client.GetAsync("/api/Auth/me");

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
    }
}
