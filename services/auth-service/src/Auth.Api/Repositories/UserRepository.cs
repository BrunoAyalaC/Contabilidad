using Auth.Api.Data;
using Auth.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Auth.Api.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AuthDbContext _db;

    public UserRepository(AuthDbContext db)
    {
        _db = db;
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        return await _db.Users.FirstOrDefaultAsync(u => u.Username == username && u.IsActive);
    }

    public async Task<User?> GetByIdAsync(Guid id)
    {
        return await _db.Users.FindAsync(id);
    }

    public async Task CreateAsync(User user)
    {
        await _db.Users.AddAsync(user);
    }

    public async Task SaveChangesAsync()
    {
        await _db.SaveChangesAsync();
    }

    public async Task AddRefreshTokenAsync(RefreshToken token)
    {
        await _db.RefreshTokens.AddAsync(token);
        await _db.SaveChangesAsync();
    }

    public async Task<RefreshToken?> GetRefreshTokenAsync(string tokenHash)
    {
        return await _db.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == tokenHash && r.ExpiresAt > DateTime.UtcNow && !r.IsRevoked);
    }

    public async Task RemoveRefreshTokenAsync(RefreshToken token)
    {
        _db.RefreshTokens.Remove(token);
        await _db.SaveChangesAsync();
    }

    public async Task RevokeRefreshTokenAsync(RefreshToken token)
    {
        token.IsRevoked = true;
        _db.RefreshTokens.Update(token);
        await _db.SaveChangesAsync();
    }

    public async Task PurgeExpiredAndRevokedTokensAsync(DateTime olderThan)
    {
        var toRemove = await _db.RefreshTokens
            .Where(r => r.ExpiresAt <= olderThan || r.IsRevoked)
            .ToListAsync();

        if (toRemove.Any())
        {
            _db.RefreshTokens.RemoveRange(toRemove);
            await _db.SaveChangesAsync();
        }
    }
}
