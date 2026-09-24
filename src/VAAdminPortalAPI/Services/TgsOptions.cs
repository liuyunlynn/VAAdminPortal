namespace VAAdminPortalAPI.Services
{
    public enum TgsAuthenticationMode
    {
        ManagedIdentity,
        DevelopmentAccessToken
    }

    public sealed class TgsOptions
    {
        public const string SectionName = "Tgs";

        public TgsAuthenticationMode AuthenticationMode { get; set; } =
            TgsAuthenticationMode.ManagedIdentity;

        public string BaseUrl { get; set; } = string.Empty;

        public string Audience { get; set; } = string.Empty;

        public string Authority { get; set; } = string.Empty;

        public string ClientId { get; set; } = string.Empty;

        public string? DevelopmentAccessToken { get; set; }
    }
}
