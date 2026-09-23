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
        public async Task<ActionResult> GetAllOverview(
            [FromQuery] AiVirtualAssistantRegistrationQueryModel queryModel,
            CancellationToken cancellationToken)
        {
            var overview = await _adminService.GetAllOverviewAsync(
                GetRequiredTenantId(),
                queryModel,
                cancellationToken);
            var response = new Response<AllOverviewModel>(overview);
            return Ok(response);
        }

        /// <summary>Returns one server-filtered, globally ordered page from Teams Graph.</summary>
        [HttpPost(Name = "GetAiVirtualAssistantRegistrations")]
        [ProducesResponseType(typeof(Response<AiVirtualAssistantRegistrationListModel>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult> GetAiVirtualAssistantRegistrations(
            [FromQuery] AiVirtualAssistantRegistrationQueryModel queryModel,
            CancellationToken cancellationToken)
        {
            var registrations = await _adminService.GetAiVirtualAssistantRegistrationsAsync(
                GetRequiredTenantId(),
                queryModel,
                cancellationToken);
            var response = new Response<AiVirtualAssistantRegistrationListModel>(registrations);
            return Ok(response);
        }

        /// <summary>Loads all registrations independently for global notifications, without table filters.</summary>
        [HttpPost(Name = "GetNotificationRegistrations")]
        [ProducesResponseType(typeof(Response<IReadOnlyList<AiVirtualAssistantRegistrationModel>>), StatusCodes.Status200OK)]
        public async Task<ActionResult> GetNotificationRegistrations(CancellationToken cancellationToken)
        {
            var registrations = await _adminService.GetNotificationRegistrationsAsync(
                GetRequiredTenantId(),
                cancellationToken);
            return Ok(new Response<IReadOnlyList<AiVirtualAssistantRegistrationModel>>(registrations));
        }

        [HttpPost(Name = "ApplyRegistrationAction")]
        public async Task<ActionResult> ApplyRegistrationAction(
            [FromBody] RegistrationActionModel actionModel,
            CancellationToken cancellationToken)
        {
            if (!Enum.IsDefined(actionModel.Action))
            {
                return BadRequest("A valid registration action is required.");
            }

            if (string.IsNullOrWhiteSpace(actionModel.Reason))
            {
                return BadRequest("A reason is required.");
            }

            if (string.IsNullOrWhiteSpace(actionModel.RegistrationId) ||
                string.IsNullOrWhiteSpace(actionModel.TenantId))
            {
                return BadRequest("A registration ID and tenant ID are required.");
            }

            var registration = await _adminService.ApplyRegistrationActionAsync(
                GetRequiredTenantId(),
                actionModel,
                cancellationToken);
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

        private string GetRequiredTenantId()
        {
            var tenantId = GetClaim(
                "tid",
                "http://schemas.microsoft.com/identity/claims/tenantid");
            if (string.IsNullOrWhiteSpace(tenantId))
            {
                throw new InvalidOperationException("The signed-in identity does not contain a tenant ID.");
            }

            return tenantId;
        }
    }
}
