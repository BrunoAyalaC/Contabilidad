using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Auth.Api.Repositories;

namespace Auth.Api.Services;

public class TokenCleanupService : BackgroundService
{
    private readonly ILogger<TokenCleanupService> _logger;
    private readonly IServiceProvider _provider;
    private readonly TimeSpan _interval = TimeSpan.FromHours(24); // daily by default

    public TokenCleanupService(ILogger<TokenCleanupService> logger, IServiceProvider provider)
    {
        _logger = logger;
        _provider = provider;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("TokenCleanupService started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _provider.CreateScope();
                var repo = scope.ServiceProvider.GetRequiredService<IUserRepository>();

                // Purge tokens that are expired or explicitly revoked older than now
                await repo.PurgeExpiredAndRevokedTokensAsync(DateTime.UtcNow);

                _logger.LogInformation("Token cleanup completed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error running token cleanup");
            }

            await Task.Delay(_interval, stoppingToken);
        }
    }
}
