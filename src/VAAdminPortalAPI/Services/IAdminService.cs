using VAAdminPortalAPI.Models;

namespace VAAdminPortalAPI.Services
{
    public interface IAdminService
    {
        AiVirtualAssistantRegistrationListModel GetAiVirtualAssistantRegistrations(AiVirtualAssistantRegistrationQueryModel queryModel);

        AllOverviewModel GetAllOverview(AiVirtualAssistantRegistrationQueryModel queryModel);

        AiVirtualAssistantRegistrationModel? ApplyRegistrationAction(RegistrationActionModel actionModel);
    }
}
