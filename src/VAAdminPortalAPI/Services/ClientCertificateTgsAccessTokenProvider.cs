using System.Security.Cryptography.X509Certificates;
using Azure;
using Azure.Security.KeyVault.Certificates;
using Microsoft.Extensions.Options;
using Microsoft.Identity.Client;

namespace VAAdminPortalAPI.Services
{
    public sealed class ClientCertificateTgsAccessTokenProvider : ITgsAccessTokenProvider
    {
        private readonly Lazy<Task<X509Certificate2>> clientCertificate;
        private readonly Lazy<Task<IConfidentialClientApplication>> confidentialClient;
        private readonly CertificateClient certificateClient;
        private readonly TgsOptions options;

        public ClientCertificateTgsAccessTokenProvider(
            CertificateClient certificateClient,
            IOptions<TgsOptions> options)
        {
            this.certificateClient = certificateClient;
            this.options = options.Value;
            clientCertificate = new Lazy<Task<X509Certificate2>>(
                DownloadClientCertificateAsync,
                LazyThreadSafetyMode.ExecutionAndPublication);
            confidentialClient = new Lazy<Task<IConfidentialClientApplication>>(
                CreateConfidentialClientAsync,
                LazyThreadSafetyMode.ExecutionAndPublication);
        }

        public async Task<string> GetAccessTokenAsync(
            string tenantId,
            CancellationToken cancellationToken)
        {
            IConfidentialClientApplication client = await confidentialClient.Value
                .WaitAsync(cancellationToken)
                .ConfigureAwait(false);
            AuthenticationResult authenticationResult = await client
                .AcquireTokenForClient([$"{options.Audience.TrimEnd('/')}/.default"])
                .WithTenantIdFromAuthority(new Uri($"https://login.windows.net/{tenantId}"))
                .ExecuteAsync(cancellationToken)
                .ConfigureAwait(false);
            return authenticationResult.AccessToken;
        }

        private async Task<IConfidentialClientApplication> CreateConfidentialClientAsync()
        {
            X509Certificate2 certificate = await clientCertificate.Value.ConfigureAwait(false);

            return ConfidentialClientApplicationBuilder
                .Create(options.ClientId)
                .WithCertificate(certificate, options.SendX5C)
                .WithAuthority($"{options.Authority.TrimEnd('/')}/common", validateAuthority: false)
                .Build();
        }

        private async Task<X509Certificate2> DownloadClientCertificateAsync()
        {
            Response<X509Certificate2> response = await certificateClient
                .DownloadCertificateAsync(
                    new DownloadCertificateOptions(options.CertificateName),
                    CancellationToken.None)
                .ConfigureAwait(false);
            return response.Value;
        }
    }
}
