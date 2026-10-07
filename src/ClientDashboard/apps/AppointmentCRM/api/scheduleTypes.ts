// Wire types for the Schedule API (/api/v1/schedules) — field names and
// shapes match the spec exactly (snake_case, day 0 = Sunday, 24h "HH:mm").

export interface ApiScheduleBreak {
  enabled: boolean;
  from: string;
  to: string;
}

export interface ApiWeeklyAvailabilityDay {
  day: number; // 0 = Sunday … 6 = Saturday
  label?: string; // response-only, ignored on write
  is_working: boolean;
  from: string;
  to: string;
  break: ApiScheduleBreak;
}

export interface ApiScheduleLeave {
  id: string;
  from_date: string;
  to_date: string;
  from_time: string;
  to_time: string;
  reason: string;
}

export type ApiScheduleBlockType = "manual_booking" | "unavailable" | "break";

export interface ApiScheduleBlock {
  id: string;
  type: ApiScheduleBlockType;
  date: string;
  from: string;
  to: string;
  patient_name: string;
  patient_id: string;
  notes: string;
}

export interface ApiScheduleStaffSummary {
  id: string;
  fullName: string;
  email: string;
  profilePicture: string | null;
}

export interface ApiSchedule {
  id: string;
  staff_id: string;
  tenant_id: string;
  timezone: string;
  staff: ApiScheduleStaffSummary | null;
  weekly_availability: ApiWeeklyAvailabilityDay[];
  leaves: ApiScheduleLeave[];
  blocks: ApiScheduleBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiScheduleAvailabilitySlot {
  from: string;
  to: string;
}

export interface ApiScheduleAvailability {
  staff_id: string;
  date: string;
  timezone: string;
  is_working: boolean;
  on_leave: boolean;
  slots: ApiScheduleAvailabilitySlot[];
}
