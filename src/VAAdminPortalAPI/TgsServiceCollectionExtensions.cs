using VAAdminPortalAPI.Services;

namespace VAAdminPortalAPI
{
    public static class TgsServiceCollectionExtensions
    {
        public static IServiceCollection AddTgsIntegration(
            this IServiceCollection services,
            IConfiguration configuration,
            IHostEnvironment environment)
        {
            services
                .AddOptions<TgsOptions>()
                .Bind(configuration.GetSection(TgsOptions.SectionName))
                .Validate(
                    options => Enum.IsDefined(options.AuthenticationMode),
                    "Tgs:AuthenticationMode is invalid.")
                .Validate(
                    options =>
                        Uri.TryCreate(options.BaseUrl, UriKind.Absolute, out Uri? baseUri) &&
                        baseUri.Scheme == Uri.UriSchemeHttps,
                    "Tgs:BaseUrl must be an absolute HTTPS URL.")
                .Validate(
                    options =>
                        options.AuthenticationMode == TgsAuthenticationMode.DevelopmentAccessToken ||
                        !string.IsNullOrWhiteSpace(options.Audience),
                    "Tgs:Audience must be configured.")
                .Validate(
                    options =>
                        options.AuthenticationMode == TgsAuthenticationMode.DevelopmentAccessToken ||
                        (Uri.TryCreate(options.Authority, UriKind.Absolute, out Uri? authorityUri) &&
                         authorityUri.Scheme == Uri.UriSchemeHttps),
                    "Tgs:Authority must be an absolute HTTPS URL.")
                .Validate(
                    options =>
                        options.AuthenticationMode == TgsAuthenticationMode.DevelopmentAccessToken ||
                        Guid.TryParse(options.ClientId, out _),
                    "Tgs:ClientId must be a valid application ID.")
                .Validate(
                    options =>
                        options.AuthenticationMode is not (
                            TgsAuthenticationMode.DevelopmentAccessToken or
                            TgsAuthenticationMode.DevelopmentClientSecret) ||
                        environment.IsDevelopment(),
                    "Development TGS authentication modes can only be used in Development.")
                .Validate(
                    options =>
                        options.AuthenticationMode != TgsAuthenticationMode.DevelopmentAccessToken ||
                        !string.IsNullOrWhiteSpace(options.DevelopmentAccessToken),
                    "Tgs:DevelopmentAccessToken is required for DevelopmentAccessToken authentication.")
                .Validate(
                    options =>
                        options.AuthenticationMode != TgsAuthenticationMode.DevelopmentClientSecret ||
                        !string.IsNullOrWhiteSpace(configuration["AzureAd:ClientSecret"]),
                    "AzureAd:ClientSecret is required for DevelopmentClientSecret authentication.")
                .Validate(
                    options =>
                        options.AuthenticationMode != TgsAuthenticationMode.DevelopmentClientSecret ||
                        string.Equals(
                            options.ClientId,
                            configuration["AzureAd:ClientId"],
                            StringComparison.OrdinalIgnoreCase),
                    "Tgs:ClientId must match AzureAd:ClientId when using DevelopmentClientSecret authentication.")
                .ValidateOnStart();

            TgsAuthenticationMode authenticationMode = configuration
                .GetValue(
                    $"{TgsOptions.SectionName}:{nameof(TgsOptions.AuthenticationMode)}",
                    TgsAuthenticationMode.ManagedIdentity);

            switch (authenticationMode)
            {
                case TgsAuthenticationMode.DevelopmentAccessToken:
                    services.AddSingleton<ITgsAccessTokenProvider, DevelopmentTgsAccessTokenProvider>();
                    break;
                case TgsAuthenticationMode.DevelopmentClientSecret:
                    services.AddSingleton<ITgsAccessTokenProvider, DevelopmentClientSecretTgsAccessTokenProvider>();
                    break;
                case TgsAuthenticationMode.ManagedIdentity:
                    services.AddSingleton<ITgsAccessTokenProvider, ManagedIdentityTgsAccessTokenProvider>();
                    break;
                default:
                    throw new InvalidOperationException(
                        $"Unsupported TGS authentication mode '{authenticationMode}'.");
            }

            services.AddHttpClient(nameof(TgsClient));
            services.AddSingleton<ITgsClient, TgsClient>();

            return services;
        }
    }
}
