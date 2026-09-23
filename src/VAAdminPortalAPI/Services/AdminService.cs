using System.Text.Json;
using System.Text.Json.Serialization;
using System.Net.Mail;
using VAAdminPortalAPI.Models;

namespace VAAdminPortalAPI.Services
{
    public class AdminService : IAdminService
    {
        private readonly ITgsClient tgsClient;

        private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
        {
            PropertyNameCaseInsensitive = true,
            Converters = { new JsonStringEnumConverter() }
        };

        private static readonly Lazy<MockDataStore> DataStore = new(LoadMockData);

        public AdminService(ITgsClient tgsClient)
        {
            this.tgsClient = tgsClient;
        }

        public async Task<AiVirtualAssistantRegistrationListModel> GetAiVirtualAssistantRegistrationsAsync(
            string tenantId,
            AiVirtualAssistantRegistrationQueryModel queryModel,
            CancellationToken cancellationToken)
        {
            TgsRegistrationPageModel page =
                await tgsClient.GetAiVirtualAssistantsPageAsync(tenantId, queryModel, cancellationToken);
            return new AiVirtualAssistantRegistrationListModel
            {
                Registrations = page.Value,
                TotalCount = page.TotalCount,
                PageIndex = page.PageIndex,
                PageSize = page.PageSize
            };
        }

        public Task<IReadOnlyList<AiVirtualAssistantRegistrationModel>> GetNotificationRegistrationsAsync(
            string tenantId,
            CancellationToken cancellationToken)
        {
            return tgsClient.GetAiVirtualAssistantsAsync(tenantId, cancellationToken);
        }

        private static MockDataStore LoadMockData()
        {
            var path = Path.Combine(AppContext.BaseDirectory, "MockData", "mockData.json");
            using var stream = File.OpenRead(path);
            var data = JsonSerializer.Deserialize<MockDataStore>(stream, SerializerOptions);
            return data ?? new MockDataStore();
        }

        public async Task<AllOverviewModel> GetAllOverviewAsync(
            string tenantId,
            AiVirtualAssistantRegistrationQueryModel queryModel,
            CancellationToken cancellationToken)
        {
            IReadOnlyList<AiVirtualAssistantRegistrationModel> tgsRegistrations =
                await tgsClient.GetAiVirtualAssistantsAsync(tenantId, cancellationToken);
            IEnumerable<AiVirtualAssistantRegistrationModel> registrations =
                tgsRegistrations;

            if (queryModel.StartDate.HasValue)
            {
                registrations = registrations.Where(r => r.CreatedDateTime >= queryModel.StartDate.Value);
            }

            if (queryModel.EndDate.HasValue)
            {
                registrations = registrations.Where(r => r.CreatedDateTime <= queryModel.EndDate.Value);
            }

            var filteredRegistrations = registrations.ToList();

            return new AllOverviewModel
            {
                TotalRegistrationsCount = filteredRegistrations.Count,
                ValidationPassedCount = filteredRegistrations.Count(r => r.ValidationStatus == ValidationStatus.Passed),
                ValidationPendingCount = filteredRegistrations.Count(r => r.ValidationStatus == ValidationStatus.Pending),
                ValidationNotStartedCount = filteredRegistrations.Count(r => r.ValidationStatus == ValidationStatus.NotStarted),
                ValidationFailedCount = filteredRegistrations.Count(r => r.ValidationStatus == ValidationStatus.Failed),
                VerifiedCount = filteredRegistrations.Count(r => r.Verified),
                MonthlyRegistrations = filteredRegistrations
                    .GroupBy(r => new { r.CreatedDateTime.Year, r.CreatedDateTime.Month })
                    .OrderBy(group => group.Key.Year)
                    .ThenBy(group => group.Key.Month)
                    .Select(group => new MonthlyRegistrationOverviewModel
                    {
                        Month = $"{group.Key.Year:D4}-{group.Key.Month:D2}",
                        Registrations = group.Count(),
                        FullyPassed = group.Count(r => r.Verified)
                    })
                    .ToList()
            };
        }

        public async Task<AiVirtualAssistantRegistrationModel?> ApplyRegistrationActionAsync(
            string authenticationTenantId,
            RegistrationActionModel actionModel,
            CancellationToken cancellationToken)
        {
            if (actionModel.Action == RegistrationAction.ApproveValidation)
            {
                return await tgsClient.UpdateValidationStatusAsync(
                    authenticationTenantId,
                    actionModel.TenantId,
                    actionModel.RegistrationId,
                    ValidationStatus.Passed,
                    cancellationToken);
            }

            var registration = DataStore.Value.AiVirtualAssistantRegistrations
                .FirstOrDefault(r => r.Id == actionModel.RegistrationId);

            if (registration == null)
            {
                return null;
            }

            var failureReason = string.IsNullOrWhiteSpace(actionModel.Reason) ? null : actionModel.Reason;

            switch (actionModel.Action)
            {
                case RegistrationAction.ApproveRegistration:
                    registration.ValidationStatus = ValidationStatus.Passed;
                    registration.ValidationFailureReason = null;
                    break;
                case RegistrationAction.RejectRegistration:
                    registration.ValidationStatus = ValidationStatus.Failed;
                    registration.ValidationFailureReason = failureReason;
                    break;
                case RegistrationAction.ResetValidation:
                    registration.ValidationStatus = ValidationStatus.NotStarted;
                    registration.ValidationFailureReason = null;
                    break;
                default:
                    throw new ArgumentOutOfRangeException(nameof(actionModel.Action));
            }

            UpdateMockVerification(registration);
            return registration;
        }

        private static void UpdateMockVerification(AiVirtualAssistantRegistrationModel registration)
        {
            var signer = registration.AgreementAcceptedBy;
            registration.Verification =
                registration.ValidationStatus == ValidationStatus.Passed &&
                registration.AgreementAcceptedDateTime.HasValue &&
                registration.AgreementAcceptedDateTime.Value != default &&
                !string.IsNullOrWhiteSpace(signer) &&
                MailAddress.TryCreate(signer, out var address) &&
                string.Equals(address.Address, signer, StringComparison.Ordinal)
                    ? "Validated"
                    : "Registered";
        }

        private sealed class MockDataStore
        {
            [JsonPropertyName("adminInfo")]
            public AdminInfoModel AdminInfo { get; set; } = new AdminInfoModel();

            [JsonPropertyName("aiVirtualAssistantRegistrations")]
            public List<AiVirtualAssistantRegistrationModel> AiVirtualAssistantRegistrations { get; set; } = new();
        }
    }
}
