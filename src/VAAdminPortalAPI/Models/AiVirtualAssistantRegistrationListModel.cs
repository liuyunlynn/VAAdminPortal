using System.Text.Json.Serialization;

namespace VAAdminPortalAPI.Models
{
    public class AiVirtualAssistantRegistrationListModel
    {
        [JsonPropertyName("registrations")]
        public IList<AiVirtualAssistantRegistrationModel> Registrations { get; set; } = new List<AiVirtualAssistantRegistrationModel>();

        [JsonPropertyName("totalCount")]
        public int TotalCount { get; set; }
    }
}
