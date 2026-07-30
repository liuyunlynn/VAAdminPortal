using System.Text.Json.Serialization;

namespace VAAdminPortalAPI.Models
{
    public class AllOverviewModel
    {
        [JsonPropertyName("totalRegistrationsCount")]
        public int TotalRegistrationsCount { get; set; }

        [JsonPropertyName("validationPassedCount")]
        public int ValidationPassedCount { get; set; }

        [JsonPropertyName("legalPassedCount")]
        public int LegalPassedCount { get; set; }

        [JsonPropertyName("validationPendingCount")]
        public int ValidationPendingCount {  get; set; }

        [JsonPropertyName("legalPendingCount")]
        public int LegalPendingCount { get; set; }

        [JsonPropertyName("attestedAssistantsCount")]
        public int AttestedAssistantsCount { get; set; }

        [JsonPropertyName("verifiedCount")]
        public int VerifiedCount {  get; set; }
    }
}
