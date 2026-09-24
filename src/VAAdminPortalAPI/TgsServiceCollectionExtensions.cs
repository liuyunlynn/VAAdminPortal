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
                    options =>
                        Uri.TryCreate(options.BaseUrl, UriKind.Absolute, out Uri? baseUri) &&
                        baseUri.Scheme == Uri.UriSchemeHttps,
                    "Tgs:BaseUrl must be an absolute HTTPS URL.")
                .Validate(
                    options =>
                        options.AuthenticationMode != TgsAuthenticationMode.ManagedIdentity ||
                        !string.IsNullOrWhiteSpace(options.Audience),
                    "Tgs:Audience must be configured.")
                .Validate(
                    options =>
                        options.AuthenticationMode != TgsAuthenticationMode.ManagedIdentity ||
                        (Uri.TryCreate(options.Authority, UriKind.Absolute, out Uri? authorityUri) &&
                         authorityUri.Scheme == Uri.UriSchemeHttps),
                    "Tgs:Authority must be an absolute HTTPS URL.")
                .Validate(
                    options =>
                        options.AuthenticationMode != TgsAuthenticationMode.ManagedIdentity ||
                        Guid.TryParse(options.ClientId, out _),
                    "Tgs:ClientId must be a valid application ID.")
                .Validate(
                    options =>
                        options.AuthenticationMode != TgsAuthenticationMode.DevelopmentAccessToken ||
                        environment.IsDevelopment(),
                    "Tgs:AuthenticationMode DevelopmentAccessToken can only be used in Development.")
                .Validate(
                    options =>
                        options.AuthenticationMode != TgsAuthenticationMode.DevelopmentAccessToken ||
                        !string.IsNullOrWhiteSpace(options.DevelopmentAccessToken),
                    "Tgs:DevelopmentAccessToken is required for DevelopmentAccessToken authentication.")
                .ValidateOnStart();

            TgsAuthenticationMode authenticationMode = configuration
                .GetValue(
                    $"{TgsOptions.SectionName}:{nameof(TgsOptions.AuthenticationMode)}",
                    TgsAuthenticationMode.ManagedIdentity);

            if (authenticationMode == TgsAuthenticationMode.DevelopmentAccessToken)
            {
                services.AddSingleton<ITgsAccessTokenProvider, DevelopmentTgsAccessTokenProvider>();
            }
            else
            {
                services.AddSingleton<ITgsAccessTokenProvider, ManagedIdentityTgsAccessTokenProvider>();
            }

            services.AddHttpClient(nameof(TgsClient));
            services.AddSingleton<ITgsClient, TgsClient>();

            return services;
        }
    }
}
