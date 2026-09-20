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
                PopulatePortalOnlyFields(registration);
            }

            return registrations;
        }

        private sealed class TgsRegistrationPage
        {
            public List<AiVirtualAssistantRegistrationModel> Value { get; init; } = [];

            public string? ContinuationToken { get; init; }
        }

        private static void PopulatePortalOnlyFields(AiVirtualAssistantRegistrationModel registration)
        {
            int stableHash = GetStableHash(registration.Id);
            ValidationStatus[] validationStatuses = Enum.GetValues<ValidationStatus>();
            LegalStatus[] legalStatuses = Enum.GetValues<LegalStatus>();

            registration.ValidationStatus =
                validationStatuses[(int)((uint)stableHash % validationStatuses.Length)];
            registration.LegalStatus =
                legalStatuses[(int)((uint)(stableHash >> 8) % legalStatuses.Length)];
            registration.ValidationFailureReason =
                registration.ValidationStatus == ValidationStatus.Failed
                    ? "Synthetic portal status; Teams Graph does not provide a validation result."
                    : null;
            registration.LegalFailureReason =
                registration.LegalStatus == LegalStatus.Failed
                    ? "Synthetic portal status; Teams Graph does not provide a legal review result."
                    : null;
            registration.LegalEntity ??= new LegalEntityModel();
            registration.PrimaryContact ??= new PrimaryContactModel();
            registration.TechnicalContact ??= new ContactModel();
            registration.ProgramManagerContact ??= new ContactModel();
        }

        private static int GetStableHash(string value)
        {
            unchecked
            {
                int hash = 17;
                foreach (char character in value ?? string.Empty)
                {
                    hash = (hash * 31) + character;
                }

                return hash;
            }
        }
    }
}
