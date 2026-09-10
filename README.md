# VAAdminPortal

## Microsoft Entra Cookie/OIDC 登录

ASP.NET Core 后端通过 OpenID Connect 完成 Microsoft 登录，并使用加密的
HttpOnly Cookie 保存会话。React 不保存 Access Token，也不再请求
`access_as_user` Scope。API 同时校验登录 Cookie、CSRF Token 和
`authorizedUsers.json` 邮箱白名单。

在 Microsoft Entra admin center 中配置 App Registration：

1. Supported account types 选择 **Accounts in any organizational directory**
   （Multitenant）。
2. Authentication 中添加 **Web** 平台及 Redirect URI：
   - 本地：`https://localhost:7199/signin-oidc`
   - 生产：
     `https://vaadminportal-e0gddca4argnged8.westus3-01.azurewebsites.net/signin-oidc`
3. 添加 Front-channel logout URL（可选）：
   `https://vaadminportal-e0gddca4argnged8.westus3-01.azurewebsites.net/signout-oidc`。
4. Certificates & secrets 中创建 Client Secret。
5. 原 SPA 平台、SPA Redirect URI 和 `access_as_user` Scope 已不再使用，
   确认没有其他客户端依赖后可以移除。

后端 Entra 配置位于 `src\VAAdminPortalAPI\appsettings.json`：

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

Azure App Service 的环境变量中使用 `client_secret` 作为 Key，Secret Value
作为值。应用启动时将其注入 `AzureAd:ClientSecret`，不会把 Secret 写入源码。

本地开发可使用环境变量，或使用 .NET User Secrets：

```powershell
dotnet user-secrets set "AzureAd:ClientSecret" "<secret>" `
  --project .\src\VAAdminPortalAPI\VAAdminPortalAPI.csproj
dotnet run --project .\src\VAAdminPortalAPI\VAAdminPortalAPI.csproj `
  --launch-profile https
```

## API 白名单

白名单文件是 `src\VAAdminPortalAPI\authorizedUsers.json`：

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

授权对 OIDC 身份中的 `preferred_username`、UPN 或 Email Claim 进行不区分
大小写的精确匹配。邮箱/UPN 可能被管理员重命名或重新分配；发生账号变更时必须
同步更新白名单。文件变更会在应用运行时自动重新加载。Azure Web App 部署会用
发布包中的文件覆盖当前文件，因此持久的白名单修改应同步到源代码并重新部署。

## 多租户同意

登录会强制显示账号选择页面。后端只请求 OIDC 登录所需的基础身份 Scope，不再
请求自定义 API Scope。目标租户如果禁止用户同意外部多租户应用，仍可能要求该
租户管理员批准应用；这是目标租户的安全策略，无法通过应用代码绕过。

登录回调失败时，页面会显示 Trace ID，服务端同时记录完整 OIDC 异常。在 Azure
Portal 的 App Service **Log stream** 中按 Trace ID 查找。常见原因包括
`client_secret` 填写了 Secret ID 而不是 Value、Secret 已过期，或者 Secret
属于其他 App Registration。
