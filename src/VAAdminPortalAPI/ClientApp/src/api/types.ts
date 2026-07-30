// Types that mirror the ASP.NET Core backend models (camelCase JSON).

export type ValidationStatus = 'NotStarted' | 'Pending' | 'Passed' | 'Failed';
export type LegalStatus = 'NotStarted' | 'Pending' | 'Passed' | 'Failed';
export type BotVerificationLevel = 'None' | 'Registered' | 'Attested';
export type EntityType = 'Company' | 'Individual';

export interface ResponseMessage {
  code?: string | null;
  detailsDescription?: string | null;
  responseMessageType: number;
  value: string;
}

export interface ApiResponse<TModel> {
  model: TModel | null;
  hasError: boolean;
  hasWarning: boolean;
  responseMessages: ResponseMessage[];
}

export interface AdminInfo {
  id: string;
  name: string;
  email: string;
}

export interface AllOverview {
  totalRegistrationsCount: number;
  validationPassedCount: number;
  legalPassedCount: number;
  validationPendingCount: number;
  legalPendingCount: number;
  attestedAssistantsCount: number;
  verifiedCount: number;
}

export interface LegalEntity {
  entityType: EntityType;
  businessName: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  country?: string | null;
  countryCode?: string | null;
  zipCode?: string | null;
  legalIdentifier?: string | null;
  nonDisclosureAgreementNumber?: string | null;
}

export interface PrimaryContact {
  name: string;
  email: string;
  phone: string;
  title: string;
}

export interface Contact {
  name: string;
  email: string;
}

export interface AiVirtualAssistantRegistration {
  id: string;
  appId: string;
  tenantId: string;
  displayName: string;
  domain?: string | null;
  logoUrl?: string | null;
  privacyStatementUrl?: string | null;
  verification: BotVerificationLevel;
  createdDateTime: string;
  legalEntity: LegalEntity;
  primaryContact: PrimaryContact;
  technicalContact: Contact;
  programManagerContact: Contact;
  onboardingDocUrl: string;
  validationStatus: ValidationStatus;
  legalStatus: LegalStatus;
}

export interface RegistrationList {
  registrations: AiVirtualAssistantRegistration[];
  totalCount: number;
}

export interface RegistrationQuery {
  pageIndex?: number;
  pageSize?: number;
  startDate?: string | null;
  endDate?: string | null;
  searchTerm?: string | null;
  validationStatus?: ValidationStatus | null;
  legalStatus?: LegalStatus | null;
  fullyPassed?: boolean | null;
}
