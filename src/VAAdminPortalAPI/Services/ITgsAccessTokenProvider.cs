namespace VAAdminPortalAPI.Services
{
    public interface ITgsAccessTokenProvider
    {
        Task<string> GetAccessTokenAsync(
            string tenantId,
            CancellationToken cancellationToken);
    }
}
