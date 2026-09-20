using Microsoft.Extensions.Options;

namespace VAAdminPortalAPI.Services
{
    public sealed class DevelopmentTgsAccessTokenProvider : ITgsAccessTokenProvider
    {
        private readonly TgsOptions options;

        public DevelopmentTgsAccessTokenProvider(IOptions<TgsOptions> options)
        {
            this.options = options.Value;
        }

        public Task<string> GetAccessTokenAsync(
            string tenantId,
            CancellationToken cancellationToken)
        {
            const string bearerPrefix = "Bearer ";
            string accessToken = options.DevelopmentAccessToken!;
            if (accessToken.StartsWith(bearerPrefix, StringComparison.OrdinalIgnoreCase))
            {
                accessToken = accessToken[bearerPrefix.Length..];
            }

            return Task.FromResult(accessToken.Trim());
        }
    }
}
