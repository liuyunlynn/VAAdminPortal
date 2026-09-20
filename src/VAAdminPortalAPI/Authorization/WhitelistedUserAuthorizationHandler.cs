using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace VAAdminPortalAPI.Authorization;

public static class AuthorizationPolicies
{
    public const string WhitelistedUser = "WhitelistedUser";
}

public sealed class WhitelistedUserRequirement : IAuthorizationRequirement;

public sealed class WhitelistedUserAuthorizationHandler(
    IOptionsMonitor<AuthorizedUsersOptions> authorizedUsers,
    ILogger<WhitelistedUserAuthorizationHandler> logger)
    : AuthorizationHandler<WhitelistedUserRequirement>
{
    private const string TenantIdClaim =
        "http://schemas.microsoft.com/identity/claims/tenantid";
    private const string ObjectIdClaim =
        "http://schemas.microsoft.com/identity/claims/objectidentifier";
    private const string UpnClaim =
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn";

    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        WhitelistedUserRequirement requirement)
    {
        var tenantId = GetClaim(context.User, "tid", TenantIdClaim);
        var objectId = GetClaim(context.User, "oid", ObjectIdClaim);
        var email = GetClaim(
            context.User,
            "preferred_username",
            "upn",
            UpnClaim,
            System.Security.Claims.ClaimTypes.Email);

        if (email is null)
        {
            logger.LogWarning("Authenticated user token is missing an email or UPN claim.");
            return Task.CompletedTask;
        }

        var isAuthorized = authorizedUsers.CurrentValue.Emails.Any(authorizedEmail =>
            string.Equals(authorizedEmail.Trim(), email, StringComparison.OrdinalIgnoreCase));

        if (isAuthorized)
        {
            context.Succeed(requirement);
        }
        else
        {
            logger.LogWarning(
                "Portal access denied for tenant {TenantId} and object {ObjectId}.",
                tenantId,
                objectId);
        }

        return Task.CompletedTask;
    }

    private static string? GetClaim(
        System.Security.Claims.ClaimsPrincipal principal,
        params string[] claimTypes)
    {
        return claimTypes
            .Select(principal.FindFirst)
            .FirstOrDefault(claim => claim is not null)
            ?.Value;
    }
}
