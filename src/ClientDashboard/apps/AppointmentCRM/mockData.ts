/**
 * Shared types for Appointment Scheduling CRM — bookings and the scheduling
 * agent shape real API agents get adapted into (see realAgents.ts).
 */

import { AgentStatus, statusMeta } from "../SupportCRM/mockData";

export type { AgentStatus };
export { statusMeta };

export type BookingStatus = "booked" | "completed" | "no_show" | "cancelled";

export type BookingChannel = "voice" | "web" | "whatsapp" | "walk-in";

export interface Booking {
  id: string;
  customer: string;
  phone: string;
  email?: string;
  service: string;
  appointmentType: string;
  provider: string;
  branchId: string;
  branchName: string;
  departmentId?: string;
  departmentName?: string;
  staffId?: string;
  date: string;
  time: string;
  durationMin: number;
  status: BookingStatus;
  channel?: BookingChannel;
  assignedAgentId?: string;
  notes?: string;
  /** Business-type booking fields (e.g. pet_name, vehicle_number) keyed by CustomField.key. */
  customFields?: Record<string, string>;
}

export interface SchedulingAgent {
  id: string;
  name: string;
  role: string;
  avatarHue: number;
  status: AgentStatus;
  bookingsToday: number;
  noShowRate: number;
  languages: string[];
}

export function bookingStatusMeta(status: BookingStatus): { label: string; cls: string } {
  switch (status) {
    case "booked":
      return { label: "Booked", cls: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/70 dark:border-emerald-800/50" };
    case "completed":
      return { label: "Completed", cls: "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border-sky-200/70 dark:border-sky-800/50" };
    case "no_show":
      return { label: "No-show", cls: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200/70 dark:border-amber-800/50" };
    case "cancelled":
      return { label: "Cancelled", cls: "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200/70 dark:border-red-800/50" };
  }
}
