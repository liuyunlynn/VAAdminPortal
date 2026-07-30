namespace VAAdminPortalAPI.Base
{
    public class Response<TModel> : IResponse
    {
        #region Constructors

        /// <summary>
        ///     Initializes a new instance of the <see cref="Response" /> class.
        /// </summary>
        public Response(TModel model)
        {
            this.Model = model;
            ResponseMessages = new List<ResponseMessageModel>();
        }

        #endregion

        #region Properties


        public TModel? Model { get; }

        /// <summary>
        ///     Gets a value indicating whether this instance has error.
        /// </summary>
        /// <value>
        ///     <c>True</c> if this instance has error; otherwise, <c>False</c>.
        /// </value>
        public bool HasError
        {
            get
            {
                return ResponseMessages.Any(m => m.ResponseMessageType == ResponseMessageType.Error);
            }
        }

        /// <summary>
        ///     Gets a value indicating whether this instance has warning.
        /// </summary>
        /// <value>
        ///     <c>True</c> if this instance has warning; otherwise, <c>False</c>.
        /// </value>
        public bool HasWarning
        {
            get
            {
                return ResponseMessages.Any(m => m.ResponseMessageType == ResponseMessageType.Warning);
            }
        }

        /// <summary>
        ///     Gets or sets response messages.
        /// </summary>
        /// <value>
        ///     A list of response messages.
        /// </value>
        public List<ResponseMessageModel> ResponseMessages { get; set; }

        #endregion
    }
}
