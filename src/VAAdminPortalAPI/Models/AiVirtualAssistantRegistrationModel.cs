using System.Text.Json.Serialization;

namespace VAAdminPortalAPI.Models
{
    public class AiVirtualAssistantRegistrationModel
    {
        /// <summary>
        /// Gets or sets the registration ID (server-generated GUID).
        /// </summary>
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the app registration ID (client-provided, immutable).
        /// </summary>
        [JsonPropertyName("appId")]
        public string AppId { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the home tenant ID (server-populated from TPS).
        /// Forms the (tid, appid) pair used for runtime verification.
        /// </summary>
        [JsonPropertyName("tenantId")]
        public string TenantId { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the display name (Graph-populated from app registration).
        /// </summary>
        [JsonPropertyName("displayName")]
        public string DisplayName { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the domain (Graph-populated, optional).
        /// </summary>
        [JsonPropertyName("domain")]
        public string? Domain { get; set; }

        /// <summary>
        /// Gets or sets the logo URL (Graph-populated, optional).
        /// </summary>
        [JsonPropertyName("logoUrl")]
        public string? LogoUrl { get; set; }

        /// <summary>
        /// Gets or sets the privacy statement URL (Graph-populated, optional).
        /// </summary>
        [JsonPropertyName("privacyStatementUrl")]
        public string? PrivacyStatementUrl { get; set; }

        /// <summary>
        /// Gets or sets the authoritative verification level (Registered or Attested) returned by Teams Graph.
        /// </summary>
        [JsonPropertyName("verification")]
        public string Verification { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the created date time (server-set, read-only, ISO 8601 UTC).
        /// </summary>
        [JsonPropertyName("createdDateTime")]
        public DateTimeOffset CreatedDateTime { get; set; }

        /// <summary>
        /// Gets or sets the legal entity information.
        /// </summary>
        [JsonPropertyName("legalEntity")]
        public LegalEntityModel LegalEntity { get; set; } = new LegalEntityModel();

        /// <summary>
        /// Gets or sets the primary contact.
        /// </summary>
        [JsonPropertyName("primaryContact")]
        public PrimaryContactModel PrimaryContact { get; set; } = new PrimaryContactModel();

        /// <summary>
        /// Gets or sets the technical contact.
        /// </summary>
        [JsonPropertyName("technicalContact")]
        public ContactModel TechnicalContact { get; set; } = new ContactModel();

        /// <summary>
        /// Gets or sets the program manager contact.
        /// </summary>
        [JsonPropertyName("programManagerContact")]
        public ContactModel ProgramManagerContact { get; set; } = new ContactModel();

        /// <summary>
        /// Gets or sets the onboarding documentation URL.
        /// </summary>
        [JsonPropertyName("onboardingDocUrl")]
        public string OnboardingDocUrl { get; set; } = string.Empty;

        [JsonPropertyName("validationStatus")]
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public ValidationStatus ValidationStatus { get; set; }

        /// <summary>
        /// Gets or sets the reason explaining why validation failed.
        /// Only populated when <see cref="ValidationStatus"/> is <see cref="ValidationStatus.Failed"/>.
        /// </summary>
        [JsonPropertyName("validationFailureReason")]
        public string? ValidationFailureReason { get; set; }

        /// <summary>
        /// Gets or sets the reason recorded for the administrator's approval decision.
        /// </summary>
        [JsonPropertyName("approvalReason")]
        public string? ApprovalReason { get; set; }

        /// <summary>
        /// Gets or sets when the agreement was accepted.
        /// </summary>
        [JsonPropertyName("agreementAcceptedDateTime")]
        public DateTimeOffset? AgreementAcceptedDateTime { get; set; }

        /// <summary>
        /// Gets or sets the email address of the agreement signer.
        /// </summary>
        [JsonPropertyName("agreementAcceptedBy")]
        public string? AgreementAcceptedBy { get; set; }

        [JsonPropertyName("verified")]
        public bool Verified => string.Equals(Verification, "Attested", StringComparison.OrdinalIgnoreCase);
    }
}
