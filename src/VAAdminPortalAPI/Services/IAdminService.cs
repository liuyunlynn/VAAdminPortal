using VAAdminPortalAPI.Models;

namespace VAAdminPortalAPI.Services
{
    public interface IAdminService
    {
        AdminInfoModel GetAdminInfo(string id);

        AiVirtualAssistantRegistrationListModel GetAiVirtualAssistantRegistrations(AiVirtualAssistantRegistrationQueryModel queryModel);

        AllOverviewModel GetAllOverview(AiVirtualAssistantRegistrationQueryModel queryModel);
    }
}
