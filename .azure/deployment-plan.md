# Azure Deployment Plan

> **Status:** Completed (UI-only; no Azure resource validation required)

Generated: 2026-09-20

## 1. Project Overview

**Goal:** Restyle the existing admin portal dashboard to match the supplied reference image while preserving current data loading, filtering, paging, notification, sign-out, and registration-detail behavior.

**Path:** Add Components (UI-only modification)

## 2. Requirements

| Attribute | Value |
|-----------|-------|
| Classification | Existing application UI update |
| Scale | Unchanged |
| Budget | No infrastructure impact |
| Subscription | Not applicable; no Azure resources will be changed |
| Location | Not applicable; no Azure resources will be changed |

## 3. Components Detected

| Component | Type | Technology | Path |
|-----------|------|------------|------|
| Admin portal frontend | SPA frontend | React 18, TypeScript, Fluent UI 9, Redux Toolkit | `src/VAAdminPortalAPI/ClientApp` |
| Admin portal API | API/web host | ASP.NET Core, .NET 10 | `src/VAAdminPortalAPI` |

No GitHub Copilot SDK markers were found. Existing dashboard and table files contain uncommitted user changes; implementation will preserve and build on them.

## 4. Recipe Selection

**Selected:** Existing application workflow; no AZD, Azure CLI, Bicep, or Terraform generation.

**Rationale:** The requested change is limited to the existing React dashboard presentation and introduces no Azure resources or deployment configuration.

## 5. Architecture

**Stack:** Existing ASP.NET Core-hosted React SPA, unchanged.

| Component | Azure Service | Change |
|-----------|---------------|--------|
| Existing web application | Existing App Service deployment | None |

## 6. Provisioning Limit Checklist

No resources will be provisioned. Quota and capacity validation are not applicable.

| Resource Type | Number to Deploy | Total After Deployment | Limit/Quota | Notes |
|---------------|------------------|------------------------|-------------|-------|
| None | 0 | Unchanged | Not applicable | UI-only source change |

**Status:** No provisioning impact.

## 7. Execution Checklist

### Phase 1: Planning
- [x] Analyze workspace
- [x] Gather requirements from the supplied reference image
- [x] Confirm subscription and location are not applicable
- [x] Confirm no resource inventory or quota check is required
- [x] Scan codebase
- [x] Select existing application workflow
- [x] Plan UI changes
- [x] User approved this plan

### Phase 2: Execution
- [x] Align dashboard header, spacing, and content width with the reference
- [x] Remove the extra dashboard title and insights chart from the homepage
- [x] Match overview date controls, KPI cards, registration filters, and table layout
- [x] Preserve current API calls and interactions
- [x] Build the React frontend and .NET solution

## 8. Files to Modify

| File | Purpose | Status |
|------|---------|--------|
| `src/VAAdminPortalAPI/ClientApp/src/pages/DashboardPage.tsx` | Homepage structure and styles | Complete |
| `src/VAAdminPortalAPI/ClientApp/src/components/RegistrationTable.tsx` | Table sizing and visual alignment | Complete |
| `.azure/deployment-plan.md` | Required change plan | Complete |

## 9. Verification

- Run `npm run build` in `src/VAAdminPortalAPI/ClientApp`.
- Build `src/VAAdminPortalAPI/VAAdminPortal.slnx`.
- Confirm generated SPA assets remain compatible with the ASP.NET Core host.

## 10. Completion

The dashboard UI update is complete. No Azure infrastructure, subscription, location, or deployment action was requested or changed.
