using System.Text.Json.Serialization;

namespace VAAdminPortalAPI.Models
{
    public class PrimaryContactModel
    {
        /// <summary>
        /// Gets or sets the contact name.
        /// </summary>
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the contact email.
        /// </summary>
        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the contact phone number.
        /// </summary>
        [JsonPropertyName("phone")]
        public string Phone { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the contact title (e.g., CEO, CTO).
        /// </summary>
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;
    }
}
