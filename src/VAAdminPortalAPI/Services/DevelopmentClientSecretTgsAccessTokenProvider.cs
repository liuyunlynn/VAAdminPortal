using System.Text.Json;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using Microsoft.Identity.Client;

namespace VAAdminPortalAPI.Services
{
    public sealed class DevelopmentClientSecretTgsAccessTokenProvider : ITgsAccessTokenProvider
    {
        private readonly IConfidentialClientApplication confidentialClient;
        private readonly string authenticationTenantId;
        private readonly ILogger<DevelopmentClientSecretTgsAccessTokenProvider> logger;
        private readonly string[] scopes;

        public DevelopmentClientSecretTgsAccessTokenProvider(
            IOptions<TgsOptions> options,
            IConfiguration configuration,
            ILogger<DevelopmentClientSecretTgsAccessTokenProvider> logger)
        {
            TgsOptions tgsOptions = options.Value;
            string? clientSecret = configuration["AzureAd:ClientSecret"];
            ArgumentException.ThrowIfNullOrWhiteSpace(clientSecret);

            this.logger = logger;
            authenticationTenantId = tgsOptions.AuthenticationTenantId;
            scopes = [$"{tgsOptions.Audience.TrimEnd('/')}/.default"];
            confidentialClient = ConfidentialClientApplicationBuilder
                .Create(tgsOptions.ClientId)
                .WithClientSecret(clientSecret)
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
                .WithTenantId(authenticationTenantId)
                .ExecuteAsync(cancellationToken)
                .ConfigureAwait(false);
            LogTokenMetadata(authenticationResult.AccessToken, authenticationTenantId);
            return authenticationResult.AccessToken;
        }

        private void LogTokenMetadata(string accessToken, string requestedTenantId)
        {
            string[] segments = accessToken.Split('.');
            if (segments.Length != 3)
            {
                logger.LogWarning(
                    "Acquired TGS token has an unexpected JWT segment count. RequestedTenantId: {RequestedTenantId}, SegmentCount: {SegmentCount}",
                    requestedTenantId,
                    segments.Length);
                return;
            }

            try
            {
                using JsonDocument payload = JsonDocument.Parse(WebEncoders.Base64UrlDecode(segments[1]));
                JsonElement root = payload.RootElement;
                string? appId = GetStringProperty(root, "appid") ?? GetStringProperty(root, "azp");
                string? credentialType = GetStringProperty(root, "appidacr") ?? GetStringProperty(root, "azpacr");

                logger.LogInformation(
                    "Acquired TGS token metadata. RequestedTenantId: {RequestedTenantId}, TokenTenantId: {TokenTenantId}, Audience: {Audience}, AppId: {AppId}, Version: {Version}, CredentialType: {CredentialType}, HasRoles: {HasRoles}, HasScopes: {HasScopes}",
                    requestedTenantId,
                    GetStringProperty(root, "tid"),
                    GetStringProperty(root, "aud"),
                    appId,
                    GetStringProperty(root, "ver"),
                    credentialType,
                    HasValue(root, "roles"),
                    HasValue(root, "scp"));
            }
            catch (JsonException exception)
            {
                logger.LogWarning(exception, "Unable to parse TGS access-token metadata.");
            }
            catch (FormatException exception)
            {
                logger.LogWarning(exception, "Unable to decode TGS access-token metadata.");
            }
        }

        private static string? GetStringProperty(JsonElement root, string propertyName)
        {
            return root.TryGetProperty(propertyName, out JsonElement property) &&
                   property.ValueKind == JsonValueKind.String
                ? property.GetString()
                : null;
        }

        private static bool HasValue(JsonElement root, string propertyName)
        {
            if (!root.TryGetProperty(propertyName, out JsonElement property))
            {
                return false;
            }

            return property.ValueKind switch
            {
                JsonValueKind.Array => property.GetArrayLength() > 0,
                JsonValueKind.String => !string.IsNullOrWhiteSpace(property.GetString()),
                _ => property.ValueKind is not (JsonValueKind.Null or JsonValueKind.Undefined)
            };
        }
    }
}
