using Microsoft.AspNetCore.Mvc;
using VAAdminPortalAPI.Base;
using VAAdminPortalAPI.Models;
using VAAdminPortalAPI.Services;

namespace VAAdminPortalAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
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
            var adminInfo = _adminService.GetAdminInfoModel(id);
            var response = new Response<AdminInfoModel>(adminInfo);
            return Ok(response);
        }

        
    }
}
