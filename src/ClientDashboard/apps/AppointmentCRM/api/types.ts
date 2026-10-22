/** Appointment CRM API types — mirrors staging backend contract. */

export type ApiTemplateId = "template_healthcare" | "template_retail" | "generic";
export type BranchMode = "single" | "multi";
export type CatalogType =
  | "staff-roles"
  | "services"
  | "appointment-types"
  | "booking-fields"
  | "offline-block-fields";

export type BookingStatus = "booked" | "cancelled";

export type BookingChannel = "voice" | "web" | "whatsapp" | "walk-in";
export type LeaveType = "leave" | "holiday" | "blocked";
export type OfflineBlockType = "manual_booking" | "unavailable" | "break";

export interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  errors?: unknown[];
}

export interface ApiSetup {
  setupComplete: boolean;
  companyName?: string;
  timezone?: string;
  templateId?: ApiTemplateId;
  branchMode?: BranchMode;
  completedAt?: string;
}

// ── AI Configuration ─────────────────────────────────────────────────────────

export type AiConfigAgentStatus = "active" | "paused";
export type AiWhenUnknown = "escalate" | "apologize";
export type AiTone = "friendly" | "formal" | "concise";
export type AiFieldType = "string" | "phone" | "email" | "date" | "time" | "select";
export type AiFieldSource = "catalog" | null;

export interface ApiAiConfigDataAccess {
  calendar: boolean;
  bookings: boolean;
  branches: boolean;
  staff: boolean;
  customers: boolean;
  reminders: boolean;
}

export interface ApiAiConfigResponseBehavior {
  canTakeAction: boolean;
  whenUnknown: AiWhenUnknown;
  tone: AiTone;
}

export interface ApiAiConfigEscalation {
  enabled: boolean;
  afterUnclearReplies: number;
  notifyEmail: string;
  keywords: string[];
}

export interface ApiAiConfigFieldValidation {
  pattern: string | null;
  min: number | null;
  max: number | null;
  enum: string[] | null;
}

export interface ApiAiConfigField {
  key: string;
  label: string;
  type: AiFieldType;
  required: boolean;
  prompt: string;
  retryPrompt: string;
  validation: ApiAiConfigFieldValidation;
  source: AiFieldSource;
  sourceRef?: string | null;
}

export interface ApiAiConfigScenario {
  key: string;
  label: string;
  description?: string;
  enabled: boolean;
  fields: ApiAiConfigField[];
}

export interface ApiAiConfig {
  agentId: string;
  assigned: boolean;
  status: AiConfigAgentStatus;
  dataAccess: ApiAiConfigDataAccess;
  responseBehavior: ApiAiConfigResponseBehavior;
  escalation: ApiAiConfigEscalation;
  scenarios: ApiAiConfigScenario[];
}

export interface ApiAiConfigDefaults {
  scenarios: ApiAiConfigScenario[];
}

export interface ApiCatalogOption {
  id: string;
  label: string;
  description?: string;
}

/** GET /ai-config/resolved — the saved config with every catalog-backed
 * field's options already resolved from live data, plus org timezone. */
export interface ApiAiConfigResolved extends ApiAiConfig {
  timezone: string;
  calendar?: unknown;
}

export interface ApiOrgConfig {
  terms?: Record<string, string>;
  calendar?: Record<string, unknown>;
  catalogs?: Record<string, unknown>;
  reminderChannels?: string[];
  templateId?: ApiTemplateId;
  flags?: Record<string, unknown>;
}

export interface ApiBranchCalendar {
  dayStart?: string;
  dayEnd?: string;
}

export interface ApiBranch {
  id?: string;
  _id?: string;
  name: string;
  address?: string;
  phone?: string;
  isPrimary?: boolean;
  active?: boolean;
  calendar?: ApiBranchCalendar;
}

export interface ApiDepartment {
  id?: string;
  _id?: string;
  branchId: string;
  name: string;
  desc?: string;
  hue?: string | number;
  active?: boolean;
}

export interface ApiStaff {
  id?: string;
  _id?: string;
  branchId: string;
  departmentId?: string;
  name: string;
  namePrefix?: string;
  roleId?: string;
  roleLabel?: string;
  email?: string;
  phone?: string;
  slotDurationMin?: number;
  active?: boolean;
  hue?: number;
}

export interface ApiWeeklyDay {
  day: number;
  enabled: boolean;
  from: string;
  to: string;
}

export interface ApiAvailability {
  weekly: ApiWeeklyDay[];
  dailyBreak?: { enabled: boolean; from: string; to: string };
}

export interface ApiLeave {
  id?: string;
  _id?: string;
  staffId: string;
  fromDate: string;
  toDate: string;
  reason?: string;
  type: LeaveType;
}

export interface ApiOfflineBlock {
  id?: string;
  _id?: string;
  staffId: string;
  branchId?: string;
  date: string;
  fromTime: string;
  toTime: string;
  type: OfflineBlockType;
  notes?: string;
  customFields?: Record<string, unknown>;
}

export interface ApiBooking {
  id?: string;
  _id?: string;
  tenant_id?: string;
  branchId?: string;
  staff?: string;
  name: string;
  phone?: string;
  department?: string;
  designation?: string;
  date: string;
  time: string;
  end_time?: string;
  status: BookingStatus;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiCustomer {
  id?: string;
  _id?: string;
  name: string;
  phone?: string;
  email?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export interface ApiPreferences {
  activeBranchId?: string;
}

export interface ApiBootstrapStats {
  totalBookings?: number;
  todayBookings?: number;
  totalStaff?: number;
}

export interface ApiBootstrap {
  setup: ApiSetup;
  config: ApiOrgConfig;
  branches: ApiBranch[];
  departments: ApiDepartment[];
  preferences: ApiPreferences;
  stats?: ApiBootstrapStats;
}

export interface ApiCalendarDay {
  date: string;
  branchId: string;
  staff: ApiStaff[];
  bookings: ApiBooking[];
  blocks: ApiOfflineBlock[];
  leaves: ApiLeave[];
  availabilities: (ApiAvailability & { staffId?: string })[];
}

export interface ApiStaffBookingsBreak {
  source?: string;
  from: string;
  to: string;
}

export interface ApiStaffBookingsLeave {
  id: string;
  from_date: string;
  to_date: string;
  from_time: string;
  to_time: string;
  reason?: string;
}

export interface ApiStaffBookingsEntry {
  id: string;
  name: string;
  bookings: ApiBooking[];
  breaks: ApiStaffBookingsBreak[];
  leaves: ApiStaffBookingsLeave[];
}

export interface ApiStaffBookingsResponse {
  date: string;
  staff: ApiStaffBookingsEntry[];
}

export interface ApiStaffCalendarShare {
  shareToken: string;
  staffId: string;
  staffName?: string;
  doctorEmail?: string;
  branchId?: string;
  companyName?: string;
  createdAt?: string;
}

export interface ApiAnalyticsOverview {
  bookings: {
    total: number;
    today: number;
    confirmed: number;
    pending: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  staff: { total: number };
  customers: { total: number };
}
