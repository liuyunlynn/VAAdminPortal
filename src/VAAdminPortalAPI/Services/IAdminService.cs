using VAAdminPortalAPI.Models;

namespace VAAdminPortalAPI.Services
{
    public interface IAdminService
    {
        AdminInfoModel GetAdminInfo(string id);

        IList<AiVirtualAssistantRegistrationModel> GetAiVirtualAssistantRegistrations(AiVirtualAssistantRegistrationQueryModel queryModel);
    }
}
