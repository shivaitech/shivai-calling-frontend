/** Appointment CRM API types — mirrors staging backend contract. */

export type ApiTemplateId = "template_healthcare" | "template_retail" | "generic";
export type BranchMode = "single" | "multi";
export type CatalogType =
  | "staff-roles"
  | "services"
  | "appointment-types"
  | "booking-fields"
  | "offline-block-fields";

export type BookingStatus =
  | "confirmed"
  | "pending"
  | "checked-in"
  | "completed"
  | "cancelled"
  | "no-show";

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

export interface ApiOrgConfig {
  terms?: Record<string, string>;
  calendar?: Record<string, unknown>;
  catalogs?: Record<string, unknown>;
  reminderChannels?: string[];
  templateId?: ApiTemplateId;
  flags?: Record<string, unknown>;
}

export interface ApiBranch {
  id?: string;
  _id?: string;
  name: string;
  address?: string;
  phone?: string;
  isPrimary?: boolean;
  active?: boolean;
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
  branchId?: string;
  staffId?: string;
  staffLabel?: string;
  customer: string;
  phone?: string;
  email?: string;
  serviceId?: string;
  serviceLabel?: string;
  date: string;
  time: string;
  durationMin?: number;
  status: BookingStatus;
  channel?: BookingChannel;
  notes?: string;
  customFields?: Record<string, unknown>;
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
