using Azure.Core;
using Azure.Identity;
using Azure.Security.KeyVault.Certificates;
using Microsoft.Extensions.Options;
using System.Security.Cryptography.X509Certificates;
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
                        options.AuthenticationMode != TgsAuthenticationMode.ClientCertificate ||
                        !string.IsNullOrWhiteSpace(options.Audience),
                    "Tgs:Audience must be configured.")
                .Validate(
                    options =>
                        options.AuthenticationMode != TgsAuthenticationMode.ClientCertificate ||
                        (Uri.TryCreate(options.Authority, UriKind.Absolute, out Uri? authorityUri) &&
                         authorityUri.Scheme == Uri.UriSchemeHttps),
                    "Tgs:Authority must be an absolute HTTPS URL.")
                .Validate(
                    options =>
                        options.AuthenticationMode != TgsAuthenticationMode.ClientCertificate ||
                        Guid.TryParse(options.ClientId, out _),
                    "Tgs:ClientId must be a valid application ID.")
                .Validate(
                    options =>
                        options.AuthenticationMode != TgsAuthenticationMode.ClientCertificate ||
                        (Uri.TryCreate(options.KeyVaultUri, UriKind.Absolute, out Uri? keyVaultUri) &&
                         keyVaultUri.Scheme == Uri.UriSchemeHttps),
                    "Tgs:KeyVaultUri must be an absolute HTTPS URL.")
                .Validate(
                    options =>
                        options.AuthenticationMode != TgsAuthenticationMode.ClientCertificate ||
                        !string.IsNullOrWhiteSpace(options.CertificateName),
                    "Tgs:CertificateName must be configured.")
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
                    TgsAuthenticationMode.ClientCertificate);

            if (authenticationMode == TgsAuthenticationMode.DevelopmentAccessToken)
            {
                services.AddSingleton<ITgsAccessTokenProvider, DevelopmentTgsAccessTokenProvider>();
            }
            else
            {
                AddClientCertificateTokenProvider(services, configuration, environment);
            }

            services.AddHttpClient(nameof(TgsClient));
            services.AddSingleton<ITgsClient, TgsClient>();

            return services;
        }

        private static void AddClientCertificateTokenProvider(
            IServiceCollection services,
            IConfiguration configuration,
            IHostEnvironment environment)
        {
            if (environment.IsDevelopment())
            {
                services
                    .AddOptions<KeyVaultLocalAccessOptions>()
                    .Bind(configuration.GetSection(KeyVaultLocalAccessOptions.SectionName))
                    .Validate(
                        options => Guid.TryParse(options.ClientId, out _),
                        "KeyVaultLocalAccess:ClientId must be a valid application ID.")
                    .Validate(
                        options => Guid.TryParse(options.TenantId, out _),
                        "KeyVaultLocalAccess:TenantId must be a valid tenant ID.")
                    .Validate(
                        options => !string.IsNullOrWhiteSpace(options.CertificateCommonName),
                        "KeyVaultLocalAccess:CertificateCommonName must be configured.")
                    .ValidateOnStart();
            }

            services.AddSingleton<TokenCredential>(serviceProvider =>
                CreateKeyVaultCredential(serviceProvider, configuration, environment));
            services.AddSingleton(serviceProvider =>
            {
                TgsOptions options = serviceProvider.GetRequiredService<IOptions<TgsOptions>>().Value;
                return new CertificateClient(
                    new Uri(options.KeyVaultUri),
                    serviceProvider.GetRequiredService<TokenCredential>());
            });
            services.AddSingleton<
                ITgsAccessTokenProvider,
                ClientCertificateTgsAccessTokenProvider>();
        }

        private static TokenCredential CreateKeyVaultCredential(
            IServiceProvider serviceProvider,
            IConfiguration configuration,
            IHostEnvironment environment)
        {
            if (!environment.IsDevelopment())
            {
                string? managedIdentityClientId = configuration["Tgs:ManagedIdentityClientId"];
                return new DefaultAzureCredential(new DefaultAzureCredentialOptions
                {
                    ManagedIdentityClientId = string.IsNullOrWhiteSpace(managedIdentityClientId)
                        ? null
                        : managedIdentityClientId
                });
            }

            KeyVaultLocalAccessOptions options = serviceProvider
                .GetRequiredService<IOptions<KeyVaultLocalAccessOptions>>()
                .Value;
            X509Certificate2 certificate = FindLocalCertificate(options.CertificateCommonName);

            return new ClientCertificateCredential(
                options.TenantId,
                options.ClientId,
                certificate,
                new ClientCertificateCredentialOptions
                {
                    SendCertificateChain = true
                });
        }

        private static X509Certificate2 FindLocalCertificate(string commonName)
        {
            using X509Store certificateStore = new(StoreName.My, StoreLocation.LocalMachine);
            certificateStore.Open(OpenFlags.ReadOnly);

            return certificateStore.Certificates
                .Find(X509FindType.FindBySubjectName, commonName, validOnly: true)
                .OfType<X509Certificate2>()
                .Where(certificate => certificate.HasPrivateKey)
                .OrderByDescending(certificate => certificate.NotAfter)
                .FirstOrDefault()
                ?? throw new InvalidOperationException(
                    $"Unable to find a valid certificate with a private key and subject " +
                    $"'{commonName}' in LocalMachine\\My. Run installCertToLocal.ps1 first.");
        }
    }
}
