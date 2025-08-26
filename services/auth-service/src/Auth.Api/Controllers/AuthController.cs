using Auth.Api.Models;
using Auth.Api.Repositories;
using Auth.Api.Services;
using Microsoft.AspNetCore.Mvc;
using BCrypt.Net;

namespace Auth.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _users;
    private readonly ITokenService _tokens;

    public AuthController(IUserRepository users, ITokenService tokens)
    {
        _users = users;
        _tokens = tokens;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "username and password required" });

        var user = await _users.GetByUsernameAsync(req.Username);
        if (user == null) return Unauthorized(new { message = "invalid credentials" });

        if (!BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { message = "invalid credentials" });

        var access = _tokens.GenerateAccessToken(user);
        var refresh = _tokens.GenerateRefreshToken();
        var refreshHash = _tokens.HashToken(refresh);

        var refreshToken = new RefreshToken { Id = Guid.NewGuid(), UserId = user.Id, TokenHash = refreshHash, ExpiresAt = DateTime.UtcNow.AddDays(30) };
        await _users.AddRefreshTokenAsync(refreshToken);

        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = SameSiteMode.Strict,
            Expires = refreshToken.ExpiresAt
        };

        Response.Cookies.Append("refreshToken", refresh, cookieOptions);

        return Ok(new { accessToken = access });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest? req)
    {
        var token = req?.RefreshToken;
        if (string.IsNullOrWhiteSpace(token))
        {
            // try cookie
            if (Request.Cookies.TryGetValue("refreshToken", out var cookieVal)) token = cookieVal;
        }

        if (string.IsNullOrWhiteSpace(token)) return BadRequest();

        var hash = _tokens.HashToken(token);
        var stored = await _users.GetRefreshTokenAsync(hash);
        if (stored == null) return Unauthorized();

        var user = await _users.GetByIdAsync(stored.UserId);
        if (user == null) return Unauthorized();

        // rotate: remove old token
        await _users.RemoveRefreshTokenAsync(stored);

        var newRefresh = _tokens.GenerateRefreshToken();
        var newHash = _tokens.HashToken(newRefresh);
        var rt = new RefreshToken { Id = Guid.NewGuid(), UserId = user.Id, TokenHash = newHash, ExpiresAt = DateTime.UtcNow.AddDays(30) };
        await _users.AddRefreshTokenAsync(rt);

        var access = _tokens.GenerateAccessToken(user);

        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = SameSiteMode.Strict,
            Expires = rt.ExpiresAt
        };

        Response.Cookies.Append("refreshToken", newRefresh, cookieOptions);

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
        if (stored != null) await _users.RevokeRefreshTokenAsync(stored);

        // remove cookie
        Response.Cookies.Delete("refreshToken", new CookieOptions { HttpOnly = true, Secure = Request.IsHttps, SameSite = SameSiteMode.Strict, Path = "/" });

        return NoContent();
    }

}

public record LoginRequest(string Username, string Password);
public record RefreshRequest(string RefreshToken);
