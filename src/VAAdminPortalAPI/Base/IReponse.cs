namespace VAAdminPortalAPI.Base
{
    public interface IResponse
    {
        #region Properties

        /// <summary>
        ///     Gets a value indicating whether this instance has error.
        /// </summary>
        /// <value>
        ///     <c>True</c> if this instance has error; otherwise, <c>False</c>.
        /// </value>
        bool HasError { get; }

        /// <summary>
        ///     Gets a value indicating whether this instance has warning.
        /// </summary>
        /// <value>
        ///     <c>true</c> if this instance has warning; otherwise, <c>false</c>.
        /// </value>
        bool HasWarning { get; }

        /// <summary>
        ///     Gets response messages.
        /// </summary>
        /// <value>
        ///     A list of response messages.
        /// </value>
        List<ResponseMessageModel> ResponseMessages { get; }

        #endregion
    }
}
