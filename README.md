# VAAdminPortal

## Microsoft Entra Cookie/OIDC Authentication

The ASP.NET Core backend handles Microsoft sign-in through OpenID Connect and
stores the session in an encrypted HttpOnly cookie. React does not store access
tokens or request the `access_as_user` scope. The API validates the authentication
cookie, CSRF token, and email allowlist in `authorizedUsers.json`.

Configure the app registration in the Microsoft Entra admin center:

1. Under Supported account types, select **Accounts in any organizational directory**
   (Multitenant).
2. Under Authentication, add the **Web** platform and the following redirect URIs:
   - Local: `https://localhost:7199/signin-oidc`
   - Production:
     `https://vaadminportal-e0gddca4argnged8.westus3-01.azurewebsites.net/signin-oidc`
3. Add a front-channel logout URL (optional):
   `https://vaadminportal-e0gddca4argnged8.westus3-01.azurewebsites.net/signout-oidc`.
4. Under Certificates & secrets, create a client secret.
5. The previous SPA platform, SPA redirect URI, and `access_as_user` scope are no
   longer used. Remove them after confirming that no other clients depend on them.

The backend Entra configuration is in `src\VAAdminPortalAPI\appsettings.json`:

```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "organizations",
    "ClientId": "0a41b070-52fd-47fb-9292-5409acf66b45",
    "CallbackPath": "/signin-oidc",
    "SignedOutCallbackPath": "/signout-callback-oidc"
  }
}
```

In Azure App Service environment variables, use `client_secret` as the key and
the secret value as its value. The application injects it into `AzureAd:ClientSecret`
at startup; the secret is not stored in source code.

For local development, use environment variables or .NET User Secrets:

```powershell
dotnet user-secrets set "AzureAd:ClientSecret" "<secret>" `
  --project .\src\VAAdminPortalAPI\VAAdminPortalAPI.csproj
dotnet run --project .\src\VAAdminPortalAPI\VAAdminPortalAPI.csproj `
  --launch-profile https
```

## API Allowlist

The allowlist file is `src\VAAdminPortalAPI\authorizedUsers.json`:

```json
{
  "AuthorizedUsers": {
    "Emails": [
      "v-jiaxc@microsoft.com",
      "jiaxin@rtsavengers.onmicrosoft.com"
    ]
  }
}
```

Authorization performs a case-insensitive exact match against the OIDC identity's
`preferred_username`, UPN, or email claim. Administrators can rename or reassign
email addresses and UPNs, so update the allowlist whenever an account changes.
File changes are automatically reloaded while the application is running. Azure
Web App deployments overwrite the current file with the version in the deployment
package. To persist allowlist changes, update the source file and redeploy.

## Multitenant Consent

Sign-in always displays the account selection page. The backend requests only the
basic identity scopes required for OIDC sign-in, not custom API scopes. If the
target tenant prohibits users from consenting to external multitenant applications,
its administrator may still need to approve the application. This is a security
policy of the target tenant and cannot be bypassed through application code.

If the sign-in callback fails, the page displays a trace ID, and the server logs
the full OIDC exception. Search for the trace ID in the App Service **Log stream**
in the Azure portal. Common causes include setting `client_secret` to the secret
ID instead of the secret value, using an expired secret, or using a secret that
belongs to a different app registration.

## Teams Graph Data Source

The portal backend selects the authentication tenant using the signed-in identity's `tid`.
It uses the Teams Developer Portal application identity and
`AppStudioFirstPartyCertificate` to obtain an app-only token, then calls the
Teams Graph endpoint directly. Table queries request exactly one matching,
globally ordered page:

```text
GET {Tgs:BaseUrl}/v1.0/aiVirtualAssistants/allTenants?pageIndex=0&pageSize=10&validationStatus=Passed&verification=Validated&fullyPassed=true
```

TGS returns `{value: [...], totalCount: 125, pageIndex: 0, pageSize: 10}` with no
cursor fields. Portal's `POST /Admin/GetAiVirtualAssistantRegistrations` accepts
the same query parameters and returns its usual response envelope with
`model: {registrations: [...], totalCount, pageIndex, pageSize}`. `pageIndex` is
zero-based (default `0`); `pageSize` is `1..100` (default `10`). `pageSize=0`
is no longer supported on the table endpoint. Invalid pagination, enum/boolean
filters, verification values, or reversed date ranges return HTTP 400.

Optional filters are `startDate`, `endDate`, `searchTerm`, `validationStatus`,
`verification` (`Registered` or `Validated`), and `fullyPassed`. Date bounds are
inclusive; only supplied, nonblank filters are sent to TGS. Omit a filter to
select "All". The portal does not enumerate, filter, sort, slice, or recount
registrations for table requests, and does not fall back to an all-data read if
the paged TGS contract is unavailable. Query and page changes each make one paged
table request.

Global overview and notifications remain independent of table queries:

- `POST /Admin/GetAllOverview` retains the legacy TGS `$top=100`/`$skiptoken`
  enumeration and applies only its own inclusive date bounds for aggregation.
