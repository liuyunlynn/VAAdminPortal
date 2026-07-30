using System.Text.Json.Serialization;

namespace VAAdminPortalAPI.Models
{
    public class AiVirtualAssistantRegistrationQueryModel
    {
        [JsonPropertyName("pageIndex")]
        public int PageIndex { get; set; }

        [JsonPropertyName("pageSize")]
        public int PageSize { get; set; }

        [JsonPropertyName("startDate")]
        public DateTimeOffset? StartDate { get; set; } = default;

        [JsonPropertyName("endDate")]
        public DateTimeOffset? EndDate { get; set; } = default;

        [JsonPropertyName("searchTerm")]
        public string? SearchTerm { get; set; } = null;

        [JsonPropertyName("validationStatus")]
        public ValidationStatus? ValidationStatus { get; set; }

        [JsonPropertyName("legalStatus")]
        public LegalStatus LegalStatus { get; set; }
    }
}
