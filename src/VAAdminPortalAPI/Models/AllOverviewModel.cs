using System.Text.Json.Serialization;

namespace VAAdminPortalAPI.Models
{
    public class AllOverviewModel
    {
        [JsonPropertyName("totalRegistrationsCount")]
        public int TotalRegistrationsCount { get; set; }

        [JsonPropertyName("validationPassedCount")]
        public int ValidationPassedCount { get; set; }

        [JsonPropertyName("pendingReviewCount")]
        public int PendingReviewCount {  get; set; }

        [JsonPropertyName("attestedAssistantsCount")]
        public int AttestedAssistantsCount { get; set; }
    }
}
