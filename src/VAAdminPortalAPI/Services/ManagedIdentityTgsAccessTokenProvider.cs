using Azure.Core;
using Azure.Identity;
using Microsoft.Extensions.Options;
using Microsoft.Identity.Client;

namespace VAAdminPortalAPI.Services
{
    /// <summary>
    /// Acquires app-only TGS tokens for the Admin Portal app registration, using the
    /// App Service system-assigned managed identity as a federated identity credential.
    /// </summary>
    public sealed class ManagedIdentityTgsAccessTokenProvider : ITgsAccessTokenProvider
    {
        private static readonly TokenRequestContext TokenExchangeRequestContext =
            new(["api://AzureADTokenExchange/.default"]);

        private readonly IConfidentialClientApplication confidentialClient;
        private readonly ManagedIdentityCredential managedIdentityCredential;
        private readonly string[] scopes;

        public ManagedIdentityTgsAccessTokenProvider(IOptions<TgsOptions> options)
        {
            TgsOptions tgsOptions = options.Value;
            scopes = [$"{tgsOptions.Audience.TrimEnd('/')}/.default"];
            managedIdentityCredential = new ManagedIdentityCredential(ManagedIdentityId.SystemAssigned);
            confidentialClient = ConfidentialClientApplicationBuilder
                .Create(tgsOptions.ClientId)
                .WithClientAssertion(GetManagedIdentityAssertionAsync)
                .WithAuthority($"{tgsOptions.Authority.TrimEnd('/')}/organizations")
                .Build();
        }

        public async Task<string> GetAccessTokenAsync(
            string tenantId,
            CancellationToken cancellationToken)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(tenantId);

            AuthenticationResult authenticationResult = await confidentialClient
                .AcquireTokenForClient(scopes)
                .WithTenantId(tenantId)
                .ExecuteAsync(cancellationToken)
                .ConfigureAwait(false);
            return authenticationResult.AccessToken;
        }

        private async Task<string> GetManagedIdentityAssertionAsync(
            AssertionRequestOptions assertionRequestOptions)
        {
            AccessToken managedIdentityToken = await managedIdentityCredential
                .GetTokenAsync(TokenExchangeRequestContext, assertionRequestOptions.CancellationToken)
                .ConfigureAwait(false);
            return managedIdentityToken.Token;
        }
    }
}
