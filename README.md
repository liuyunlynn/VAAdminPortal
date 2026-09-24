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
      "xxx",
      "xxx"
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
It obtains an app-only token for the Admin Portal app registration
(`0a41b070-52fd-47fb-9292-5409acf66b45`) in that tenant, then calls the existing
Teams Graph endpoint directly:

```text
GET {Tgs:BaseUrl}/v1.0/aiVirtualAssistants/allTenants?$top=100
```

No client secret or certificate is used for TGS. The App Service system-assigned
managed identity acts as a federated identity credential (FIC) of the Admin Portal
app registration:

1. The backend requests a managed identity token for `api://AzureADTokenExchange`.
2. MSAL uses that token as the client assertion for the Admin Portal app and
   acquires `{Tgs:Audience}/.default` with the signed-in identity's tenant ID.
3. The resulting token's `appid`/`azp` is the Admin Portal app ID, not the managed
   identity ID. TGS allowlisting, app role assignment, and tenant admin consent
   therefore apply to the Admin Portal app.

Configure the FIC on the Admin Portal app registration under
**Certificates & secrets** > **Federated credentials**:

| Field | Value |
|---|---|
| Issuer | `https://login.microsoftonline.com/<app-tenant-id>/v2.0` |
| Subject | Object (principal) ID of the App Service system-assigned managed identity |
| Audience | `api://AzureADTokenExchange` |

The managed identity and the app registration must belong to the same tenant.
Disabling and re-enabling the system-assigned identity, recreating the App Service,
or adding deployment slots produces new principal IDs, and each one needs its own
FIC entry.

The default configuration targets Internal DEV:

```json
{
  "Tgs": {
    "AuthenticationMode": "ManagedIdentity",
    "BaseUrl": "https://dev.teamsgraph.teams.microsoft.net",
    "Audience": "ab3be6b7-f5df-413d-ac2d-abf1e3fd9c0b",
    "Authority": "https://login.microsoftonline.com/",
    "ClientId": "0a41b070-52fd-47fb-9292-5409acf66b45"
  }
}
```

The TGS access mode is explicitly selected through configuration:

| Setting | Local TGS | DEV TGS |
|---|---|---|
| `Tgs:AuthenticationMode` | `DevelopmentAccessToken` | `ManagedIdentity` |
| `Tgs:BaseUrl` | `https://localhost:8450` | `https://dev.teamsgraph.teams.microsoft.net` |
| Token source | LocalTokenGenerator | Admin Portal app + system-assigned managed identity FIC |

When Agent Onboarding TGS runs locally at `https://localhost:8450`, use the
LocalTokenGenerator provided by the Teams Graph repository to generate a test
token. The Microsoft tenant does not support this local token flow. Use a test
tenant where application provisioning and consent have been completed:

```powershell
Set-Location Q:\xxx\teams-graphservice
.\Source\Tools\TokenGenerator\SetupTokenGenerator.ps1

.\Development\Microsoft.Internal.Teams.LocalTokenGenerator\tools\win-x64\LocalTokenGenerator.exe `
  --TokenContext Application `
  --TokenFormat ******
  --TenantId <test-tenant-id> `
  --ConfigFile .\Source\Tools\TokenGenerator\LocalTokenGenerator\Configs\TeamsGraphServiceLocal1P.json

$env:Tgs__DevelopmentAccessToken = '<paste the generated ******'
```

`Tgs:DevelopmentAccessToken` is effective only in the Development environment and
must not be stored in configuration files or deployment environments. Regenerate
the local token when it expires.

`ManagedIdentity` mode requires a managed identity endpoint and therefore works
only when running in App Service. When deploying, enable the system-assigned
identity on the App Service and set:

```text
Tgs__AuthenticationMode=ManagedIdentity
Tgs__BaseUrl=https://dev.teamsgraph.teams.microsoft.net
```
The registration, app, tenant, contact, legal entity, validation status, and
validation failure reason displayed on the page come from Teams Graph. Missing
validation status defaults to `NotStarted`; the portal does not fabricate statuses.
Agreement acceptance is exposed as `agreementAcceptedDateTime` and
`agreementAcceptedBy`. Verification uses the authoritative TGS `verification`
value (`Registered` or `Validated`), not technical validation alone: `Validated`
requires passed validation and valid agreement acceptance.

Validation approval calls the admin endpoint using the registration's tenant ID:

```text
PUT {Tgs:BaseUrl}/v1.0/admin/tenants/{tenantId}/aiVirtualAssistants/{registrationId}/validationStatus
Content-Type: application/json

"Passed"
```

The body is a raw JSON string, not an object. Authentication still uses the
signed-in tenant. The portal action body includes `registrationId`, `tenantId`,
`action`, and a required `reason`. Other actions remain mock-backed; they update
validation only and recompute mock verification from validation and agreement
acceptance. Legal review statuses and NDA numbers are no longer part of the model.
