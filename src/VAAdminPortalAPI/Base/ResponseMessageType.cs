using System.Runtime.Serialization;
using System.Text.Json.Serialization;

namespace VAAdminPortalAPI.Base
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum ResponseMessageType
    {
        [EnumMember(Value = "Info")]
        Info = 1,
        
        [EnumMember(Value = "Warning")]
        Warning,

        [EnumMember(Value = "Error")]
        Error,

        [EnumMember(Value = "Success")]
        Success
    }
}
