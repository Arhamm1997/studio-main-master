// lib/types.ts - Complete type definitions

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'Pending' | 'Sent' | 'Opened' | 'Error';
  sentTimestamp: string | null;
  openTimestamp: string | null;
}

export interface Campaign {
  subject: string;
  body: string;
}

export interface EmailRecord {
  id: string;
  contactId: string;
  contactEmail: string;
  contactName: string;
  subject: string;
  sentAt: string;
  openedAt: string | null;
  status: 'Sent' | 'Opened' | 'Error';
  campaignData: {
    subject: string;
    body: string;
    senderName: string;
  } | null;
}

export interface AppSettings {
  teamLeadName: string;
  realtimeTracking: boolean;
  companyName: string;
  fromEmail: string;
  replyToEmail: string;
}

// Additional utility types
export interface Analytics {
  total: number;
  sent: number;
  pending: number;
  errors: number;
  opened: number;
  openRate: number;
  sentRate: number;
}

export interface StorageStats {
  contactsCount: number;
  emailRecordsCount: number;
  sentEmails: number;
  openedEmails: number;
  openRate: number;
}

export interface BackupData {
  contacts: Contact[];
  emailRecords: EmailRecord[];
  settings: AppSettings;
  exportedAt: string;
}

export interface EmailSendResult {
  success: boolean;
  message: string;
  stats?: {
    sent: number;
    failed: number;
    total: number;
  };
  errors?: string[];
  details?: any;
}

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
}

export interface BulkContactData extends ContactFormData {
  // Can add additional fields for bulk import
}

export interface TrackingStats {
  totalSent: number;
  totalOpened: number;
  openRate: number;
  recentOpens: number;
  lastOpen: string | null;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
  lastUsed: string | null;
}

export interface CampaignSendOptions {
  testMode?: boolean;
  delayBetweenEmails?: number;
  skipAlreadySent?: boolean;
  customSubject?: string;
  customBody?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  emailService: {
    status: string;
    serviceStatus: string;
    ready: boolean;
    transporterCreated: boolean;
    nodemailer: {
      loaded: boolean;
      version: string;
    };
  };
  smtp: {
    host: string;
    port: string;
    user: string;
    pass: string;
    fromEmail: string;
  };
  memory: {
    heapUsed: string;
    heapTotal: string;
  };
  uptime: string;
  port: string | number;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Dashboard data types
export interface DashboardData {
  campaign: Campaign;
  contacts: Contact[];
  analytics: Analytics;
  recentActivity: EmailRecord[];
  settings: AppSettings;
}

// Import/Export types
export interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  skipped: number;
  errors: string[];
}

export interface ExportOptions {
  includeContacts: boolean;
  includeEmailRecords: boolean;
  includeSettings: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

// Email composition types
export interface EmailComposition {
  to: string;
  subject: string;
  html: string;
  text?: string;
  senderName: string;
  replyTo: string;
  contactId?: string;
}

export interface BulkEmailRequest {
  emails: EmailComposition[];
  options?: CampaignSendOptions;
}

// User preferences types
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  defaultEmailTemplate: string | null;
}

// Status and state types
export type ContactStatus = Contact['status'];
export type EmailStatus = EmailRecord['status'];
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Event types for real-time updates
export interface ContactUpdateEvent {
  type: 'contact_updated';
  contactId: string;
  updates: Partial<Contact>;
  timestamp: string;
}

export interface EmailOpenEvent {
  type: 'email_opened';
  contactId: string;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface CampaignEvent {
  type: 'campaign_started' | 'campaign_completed' | 'campaign_paused';
  timestamp: string;
  stats?: Analytics;
}

export type SystemEvent = ContactUpdateEvent | EmailOpenEvent | CampaignEvent;

// Configuration types
export interface EmailServiceConfig {
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  apiKey?: string;
  region?: string;
}

export interface AppConfig {
  baseUrl: string;
  emailService: EmailServiceConfig;
  storage: {
    type: 'file' | 'database';
    path?: string;
    connectionString?: string;
  };
  features: {
    realTimeTracking: boolean;
    bulkOperations: boolean;
    templates: boolean;
    analytics: boolean;
  };
}

// Error types
export interface StorageError extends Error {
  code: 'FILE_NOT_FOUND' | 'PERMISSION_DENIED' | 'STORAGE_FULL' | 'INVALID_DATA';
  details?: any;
}

export interface EmailError extends Error {
  code: 'SMTP_ERROR' | 'INVALID_EMAIL' | 'RATE_LIMITED' | 'SERVICE_UNAVAILABLE';
  emailAddress?: string;
  details?: any;
}

// Pagination types
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Search types
export interface SearchOptions {
  query: string;
  fields: string[];
  exact?: boolean;
  caseSensitive?: boolean;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  query: string;
  executionTime: number;
}