using System.Text.Json.Serialization;

namespace VAAdminPortalAPI.Models
{
    /// <summary>A server-filtered, globally ordered Teams Graph registration page without cursors.</summary>
    public sealed record TgsRegistrationPageModel
    {
        [JsonPropertyName("value")]
        public required IReadOnlyList<AiVirtualAssistantRegistrationModel> Value { get; init; }

        [JsonPropertyName("totalCount")]
        public required long TotalCount { get; init; }

        [JsonPropertyName("pageIndex")]
        public required int PageIndex { get; init; }

        [JsonPropertyName("pageSize")]
        public required int PageSize { get; init; }
    }
}
