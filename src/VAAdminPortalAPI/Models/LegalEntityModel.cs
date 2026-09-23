using System.Text.Json.Serialization;

namespace VAAdminPortalAPI.Models
{
    public class LegalEntityModel
    {
        /// <summary>
        /// Gets or sets the entity type (Company or Individual).
        /// </summary>
        [JsonPropertyName("entityType")]
        public EntityType EntityType { get; set; }

        /// <summary>
        /// Gets or sets the business name.
        /// </summary>
        [JsonPropertyName("businessName")]
        public string BusinessName { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the address line 1.
        /// </summary>
        [JsonPropertyName("addressLine1")]
        public string? AddressLine1 { get; set; }

        /// <summary>
        /// Gets or sets the address line 2 (optional).
        /// </summary>
        [JsonPropertyName("addressLine2")]
        public string? AddressLine2 { get; set; }

        /// <summary>
        /// Gets or sets the city.
        /// </summary>
        [JsonPropertyName("city")]
        public string? City { get; set; }

        /// <summary>
        /// Gets or sets the state or province (optional).
        /// </summary>
        [JsonPropertyName("stateProvince")]
        public string? StateProvince { get; set; }

        /// <summary>
        /// Gets or sets the country name.
        /// </summary>
        [JsonPropertyName("country")]
        public string? Country { get; set; }

        /// <summary>
        /// Gets or sets the 2-character ISO country code.
        /// </summary>
        [JsonPropertyName("countryCode")]
        public string? CountryCode { get; set; }

        /// <summary>
        /// Gets or sets the zip or postal code (optional).
        /// </summary>
        [JsonPropertyName("zipCode")]
        public string? ZipCode { get; set; }

        /// <summary>
        /// Gets or sets the legal identifier (e.g., EIN, VAT number) (optional).
        /// </summary>
        [JsonPropertyName("legalIdentifier")]
        public string? LegalIdentifier { get; set; }
    }
}
