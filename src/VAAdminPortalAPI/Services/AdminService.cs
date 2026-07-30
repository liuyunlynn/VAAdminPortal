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

        public IList<AiVirtualAssistantRegistrationModel> GetAiVirtualAssistantRegistrations(AiVirtualAssistantRegistrationQueryModel queryModel)
        {
            IEnumerable<AiVirtualAssistantRegistrationModel> query = DataStore.Value.AiVirtualAssistantRegistrations;

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

                if (!string.IsNullOrWhiteSpace(queryModel.SearchTerm))
                {
                    var term = queryModel.SearchTerm.Trim();
                    query = query.Where(r =>
                        r.DisplayName.Contains(term, StringComparison.OrdinalIgnoreCase) ||
                        r.LegalEntity.BusinessName.Contains(term, StringComparison.OrdinalIgnoreCase) ||
                        r.PrimaryContact.Email.Contains(term, StringComparison.OrdinalIgnoreCase));
                }

                query = query.OrderByDescending(r => r.CreatedDateTime);

                if (queryModel.PageSize > 0)
                {
                    var pageIndex = queryModel.PageIndex < 0 ? 0 : queryModel.PageIndex;
                    query = query.Skip(pageIndex * queryModel.PageSize).Take(queryModel.PageSize);
                }
            }

            return query.ToList();
        }

        private static MockDataStore LoadMockData()
        {
            var path = Path.Combine(AppContext.BaseDirectory, "MockData", "mockData.json");
            using var stream = File.OpenRead(path);
            var data = JsonSerializer.Deserialize<MockDataStore>(stream, SerializerOptions);
            return data ?? new MockDataStore();
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
