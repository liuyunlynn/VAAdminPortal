using VAAdminPortalAPI.Models;

namespace VAAdminPortalAPI.Services
{
    public interface IAdminService
    {
        Task<AiVirtualAssistantRegistrationListModel> GetAiVirtualAssistantRegistrationsAsync(
            string tenantId,
            AiVirtualAssistantRegistrationQueryModel queryModel,
            CancellationToken cancellationToken);

        Task<IReadOnlyList<AiVirtualAssistantRegistrationModel>> GetNotificationRegistrationsAsync(
            string tenantId,
            CancellationToken cancellationToken);

        Task<AllOverviewModel> GetAllOverviewAsync(
            string tenantId,
            AiVirtualAssistantRegistrationQueryModel queryModel,
            CancellationToken cancellationToken);

        Task<AiVirtualAssistantRegistrationModel?> ApplyRegistrationActionAsync(
            string authenticationTenantId,
            RegistrationActionModel actionModel,
            CancellationToken cancellationToken);
    }
}
