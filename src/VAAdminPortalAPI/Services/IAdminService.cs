using VAAdminPortalAPI.Models;

namespace VAAdminPortalAPI.Services
{
    public interface IAdminService
    {
        Task<AiVirtualAssistantRegistrationListModel> GetAiVirtualAssistantRegistrationsAsync(
            string tenantId,
            AiVirtualAssistantRegistrationQueryModel queryModel,
            CancellationToken cancellationToken);

        Task<AllOverviewModel> GetAllOverviewAsync(
            string tenantId,
            AiVirtualAssistantRegistrationQueryModel queryModel,
            CancellationToken cancellationToken);

        AiVirtualAssistantRegistrationModel? ApplyRegistrationAction(RegistrationActionModel actionModel);
    }
}
