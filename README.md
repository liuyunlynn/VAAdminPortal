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
It uses the Teams Developer Portal application identity and
`AppStudioFirstPartyCertificate` to obtain an app-only token, then calls the
existing Teams Graph endpoint directly:

```text
GET {Tgs:BaseUrl}/v1.0/aiVirtualAssistants/allTenants?$top=100
```

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
Set-Location Q:\xxx\teams-graphservice
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
