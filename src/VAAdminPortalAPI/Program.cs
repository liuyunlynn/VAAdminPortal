using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Identity.Web;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using VAAdminPortalAPI.Authorization;

namespace VAAdminPortalAPI
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Configuration.AddJsonFile(
                "authorizedUsers.json",
                optional: false,
                reloadOnChange: true);

            var clientSecret = Environment.GetEnvironmentVariable("client_secret");
            if (!string.IsNullOrWhiteSpace(clientSecret))
            {
                builder.Configuration["AzureAd:ClientSecret"] = clientSecret;
            }

            if (string.IsNullOrWhiteSpace(builder.Configuration["AzureAd:ClientSecret"]))
            {
                throw new InvalidOperationException(
                    "Microsoft OIDC client secret is not configured. Set the client_secret environment variable.");
            }

            builder.Services.AddControllersWithViews();
            builder.Services.AddSameNameSameNamespaceServices(typeof(Program).Assembly);
            builder.Services
                .AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                    options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
                })
                .AddMicrosoftIdentityWebApp(builder.Configuration.GetSection("AzureAd"));
            builder.Services.Configure<OpenIdConnectOptions>(
                OpenIdConnectDefaults.AuthenticationScheme,
                options =>
                {
                    options.Prompt = "select_account";
                    options.ResponseType = OpenIdConnectResponseType.Code;
                    options.UsePkce = true;
                    options.SaveTokens = false;
                    options.Events.OnRemoteFailure = context =>
                    {
                        var logger = context.HttpContext.RequestServices
                            .GetRequiredService<ILogger<Program>>();
                        logger.LogError(
                            context.Failure,
                            "Microsoft OIDC callback failed. TraceId: {TraceId}",
                            context.HttpContext.TraceIdentifier);

                        context.HandleResponse();
                        var traceId = Uri.EscapeDataString(context.HttpContext.TraceIdentifier);
                        context.Response.Redirect(
                            $"/?authError=signin_failed&traceId={traceId}");
                        return Task.CompletedTask;
                    };
                });
            builder.Services.Configure<CookieAuthenticationOptions>(
                CookieAuthenticationDefaults.AuthenticationScheme,
                options =>
                {
                    options.Cookie.Name = "__Host-VAAdminPortal.Auth";
                    options.Cookie.HttpOnly = true;
                    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                    options.Cookie.SameSite = SameSiteMode.Lax;
                    options.ExpireTimeSpan = TimeSpan.FromHours(8);
                    options.SlidingExpiration = true;
                    options.Events.OnRedirectToLogin = context =>
                    {
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        return Task.CompletedTask;
                    };
                    options.Events.OnRedirectToAccessDenied = context =>
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        return Task.CompletedTask;
                    };
                });
            builder.Services.AddAntiforgery(options =>
            {
                options.HeaderName = "X-CSRF-TOKEN";
                options.Cookie.Name = "__Host-VAAdminPortal.Antiforgery";
                options.Cookie.HttpOnly = true;
                options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                options.Cookie.SameSite = SameSiteMode.Strict;
            });
            builder.Services
                .AddOptions<AuthorizedUsersOptions>()
                .Bind(builder.Configuration.GetSection(AuthorizedUsersOptions.SectionName))
                .Validate(
                    options => options.Emails.All(email =>
                        !string.IsNullOrWhiteSpace(email) &&
                        email.Contains('@', StringComparison.Ordinal)),
                    "Every authorized user must have a valid email address.")
                .ValidateOnStart();
            builder.Services.AddSingleton<IAuthorizationHandler, WhitelistedUserAuthorizationHandler>();
            builder.Services.AddAuthorization(options =>
            {
                options.AddPolicy(
                    AuthorizationPolicies.WhitelistedUser,
                    policy =>
                    {
                        policy.AuthenticationSchemes.Add(
                            CookieAuthenticationDefaults.AuthenticationScheme);
                        policy.RequireAuthenticatedUser();
                        policy.AddRequirements(new WhitelistedUserRequirement());
                    });
            });
            builder.Services.AddOpenApi();

            var app = builder.Build();

            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
                app.UseSwaggerUI(options =>
                {
                    options.SwaggerEndpoint("/openapi/v1.json", "VAAdminPortalAPI v1");
                });
            }

            app.UseHttpsRedirection();

            app.UseDefaultFiles();
            app.UseStaticFiles();

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            app.MapFallbackToFile("index.html");

            app.Run();
        }
    }
}
