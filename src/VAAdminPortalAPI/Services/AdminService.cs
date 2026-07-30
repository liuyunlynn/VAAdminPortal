using VAAdminPortalAPI.Models;

namespace VAAdminPortalAPI.Services
{
    public class AdminService: IAdminService
    {
        public AdminInfoModel GetAdminInfoModel(string id)
        {
            var adminInfo = new AdminInfoModel
            {
                Id = id,
                Name = "John Doe",
                Email = "johndoe@example.com"
            };

            return adminInfo;
        }

        public IList<AiVirtualAssistantRegistrationModel> GetAiVirtualAssistantRegistrations(AiVirtualAssistantRegistrationQueryModel queryModel)
        {
            throw new NotImplementedException();
        }
    }
}
