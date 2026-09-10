namespace VAAdminPortalAPI.Authorization;

public sealed class AuthorizedUsersOptions
{
    public const string SectionName = "AuthorizedUsers";

    public List<string> Emails { get; set; } = [];
}
