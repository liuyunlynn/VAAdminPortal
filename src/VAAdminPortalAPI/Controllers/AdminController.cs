using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VAAdminPortalAPI.Base;
using VAAdminPortalAPI.Authorization;
using VAAdminPortalAPI.Models;
using VAAdminPortalAPI.Services;

namespace VAAdminPortalAPI.Controllers
{
    [ApiController]
    [Route("[controller]/[action]")]
    [Authorize(Policy = AuthorizationPolicies.WhitelistedUser)]
    [AutoValidateAntiforgeryToken]
    public class AdminController : ControllerBase
    {

        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [HttpGet(Name = "GetAdminInformation")]
        public ActionResult GetAdminInformation()
        {
            var adminInfo = new AdminInfoModel
            {
                Id = GetClaim("oid", "http://schemas.microsoft.com/identity/claims/objectidentifier"),
                Name = GetClaim("name", System.Security.Claims.ClaimTypes.Name),
                Email = GetClaim(
                    "preferred_username",
                    "upn",
                    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn",
                    System.Security.Claims.ClaimTypes.Email)
            };
            var response = new Response<AdminInfoModel>(adminInfo);
            return Ok(response);
        }

        [HttpPost(Name = "GetAllOverview")]
        public ActionResult GetAllOverview(
            [FromQuery] AiVirtualAssistantRegistrationQueryModel queryModel)
        {
            var overview = _adminService.GetAllOverview(queryModel);
            var response = new Response<AllOverviewModel>(overview);
            return Ok(response);
        }

        [HttpPost(Name = "GetAiVirtualAssistantRegistrations")]
        public ActionResult GetAiVirtualAssistantRegistrations([FromQuery]AiVirtualAssistantRegistrationQueryModel queryModel)
        {
            var registrations = _adminService.GetAiVirtualAssistantRegistrations(queryModel);
            var response = new Response<AiVirtualAssistantRegistrationListModel>(registrations);
            return Ok(response);
        }

        [HttpPost(Name = "ApplyRegistrationAction")]
        public ActionResult ApplyRegistrationAction([FromBody] RegistrationActionModel actionModel)
        {
            if (string.IsNullOrWhiteSpace(actionModel.Reason))
            {
                return BadRequest("A reason is required.");
            }

            var registration = _adminService.ApplyRegistrationAction(actionModel);
            if (registration == null)
            {
                return NotFound();
            }

            var response = new Response<AiVirtualAssistantRegistrationModel>(registration);
            return Ok(response);
        }

        private string GetClaim(params string[] claimTypes)
        {
            return claimTypes
                .Select(User.FindFirst)
                .FirstOrDefault(claim => claim is not null)
                ?.Value ?? string.Empty;
        }
    }
}
