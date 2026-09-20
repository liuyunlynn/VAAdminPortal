using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VAAdminPortalAPI.Authorization;
using VAAdminPortalAPI.Base;
using VAAdminPortalAPI.Models;

namespace VAAdminPortalAPI.Controllers;

[ApiController]
[Route("auth")]
public sealed class AuthController : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("login")]
    public IActionResult Login([FromQuery] string? returnUrl = null)
    {
        var redirectUri = Url.IsLocalUrl(returnUrl) ? returnUrl : "/dashboard";
        return Challenge(
            new AuthenticationProperties { RedirectUri = redirectUri },
            OpenIdConnectDefaults.AuthenticationScheme);
    }

    [Authorize(Policy = AuthorizationPolicies.WhitelistedUser)]
    [HttpGet("me")]
    public ActionResult GetCurrentUser()
    {
        return Ok(new Response<AdminInfoModel>(CreateAdminInfo()));
    }

    [Authorize(Policy = AuthorizationPolicies.WhitelistedUser)]
    [HttpGet("antiforgery")]
    public IActionResult GetAntiforgeryToken([FromServices] IAntiforgery antiforgery)
    {
        var tokens = antiforgery.GetAndStoreTokens(HttpContext);
        return Ok(new { token = tokens.RequestToken });
    }

    [Authorize]
    [HttpGet("logout")]
    public IActionResult Logout()
    {
        return SignOut(
            new AuthenticationProperties { RedirectUri = "/" },
            CookieAuthenticationDefaults.AuthenticationScheme,
            OpenIdConnectDefaults.AuthenticationScheme);
    }

    private AdminInfoModel CreateAdminInfo()
    {
        return new AdminInfoModel
        {
            Id = GetClaim("oid", "http://schemas.microsoft.com/identity/claims/objectidentifier"),
            Name = GetClaim("name", System.Security.Claims.ClaimTypes.Name),
            Email = GetClaim(
                "preferred_username",
                "upn",
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn",
                System.Security.Claims.ClaimTypes.Email)
        };
    }

    private string GetClaim(params string[] claimTypes)
    {
        return claimTypes
            .Select(User.FindFirst)
            .FirstOrDefault(claim => claim is not null)
            ?.Value ?? string.Empty;
    }
}
