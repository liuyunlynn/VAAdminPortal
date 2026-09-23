using System.Text.Json.Serialization;

namespace VAAdminPortalAPI.Models
{
    /// <summary>One globally ordered matching page and its total matching count from Teams Graph.</summary>
    public sealed record AiVirtualAssistantRegistrationListModel
    {
        [JsonPropertyName("registrations")]
        public IReadOnlyList<AiVirtualAssistantRegistrationModel> Registrations { get; init; } = [];

        [JsonPropertyName("totalCount")]
        public long TotalCount { get; init; }

        [JsonPropertyName("pageIndex")]
        public int PageIndex { get; init; }

        [JsonPropertyName("pageSize")]
        public int PageSize { get; init; }
    }
}
