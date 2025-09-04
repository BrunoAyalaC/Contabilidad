using AuthService.Data;
using AuthService.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;

namespace AuthService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AuthDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(AuthDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("seed-admin")]
        [AllowAnonymous] // Allow access without authentication
        public async Task<IActionResult> SeedAdminUser()
        {
            // Only allow in Development environment
            if (!_configuration.GetValue<bool>("IsDevelopment"))
            {
                return Forbid(); // Or NotFound()
            }

            var adminUser = await _context.Users.SingleOrDefaultAsync(u => u.Username == "admin");
            if (adminUser == null)
            {
                var newAdmin = new User
                {
                    Username = "admin",
                    Email = "admin@example.com",
                    PasswordHash = HashPassword("admin") // Password is 'admin'
                };
                _context.Users.Add(newAdmin);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Admin user 'admin/admin' created successfully." });
            }
            return Ok(new { message = "Admin user already exists." });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            {
                return BadRequest(new { code = "USERNAME_TAKEN", message = "Username is already taken." });
            }

            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = HashPassword(request.Password)
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User registered successfully." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users.Include(u => u.RefreshTokens).SingleOrDefaultAsync(u => u.Username == request.Username);

            if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
            {
                return Unauthorized(new { code = "INVALID_CREDENTIALS", message = "Invalid username or password." });
            }

            // Ensure RefreshTokens collection is initialized
            if (user.RefreshTokens == null)
            {
                user.RefreshTokens = new List<RefreshToken>();
            }

            var accessToken = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();

            var newRefreshToken = new RefreshToken
            {
                UserId = user.Id,
                TokenHash = HashToken(refreshToken),
                IssuedAt = DateTimeOffset.UtcNow,
                ExpiresAt = DateTimeOffset.UtcNow.AddDays(7), // Refresh token valid for 7 days
                Ip = HttpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent = Request.Headers["User-Agent"].ToString()
            };

            _context.RefreshTokens.Add(newRefreshToken);

            await _context.SaveChangesAsync();

            return Ok(new { accessToken, refreshToken });
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
        {
            var hashedRefreshToken = HashToken(request.RefreshToken);
            var existingRefreshToken = await _context.RefreshTokens
                .Include(rt => rt.User)
                .SingleOrDefaultAsync(rt => rt.TokenHash == hashedRefreshToken && rt.Revoked == false && rt.ExpiresAt > DateTimeOffset.UtcNow);

            if (existingRefreshToken == null || existingRefreshToken.User == null)
            {
                return Unauthorized(new { code = "INVALID_REFRESH_TOKEN", message = "Invalid or expired refresh token." });
            }

            // Revoke the old token
            existingRefreshToken.Revoked = true;

            // Generate new tokens
            var newAccessToken = GenerateJwtToken(existingRefreshToken.User);
            var newRefreshToken = GenerateRefreshToken();

            existingRefreshToken.User?.RefreshTokens.Add(new RefreshToken
            {
                UserId = existingRefreshToken.UserId,
                TokenHash = HashToken(newRefreshToken),
                IssuedAt = DateTimeOffset.UtcNow,
                ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
                Ip = HttpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent = Request.Headers["User-Agent"].ToString()
            });

            await _context.SaveChangesAsync();

            return Ok(new { accessToken = newAccessToken, refreshToken = newRefreshToken });
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
        {
            var hashedRefreshToken = HashToken(request.RefreshToken);
            var existingRefreshToken = await _context.RefreshTokens
                .SingleOrDefaultAsync(rt => rt.TokenHash == hashedRefreshToken && rt.Revoked == false);

            if (existingRefreshToken == null)
            {
                return Ok(new { message = "Refresh token already revoked or not found." });
            }

            existingRefreshToken.Revoked = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Logged out successfully." });
        }

        [HttpGet("me")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> Me()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                return Unauthorized();
            }

            if (!int.TryParse(userId, out var parsedUserId))
            {
                return Unauthorized();
            }

            var user = await _context.Users.FindAsync(parsedUserId);
            if (user == null)
            {
                return NotFound();
            }

            return Ok(new { user.Id, user.Username, user.Email, user.IsActive });
        }

        internal string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return BitConverter.ToString(hashedBytes).Replace("-", "").ToLowerInvariant();
            }
        }

        internal bool VerifyPassword(string password, string hashedPassword)
        {
            return HashPassword(password) == hashedPassword;
        }

        internal string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JwtSettings:SecretKey is not configured");
            var issuer = jwtSettings["Issuer"] ?? "AuthService";
            var audience = jwtSettings["Audience"] ?? "AuthServiceClients";

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username)
                // Add other claims like roles if needed
            };

            var token = new JwtSecurityToken(issuer, audience,
                claims,
                expires: DateTime.Now.AddMinutes(15), // Access token valid for 15 minutes
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        internal string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomNumber);
                return Convert.ToBase64String(randomNumber);
            }
        }

        internal string HashToken(string token)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(token));
                return BitConverter.ToString(hashedBytes).Replace("-", "").ToLowerInvariant();
            }
        }
    }

    public class RegisterRequest
    {
        [Required]
        public required string Username { get; set; }
        [Required]
        public required string Password { get; set; }
        public string? Email { get; set; }
    }

    public class LoginRequest
    {
        [Required]
        public required string Username { get; set; }
        [Required]
        public required string Password { get; set; }
    }

    public class RefreshRequest
    {
        [Required]
        public required string RefreshToken { get; set; }
    }

    public class LogoutRequest
    {
        [Required]
        public required string RefreshToken { get; set; }
    }
}
