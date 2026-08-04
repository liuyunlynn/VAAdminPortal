using System.Text.Json;
using System.Text.Json.Serialization;
using VAAdminPortalAPI.Models;

namespace VAAdminPortalAPI.Services
{
    public class AdminService : IAdminService
    {
        private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
        {
            PropertyNameCaseInsensitive = true,
            Converters = { new JsonStringEnumConverter() }
        };

        private static readonly Lazy<MockDataStore> DataStore = new(LoadMockData);

        public AdminInfoModel GetAdminInfo(string id)
        {
            var adminInfo = DataStore.Value.AdminInfo;

            if (!string.IsNullOrWhiteSpace(id))
            {
                adminInfo.Id = id;
            }

            return adminInfo;
        }

        public AiVirtualAssistantRegistrationListModel GetAiVirtualAssistantRegistrations(AiVirtualAssistantRegistrationQueryModel queryModel)
        {
            IEnumerable<AiVirtualAssistantRegistrationModel> query = DataStore.Value.AiVirtualAssistantRegistrations.OrderBy(r => r.CreatedDateTime);

            if (queryModel != null)
            {
                if (queryModel.StartDate.HasValue)
                {
                    query = query.Where(r => r.CreatedDateTime >= queryModel.StartDate.Value);
                }

                if (queryModel.EndDate.HasValue)
                {
                    query = query.Where(r => r.CreatedDateTime <= queryModel.EndDate.Value);
                }

                if (queryModel.ValidationStatus.HasValue)
                {
                    query = query.Where(r => r.ValidationStatus == queryModel.ValidationStatus.Value);
                }

                if (queryModel.LegalStatus.HasValue)
                {
                    query = query.Where(r => r.LegalStatus == queryModel.LegalStatus.Value);
                }

                if (queryModel.FullyPassed.HasValue)
                {
                    query = query.Where(r => r.Verified == queryModel.FullyPassed.Value);
                }

                if (!string.IsNullOrWhiteSpace(queryModel.SearchTerm))
                {
                    var term = queryModel.SearchTerm.Trim();
                    query = query.Where(r =>
                        r.DisplayName.Contains(term, StringComparison.OrdinalIgnoreCase) ||
                        r.LegalEntity.BusinessName.Contains(term, StringComparison.OrdinalIgnoreCase) ||
                        r.PrimaryContact.Email.Contains(term, StringComparison.OrdinalIgnoreCase));
                }

                query = query.OrderByDescending(r => r.CreatedDateTime);

                // Get total count before pagination
                var totalCount = query.Count();

                if (queryModel.PageSize > 0)
                {
                    var pageIndex = queryModel.PageIndex < 0 ? 0 : queryModel.PageIndex;
                    query = query.Skip(pageIndex * queryModel.PageSize).Take(queryModel.PageSize);
                }

                return new AiVirtualAssistantRegistrationListModel
                {
                    Registrations = query.ToList(),
                    TotalCount = totalCount
                };
            }

            var allRegistrations = query.OrderByDescending(r => r.CreatedDateTime).ToList();
            return new AiVirtualAssistantRegistrationListModel
            {
                Registrations = allRegistrations,
                TotalCount = allRegistrations.Count
            };
        }

        private static MockDataStore LoadMockData()
        {
            var path = Path.Combine(AppContext.BaseDirectory, "MockData", "mockData.json");
            using var stream = File.OpenRead(path);
            var data = JsonSerializer.Deserialize<MockDataStore>(stream, SerializerOptions);
            return data ?? new MockDataStore();
        }

        public AllOverviewModel GetAllOverview(AiVirtualAssistantRegistrationQueryModel queryModel)
        {
            IEnumerable<AiVirtualAssistantRegistrationModel> registrations =
                DataStore.Value.AiVirtualAssistantRegistrations;

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
                LegalPassedCount = filteredRegistrations.Count(r => r.LegalStatus == LegalStatus.Passed),
                ValidationPendingCount = filteredRegistrations.Count(r => r.ValidationStatus == ValidationStatus.Pending),
                LegalPendingCount = filteredRegistrations.Count(r => r.LegalStatus == LegalStatus.Pending),
                ValidationNotStartedCount = filteredRegistrations.Count(r => r.ValidationStatus == ValidationStatus.NotStarted),
                LegalNotStartedCount = filteredRegistrations.Count(r => r.LegalStatus == LegalStatus.NotStarted),
                ValidationFailedCount = filteredRegistrations.Count(r => r.ValidationStatus == ValidationStatus.Failed),
                LegalFailedCount = filteredRegistrations.Count(r => r.LegalStatus == LegalStatus.Failed),
                VerifiedCount = filteredRegistrations.Count(r => r.Verified)
            };
        }

        public AiVirtualAssistantRegistrationModel? ApplyRegistrationAction(RegistrationActionModel actionModel)
        {
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
                    registration.LegalStatus = LegalStatus.Passed;
                    registration.ValidationFailureReason = null;
                    registration.LegalFailureReason = null;
                    break;
                case RegistrationAction.RejectRegistration:
                    registration.ValidationStatus = ValidationStatus.Failed;
                    registration.LegalStatus = LegalStatus.Failed;
                    registration.ValidationFailureReason = failureReason;
                    registration.LegalFailureReason = failureReason;
                    break;
                case RegistrationAction.ApproveValidation:
                    registration.ValidationStatus = ValidationStatus.Passed;
                    registration.ValidationFailureReason = null;
                    break;
                case RegistrationAction.ResetValidation:
                    registration.ValidationStatus = ValidationStatus.NotStarted;
                    registration.ValidationFailureReason = null;
                    break;
                case RegistrationAction.ApproveLegal:
                    registration.LegalStatus = LegalStatus.Passed;
                    registration.LegalFailureReason = null;
                    break;
                case RegistrationAction.ResetLegal:
                    registration.LegalStatus = LegalStatus.NotStarted;
                    registration.LegalFailureReason = null;
                    break;
                default:
                    throw new ArgumentOutOfRangeException(nameof(actionModel.Action));
            }

            return registration;
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
