using Microsoft.AspNetCore.Mvc;
using VAAdminPortalAPI.Base;
using VAAdminPortalAPI.Models;
using VAAdminPortalAPI.Services;

namespace VAAdminPortalAPI.Controllers
{
    [ApiController]
    [Route("[controller]/[action]")]
    public class AdminController : Controller
    {

        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [HttpGet(Name = "GetAdminInformation")]
        public async Task<ActionResult> GetAdminInformation(string id)
        {
            var adminInfo = _adminService.GetAdminInfo(id);
            var response = new Response<AdminInfoModel>(adminInfo);
            return Ok(response);
        }

        [HttpPost(Name = "GetAiVirtualAssistantRegistrations")]
        public async Task<ActionResult> GetAiVirtualAssistantRegistrations([FromQuery]AiVirtualAssistantRegistrationQueryModel queryModel)
        {
            var registrations = _adminService.GetAiVirtualAssistantRegistrations(queryModel);
            var response = new Response<IList<AiVirtualAssistantRegistrationModel>>(registrations);
            return Ok(response);
        }
    }
}
