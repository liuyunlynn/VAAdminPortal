using System.Runtime.Serialization;
using System.Text.Json.Serialization;

namespace VAAdminPortalAPI.Models
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum ValidationStatus
    {
        [EnumMember(Value = "NotStarted")]
        NotStarted = 0,
        [EnumMember(Value = "Pending")]
        Pending,
        [EnumMember(Value = "Passed")]
        Passed,
        [EnumMember(Value = "Failed")]
        Failed,
    }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum LegalStatus
    {
        [EnumMember(Value = "NotStarted")]
        NotStarted = 0,
        [EnumMember(Value = "Pending")]
        Pending,
        [EnumMember(Value = "Passed")]
        Passed,
        [EnumMember(Value = "Failed")]
        Failed,
    }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum BotVerificationLevel
    {
        /// <summary>
        /// No verification.
        /// </summary>
        [EnumMember(Value = "None")]
        None = 0,

        /// <summary>
        /// Domain ownership verified.
        /// </summary>
        [EnumMember(Value = "Registered")]
        Registered = 1,

        /// <summary>
        /// Legal/programme attestation present.
        /// </summary>
        [EnumMember(Value = "Attested")]
        Attested = 2,
    }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum EntityType
    {
        /// <summary>
        /// Company or organization.
        /// </summary>
        [EnumMember(Value = "Company")]
        Company,

        /// <summary>
        /// Individual person.
        /// </summary>
        [EnumMember(Value = "Individual")]
        Individual,
    }
}
