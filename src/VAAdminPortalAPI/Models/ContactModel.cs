using System.Text.Json.Serialization;

namespace VAAdminPortalAPI.Models
{
    public class ContactModel
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
    }
}
