using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using VAAdminPortalAPI.Models;

namespace VAAdminPortalAPI.Services
{
    public sealed class TgsClient : ITgsClient
    {
        private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
        {
            PropertyNameCaseInsensitive = true,
            Converters = { new JsonStringEnumConverter() }
        };

        private readonly IHttpClientFactory httpClientFactory;
        private readonly TgsOptions options;
        private readonly ITgsAccessTokenProvider tokenProvider;

        public TgsClient(
            IHttpClientFactory httpClientFactory,
            IOptions<TgsOptions> options,
            ITgsAccessTokenProvider tokenProvider)
        {
            this.httpClientFactory = httpClientFactory;
            this.options = options.Value;
            this.tokenProvider = tokenProvider;
        }

        public async Task<IReadOnlyList<AiVirtualAssistantRegistrationModel>> GetAiVirtualAssistantsAsync(
            string tenantId,
            CancellationToken cancellationToken)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(tenantId);

            string accessToken = await tokenProvider
                .GetAccessTokenAsync(tenantId, cancellationToken)
                .ConfigureAwait(false);

            HttpClient httpClient = httpClientFactory.CreateClient(nameof(TgsClient));
            Uri baseUri = new(options.BaseUrl.TrimEnd('/') + "/");
            List<AiVirtualAssistantRegistrationModel> registrations = [];
            HashSet<string> visitedContinuationTokens = new(StringComparer.Ordinal);
            string? continuationToken = null;

            do
            {
                string relativeUri = "v1.0/aiVirtualAssistants/allTenants?$top=100";
                if (!string.IsNullOrEmpty(continuationToken))
                {
                    relativeUri += $"&$skiptoken={Uri.EscapeDataString(continuationToken)}";
                }

                using HttpRequestMessage request = new(HttpMethod.Get, new Uri(baseUri, relativeUri));
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

                using HttpResponseMessage response = await httpClient
                    .SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken)
                    .ConfigureAwait(false);
                if (!response.IsSuccessStatusCode)
                {
                    string responseBody = await response.Content
                        .ReadAsStringAsync(cancellationToken)
                        .ConfigureAwait(false);
                    throw new HttpRequestException(
                        $"Teams Graph returned {(int)response.StatusCode} ({response.ReasonPhrase}). {responseBody}",
                        inner: null,
                        response.StatusCode);
                }

                TgsRegistrationPage page = await response.Content
                    .ReadFromJsonAsync<TgsRegistrationPage>(SerializerOptions, cancellationToken)
                    .ConfigureAwait(false)
                    ?? throw new JsonException("Teams Graph returned an empty registration page.");

                registrations.AddRange(page.Value);
                continuationToken = page.ContinuationToken;
                if (!string.IsNullOrEmpty(continuationToken) &&
                    !visitedContinuationTokens.Add(continuationToken))
                {
                    throw new JsonException("Teams Graph returned a repeated continuation token.");
                }
            }
            while (!string.IsNullOrEmpty(continuationToken));

            foreach (AiVirtualAssistantRegistrationModel registration in registrations)
            {
                NormalizeRegistrationFields(registration);
            }

            return registrations;
        }

        public async Task<AiVirtualAssistantRegistrationModel> UpdateValidationStatusAsync(
            string authenticationTenantId,
            string targetTenantId,
            string registrationId,
            ValidationStatus status,
            CancellationToken cancellationToken)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(authenticationTenantId);
            ArgumentException.ThrowIfNullOrWhiteSpace(targetTenantId);
            ArgumentException.ThrowIfNullOrWhiteSpace(registrationId);

            string accessToken = await tokenProvider
                .GetAccessTokenAsync(authenticationTenantId, cancellationToken)
                .ConfigureAwait(false);

            HttpClient httpClient = httpClientFactory.CreateClient(nameof(TgsClient));
            Uri baseUri = new(options.BaseUrl.TrimEnd('/') + "/");
            string relativeUri =
                $"v1.0/admin/tenants/{Uri.EscapeDataString(targetTenantId)}/aiVirtualAssistants/{Uri.EscapeDataString(registrationId)}/validationStatus";
            using HttpRequestMessage request = new(HttpMethod.Put, new Uri(baseUri, relativeUri));
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            request.Content = JsonContent.Create(status.ToString());

            using HttpResponseMessage response = await httpClient
                .SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken)
                .ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
            {
                string responseBody = await response.Content
                    .ReadAsStringAsync(cancellationToken)
                    .ConfigureAwait(false);
                throw new HttpRequestException(
                    $"Teams Graph returned {(int)response.StatusCode} ({response.ReasonPhrase}). {responseBody}",
                    inner: null,
                    response.StatusCode);
            }

            AiVirtualAssistantRegistrationModel registration = await response.Content
                .ReadFromJsonAsync<AiVirtualAssistantRegistrationModel>(SerializerOptions, cancellationToken)
                .ConfigureAwait(false)
                ?? throw new JsonException("Teams Graph returned an empty registration.");

            NormalizeRegistrationFields(registration);
            return registration;
        }

        private sealed class TgsRegistrationPage
        {
            public List<AiVirtualAssistantRegistrationModel> Value { get; init; } = [];

            public string? ContinuationToken { get; init; }
        }

        private static void NormalizeRegistrationFields(AiVirtualAssistantRegistrationModel registration)
        {
            registration.LegalEntity ??= new LegalEntityModel();
            registration.PrimaryContact ??= new PrimaryContactModel();
            registration.TechnicalContact ??= new ContactModel();
            registration.ProgramManagerContact ??= new ContactModel();
        }
    }
}
