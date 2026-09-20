using VAAdminPortalAPI.Models;

namespace VAAdminPortalAPI.Services
{
    public interface ITgsClient
    {
        Task<IReadOnlyList<AiVirtualAssistantRegistrationModel>> GetAiVirtualAssistantsAsync(
            string tenantId,
            CancellationToken cancellationToken);
    }
}
