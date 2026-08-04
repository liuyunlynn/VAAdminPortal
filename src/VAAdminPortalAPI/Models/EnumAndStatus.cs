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
