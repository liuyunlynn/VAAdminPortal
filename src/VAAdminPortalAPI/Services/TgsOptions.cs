namespace VAAdminPortalAPI.Services
{
    public enum TgsAuthenticationMode
    {
        ClientCertificate,
        DevelopmentAccessToken
    }

    public sealed class TgsOptions
    {
        public const string SectionName = "Tgs";

        public TgsAuthenticationMode AuthenticationMode { get; set; } =
            TgsAuthenticationMode.ClientCertificate;

        public string BaseUrl { get; set; } = string.Empty;

        public string Audience { get; set; } = string.Empty;

        public string Authority { get; set; } = string.Empty;

        public string ClientId { get; set; } = string.Empty;

        public string KeyVaultUri { get; set; } = string.Empty;

        public string CertificateName { get; set; } = string.Empty;

        public string? ManagedIdentityClientId { get; set; }

        public string? DevelopmentAccessToken { get; set; }

        public bool SendX5C { get; set; }
    }
}
