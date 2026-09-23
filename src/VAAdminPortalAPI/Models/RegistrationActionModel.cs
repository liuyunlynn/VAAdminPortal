using System.Text.Json.Serialization;

namespace VAAdminPortalAPI.Models
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum RegistrationAction
    {
        ApproveRegistration = 0,
        RejectRegistration = 1,
        ApproveValidation = 2,
        ResetValidation = 3
    }

    public class RegistrationActionModel
    {
        [JsonPropertyName("registrationId")]
        public string RegistrationId { get; set; } = string.Empty;

        [JsonPropertyName("tenantId")]
        public string TenantId { get; set; } = string.Empty;

        [JsonPropertyName("action")]
        public RegistrationAction Action { get; set; }

        [JsonPropertyName("reason")]
        public string Reason { get; set; } = string.Empty;
    }
}