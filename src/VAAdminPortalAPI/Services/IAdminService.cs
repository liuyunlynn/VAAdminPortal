using VAAdminPortalAPI.Models;

namespace VAAdminPortalAPI.Services
{
    public interface IAdminService
    {
        AdminInfoModel GetAdminInfoModel(string id);

        IList<AiVirtualAssistantRegistrationModel> GetAiVirtualAssistantRegistrations(AiVirtualAssistantRegistrationQueryModel queryModel);
    }
}
