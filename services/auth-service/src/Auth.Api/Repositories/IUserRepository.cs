using Auth.Api.Models;

namespace Auth.Api.Repositories;

public interface IUserRepository
{
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByIdAsync(Guid id);
    Task CreateAsync(User user);
    Task SaveChangesAsync();
    Task AddRefreshTokenAsync(RefreshToken token);
    Task<RefreshToken?> GetRefreshTokenAsync(string tokenHash);
    Task RemoveRefreshTokenAsync(RefreshToken token);
    Task RevokeRefreshTokenAsync(RefreshToken token);
    Task PurgeExpiredAndRevokedTokensAsync(DateTime olderThan);
}
