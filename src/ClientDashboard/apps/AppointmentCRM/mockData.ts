/**
 * Shared types for Appointment Scheduling CRM — bookings and the scheduling
 * agent shape real API agents get adapted into (see realAgents.ts).
 */

import { AgentStatus, statusMeta } from "../SupportCRM/mockData";

export type { AgentStatus };
export { statusMeta };

export type BookingStatus = "booked" | "cancelled";

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
    case "cancelled":
      return { label: "Cancelled", cls: "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200/70 dark:border-red-800/50" };
  }
}
