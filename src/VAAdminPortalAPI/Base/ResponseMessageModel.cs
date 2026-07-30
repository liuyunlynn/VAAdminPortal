namespace VAAdminPortalAPI.Base
{
    public class ResponseMessageModel
    {
        public ResponseMessageModel(ResponseMessageType responseMessageType, string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                throw new ArgumentNullException(nameof(value));
            }

            ResponseMessageType = responseMessageType;
            Value = value;
        }

        public ResponseMessageModel(ResponseMessageType responseMessageType, string value, string code)
           : this(responseMessageType, value)
        {
            Code = code;
        }

        public ResponseMessageModel(ResponseMessageType responseMessageType, string value, string code, string details)
            : this(responseMessageType, value, code)
        {
            DetailsDescription = details;
        }

        /// <summary>
        ///     Gets or sets the code.
        /// </summary>
        /// <value>
        ///     The code.
        /// </value>
        public string? Code { get; set; }

        /// <summary>
        ///     Gets or sets the details description.
        /// </summary>
        /// <value>
        ///     The details description.
        /// </value>
        public string? DetailsDescription { get; set; }

        /// <summary>
        ///     Gets or sets the type of the response message.
        /// </summary>
        /// <value>
        ///     The type of the response message.
        /// </value>
        public ResponseMessageType ResponseMessageType { get; set; }

        /// <summary>
        ///     Gets or sets the value.
        /// </summary>
        /// <value>
        ///     The value.
        /// </value>
        public string Value { get; set; }
    }
}
