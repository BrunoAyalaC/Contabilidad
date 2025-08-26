using Auth.Api.Models;
using Auth.Api.Repositories;
using Auth.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Hosting;
using BCrypt.Net;

namespace Auth.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _users;
    private readonly ITokenService _tokens;
    private readonly ILogger<AuthController> _logger;
    private readonly IWebHostEnvironment _env;

    public AuthController(IUserRepository users, ITokenService tokens, ILogger<AuthController> logger, IWebHostEnvironment env)
    {
        _users = users;
        _tokens = tokens;
        _logger = logger;
        _env = env;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req?.Username) || string.IsNullOrWhiteSpace(req?.Password))
        {
            _logger.LogWarning("Login attempt with empty username or password");
            return BadRequest(new { message = "Usuario o contraseña inválidos" });
        }

        var user = await _users.GetByUsernameAsync(req.Username);
        if (user == null)
        {
            _logger.LogWarning("Login failed for unknown user '{Username}'", req.Username);
            return Unauthorized(new { message = "Credenciales inválidas" });
        }

        if (!BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
        {
            _logger.LogWarning("Invalid password for user '{Username}' (id: {UserId})", req.Username, user.Id);
            return Unauthorized(new { message = "Credenciales inválidas" });
        }

        var access = _tokens.GenerateAccessToken(user);
        var refresh = _tokens.GenerateRefreshToken();
        var refreshHash = _tokens.HashToken(refresh);

        var refreshToken = new RefreshToken { Id = Guid.NewGuid(), UserId = user.Id, TokenHash = refreshHash, ExpiresAt = DateTime.UtcNow.AddDays(30) };
        await _users.AddRefreshTokenAsync(refreshToken);

        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            // Ensure cookies are Secure in production; for local dev rely on Request.IsHttps
            Secure = _env.IsProduction() ? true : Request.IsHttps,
            SameSite = SameSiteMode.Strict,
            Expires = refreshToken.ExpiresAt,
            Path = "/"
        };

        Response.Cookies.Append("refreshToken", refresh, cookieOptions);

    _logger.LogInformation("User {UserId} logged in successfully", user.Id);
    return Ok(new { accessToken = access });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest? req)
    {
        var token = req?.RefreshToken;
        if (string.IsNullOrWhiteSpace(token))
        {
            if (Request.Cookies.TryGetValue("refreshToken", out var cookieVal)) token = cookieVal;
        }

        if (string.IsNullOrWhiteSpace(token)) return BadRequest();

        var hash = _tokens.HashToken(token);
        var stored = await _users.GetRefreshTokenAsync(hash);
        if (stored == null)
        {
            _logger.LogWarning("Refresh attempt with unknown/expired token");
            return Unauthorized();
        }

        var user = await _users.GetByIdAsync(stored.UserId);
        if (user == null)
        {
            _logger.LogWarning("Refresh token refers to missing user {UserId}", stored.UserId);
            return Unauthorized();
        }

        await _users.RemoveRefreshTokenAsync(stored);

        var newRefresh = _tokens.GenerateRefreshToken();
        var newHash = _tokens.HashToken(newRefresh);
        var rt = new RefreshToken { Id = Guid.NewGuid(), UserId = user.Id, TokenHash = newHash, ExpiresAt = DateTime.UtcNow.AddDays(30) };
        await _users.AddRefreshTokenAsync(rt);

        var access = _tokens.GenerateAccessToken(user);

        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = _env.IsProduction() ? true : Request.IsHttps,
            SameSite = SameSiteMode.Strict,
            Expires = rt.ExpiresAt,
            Path = "/"
        };

        Response.Cookies.Append("refreshToken", newRefresh, cookieOptions);

        _logger.LogInformation("Rotated refresh token for user {UserId}", user.Id);
        return Ok(new { accessToken = access });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshRequest? req)
    {
        var token = req?.RefreshToken;
        if (string.IsNullOrWhiteSpace(token))
        {
            if (Request.Cookies.TryGetValue("refreshToken", out var cookieVal)) token = cookieVal;
        }

        if (string.IsNullOrWhiteSpace(token)) return BadRequest();

        var hash = _tokens.HashToken(token);
        var stored = await _users.GetRefreshTokenAsync(hash);
        if (stored != null)
        {
            await _users.RevokeRefreshTokenAsync(stored);
            _logger.LogInformation("Revoked refresh token {TokenId} for user {UserId}", stored.Id, stored.UserId);
        }

        // remove cookie
        Response.Cookies.Delete("refreshToken", new CookieOptions { HttpOnly = true, Secure = _env.IsProduction() ? true : Request.IsHttps, SameSite = SameSiteMode.Strict, Path = "/" });

        return NoContent();
    }

}

public record LoginRequest(string Username, string Password);
public record RefreshRequest(string RefreshToken);
