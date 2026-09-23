using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace VAAdminPortalAPI.Models
{
    /// <summary>Filters and zero-based pagination for registrations. Date bounds are inclusive.</summary>
    public sealed record AiVirtualAssistantRegistrationQueryModel : IValidatableObject
    {
        [Range(0, int.MaxValue)]
        [JsonPropertyName("pageIndex")]
        public int PageIndex { get; init; }

        [Range(1, 100)]
        [JsonPropertyName("pageSize")]
        public int PageSize { get; init; } = 10;

        [JsonPropertyName("startDate")]
        public DateTimeOffset? StartDate { get; init; }

        [JsonPropertyName("endDate")]
        public DateTimeOffset? EndDate { get; init; }

        [JsonPropertyName("searchTerm")]
        public string? SearchTerm { get; init; }

        [EnumDataType(typeof(ValidationStatus))]
        [JsonPropertyName("validationStatus")]
        public ValidationStatus? ValidationStatus { get; init; }

        [JsonPropertyName("verification")]
        public string? Verification { get; init; }

        [JsonPropertyName("fullyPassed")]
        public bool? FullyPassed { get; init; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (StartDate.HasValue && EndDate.HasValue && StartDate > EndDate)
            {
                yield return new ValidationResult(
                    "Start date must be on or before end date.",
                    [nameof(StartDate), nameof(EndDate)]);
            }

            if (!string.IsNullOrWhiteSpace(Verification) &&
                !string.Equals(Verification.Trim(), "All", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(Verification.Trim(), "Registered", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(Verification.Trim(), "Validated", StringComparison.OrdinalIgnoreCase))
            {
                yield return new ValidationResult(
                    "Verification must be Registered, Validated, or All.",
                    [nameof(Verification)]);
            }
        }
    }
}
