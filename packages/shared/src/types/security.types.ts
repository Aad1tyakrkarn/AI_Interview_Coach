export enum ConsentType {
  CAMERA = 'CAMERA',
  VOICE = 'VOICE',
  DATA_PROCESSING = 'DATA_PROCESSING',
  MARKETING = 'MARKETING',
}

export enum DeletionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface IGDPRConsent {
  id: string;
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  ipAddress?: string;
  grantedAt: Date;
  revokedAt?: Date;
}

export interface IDataDeletionRequest {
  id: string;
  userId: string;
  status: DeletionStatus;
  requestedAt: Date;
  completedAt?: Date;
}

export interface IAuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface IPrivacyPolicy {
  version: string;
  content: string;
  effectiveDate: Date;
}
