// Types that mirror the ASP.NET Core backend models (camelCase JSON).

export type ValidationStatus = 'NotStarted' | 'Pending' | 'Passed' | 'Failed';
export type BotVerificationLevel = 'Registered' | 'Validated';
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
  validationPendingCount: number;
  validationNotStartedCount: number;
  validationFailedCount: number;
  verifiedCount: number;
  monthlyRegistrations: MonthlyRegistrationOverview[];
}

export interface MonthlyRegistrationOverview {
  month: string;
  registrations: number;
  fullyPassed: number;
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
  verification: string;
  verified: boolean;
  agreementAcceptedDateTime: string | null;
  agreementAcceptedBy: string | null;
  createdDateTime: string;
  legalEntity: LegalEntity;
  primaryContact: PrimaryContact;
  technicalContact: Contact;
  programManagerContact: Contact;
  onboardingDocUrl: string;
  validationStatus: ValidationStatus;
  validationFailureReason?: string | null;
}

export interface RegistrationList {
  registrations: AiVirtualAssistantRegistration[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
}

export type RegistrationAction =
  | 'ApproveRegistration'
  | 'RejectRegistration'
  | 'ApproveValidation'
  | 'ResetValidation';

export interface RegistrationActionRequest {
  registrationId: string;
  tenantId: string;
  action: RegistrationAction;
  reason: string;
}

export interface RegistrationQuery {
  pageIndex?: number;
  pageSize?: number;
  startDate?: string | null;
  endDate?: string | null;
  searchTerm?: string | null;
  validationStatus?: ValidationStatus | null;
  verification?: BotVerificationLevel | null;
  fullyPassed?: boolean | null;
}
