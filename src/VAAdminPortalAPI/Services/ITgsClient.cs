using VAAdminPortalAPI.Models;

namespace VAAdminPortalAPI.Services
{
    public interface ITgsClient
    {
        Task<IReadOnlyList<AiVirtualAssistantRegistrationModel>> GetAiVirtualAssistantsAsync(
            string tenantId,
            CancellationToken cancellationToken);

        Task<AiVirtualAssistantRegistrationModel> UpdateValidationStatusAsync(
            string authenticationTenantId,
            string targetTenantId,
            string registrationId,
            ValidationStatus status,
            CancellationToken cancellationToken);
    }
}