- `POST /Admin/GetNotificationRegistrations` explicitly loads all registrations
  through that legacy path, without table filters. Notifications load on dashboard
  entry, explicit notification refresh, and action completion.
- Action completion reloads the submitted table query/page plus overview and
  notifications independently.
- The hidden mock Copilot launcher stays hidden. Its filtered analysis data is
  loaded only when opened or explicitly reloaded (and after actions while open),
  using server-filtered numbered pages of up to 100. Query invalidates that data
  without fetching it. Notification data is separate. Analysis rejects visibly
  incomplete/changing pages, but page-number pagination is not a transactional
  snapshot if registrations change during enumeration.

Authenticated request examples, including validation errors, are in
`src\VAAdminPortalAPI\VAAdminPortalAPI.http`.

The default configuration targets Internal DEV:

```json
{
  "Tgs": {
    "AuthenticationMode": "ClientCertificate",
    "BaseUrl": "https://dev.teamsgraph.teams.microsoft.net",
    "Audience": "ab3be6b7-f5df-413d-ac2d-abf1e3fd9c0b",
    "Authority": "https://login.microsoftonline.com/",
    "ClientId": "e1979c22-8b73-4aed-a4da-572cc4d0b832",
    "CertificateName": "AppStudioFirstPartyCertificate",
    "SendX5C": true
  }
}
```

The TGS access mode is explicitly selected through configuration:

| Setting | Local TGS | DEV TGS |
|---|---|---|
| `Tgs:AuthenticationMode` | `DevelopmentAccessToken` | `ClientCertificate` |
| `Tgs:BaseUrl` | `https://localhost:8450` | `https://dev.teamsgraph.teams.microsoft.net` |
| Token source | LocalTokenGenerator | TDP Client ID + `AppStudioFirstPartyCertificate` |
| Key Vault identity | Not used | The managed identity of the resource hosting Admin Portal |

When Agent Onboarding TGS runs locally at `https://localhost:8450`, use the
LocalTokenGenerator provided by the Teams Graph repository to generate a test
token. The Microsoft tenant does not support this local token flow. Use a test
tenant where application provisioning and consent have been completed:

```powershell
Set-Location Q:\jiaxin_src\teams-graphservice
.\Source\Tools\TokenGenerator\SetupTokenGenerator.ps1

.\Development\Microsoft.Internal.Teams.LocalTokenGenerator\tools\win-x64\LocalTokenGenerator.exe `
  --TokenContext Application `
  --TokenFormat Bearer `
  --TenantId <test-tenant-id> `
  --ConfigFile .\Source\Tools\TokenGenerator\LocalTokenGenerator\Configs\TeamsGraphServiceLocal1P.json

$env:Tgs__DevelopmentAccessToken = '<paste the generated Bearer token>'
```

`Tgs:DevelopmentAccessToken` is effective only in the Development environment and
must not be stored in configuration files or deployment environments. Regenerate
the local token when it expires. Deployed environments that access remote TGS
continue to obtain app-only tokens using `AppStudioFirstPartyCertificate` and
managed identity.

When deploying to App Service, use managed identity to access the Key Vault for
the deployment environment, and set:

```text
Tgs__AuthenticationMode=ClientCertificate
Tgs__BaseUrl=https://dev.teamsgraph.teams.microsoft.net
Tgs__KeyVaultUri=https://<vault-name>.vault.azure.net/
```

For a user-assigned managed identity, also set `Tgs__ManagedIdentityClientId`.
This setting is not required for a system-assigned identity. You must use the
managed identity of the resource hosting Admin Portal. The ID
`36cace20-243f-4436-9091-8526728b27c3` documented in the TDP DEV repository is the
object ID of the TDP Cosmic Pod Identity. It does not belong to Admin Portal and
is not a client ID that can be used for this setting.

To access remote TGS from a local machine in `ClientCertificate` mode, use the
TDP Key Vault bootstrap certificate to create a `ClientCertificateCredential`.
The local certificate is not installed in the deployment environment.
The registration, app, tenant, contact, and legal entity fields displayed on the
page come from Teams Graph, including nullable `agreementAcceptedDateTime` and
`agreementAcceptedBy`. Validation status and failure reason are preserved; an omitted
validation status defaults to `NotStarted`. The portal's `verified`, `fullyPassed`
filter, and fully verified counts use the authoritative TGS `verification` value
`Validated` (case-insensitive), not validation status alone. TGS returns `Validated`
only when validation has passed, the agreement acceptance timestamp is nonnull and
nondefault, and the signer is a valid email address; otherwise it returns `Registered`.

`ApproveValidation` calls the admin endpoint using the registration's tenant and ID:

```text
PUT {Tgs:BaseUrl}/v1.0/admin/tenants/{tenantId}/aiVirtualAssistants/{id}/validationStatus
Content-Type: application/json

"Passed"
```

The request body is a raw JSON string, not an object. The signed-in tenant is still
used for authentication. `ApproveRegistration`, `RejectRegistration`, and
`ResetValidation` remain mock-only actions: they change validation in the in-memory
fixtures, not TGS, and recompute mock verification using the agreement rules above.
They do not create or change agreement acceptance. Live reads always use TGS.
