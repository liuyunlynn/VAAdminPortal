using System.Text.Json.Serialization;

namespace VAAdminPortalAPI.Models
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum RegistrationAction
    {
        ApproveRegistration,
        RejectRegistration,
        ApproveValidation,
        ResetValidation,
        ApproveLegal,
        ResetLegal
    }

    public class RegistrationActionModel
    {
        [JsonPropertyName("registrationId")]
        public string RegistrationId { get; set; } = string.Empty;

        [JsonPropertyName("action")]
        public RegistrationAction Action { get; set; }

        [JsonPropertyName("reason")]
        public string Reason { get; set; } = string.Empty;
    }
}