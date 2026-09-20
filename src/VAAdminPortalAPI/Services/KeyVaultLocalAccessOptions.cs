namespace VAAdminPortalAPI.Services
{
    public sealed class KeyVaultLocalAccessOptions
    {
        public const string SectionName = "KeyVaultLocalAccess";

        public string ClientId { get; set; } = string.Empty;

        public string TenantId { get; set; } = string.Empty;

        public string CertificateCommonName { get; set; } = string.Empty;
    }
}
