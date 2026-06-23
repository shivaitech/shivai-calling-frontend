/**
 * Mock data for Appointment Scheduling CRM — bookings, AI agents, metrics.
 */

import { AgentStatus, statusMeta } from "../SupportCRM/mockData";

export type { AgentStatus };
export { statusMeta };

export type BookingStatus =
  | "confirmed"
  | "pending"
  | "checked-in"
  | "completed"
  | "cancelled"
  | "no-show";

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
  channel: BookingChannel;
  assignedAgentId?: string;
  notes?: string;
  reminderSent?: boolean;
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

export interface TeamSchedulingMetrics {
  bookingsToday: number;
  confirmedToday: number;
  pendingConfirmation: number;
  noShowsToday: number;
  utilizationPct: number;
  avgBookingSec: number;
  reminderDeliveryPct: number;
  rescheduleRate: number;
  hourlyBookings: { hour: string; count: number }[];
}

export function bookingStatusMeta(status: BookingStatus): { label: string; cls: string } {
  switch (status) {
    case "confirmed":
      return { label: "Confirmed", cls: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/70 dark:border-emerald-800/50" };
    case "pending":
      return { label: "Pending", cls: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200/70 dark:border-amber-800/50" };
    case "checked-in":
      return { label: "Checked in", cls: "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border-sky-200/70 dark:border-sky-800/50" };
    case "completed":
      return { label: "Completed", cls: "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600" };
    case "cancelled":
      return { label: "Cancelled", cls: "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200/70 dark:border-red-800/50" };
    case "no-show":
      return { label: "No-show", cls: "text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200/70 dark:border-orange-800/50" };
  }
}

export const SCHEDULING_AGENTS: SchedulingAgent[] = [
  { id: "sa-1", name: "Maya", role: "Scheduling Coordinator", avatarHue: 265, status: "on-call", bookingsToday: 34, noShowRate: 4.2, languages: ["English", "Hindi"] },
  { id: "sa-2", name: "Arjun", role: "Front Desk AI", avatarHue: 200, status: "available", bookingsToday: 28, noShowRate: 5.1, languages: ["English", "Tamil"] },
  { id: "sa-3", name: "Priya", role: "Reminder Specialist", avatarHue: 330, status: "wrap-up", bookingsToday: 19, noShowRate: 3.8, languages: ["English", "Hindi", "Marathi"] },
];

export const TEAM_METRICS: TeamSchedulingMetrics = {
  bookingsToday: 87,
  confirmedToday: 72,
  pendingConfirmation: 11,
  noShowsToday: 4,
  utilizationPct: 78,
  avgBookingSec: 142,
  reminderDeliveryPct: 96,
  rescheduleRate: 8,
  hourlyBookings: [
    { hour: "09", count: 6 },
    { hour: "10", count: 12 },
    { hour: "11", count: 14 },
    { hour: "12", count: 9 },
    { hour: "13", count: 5 },
    { hour: "14", count: 11 },
    { hour: "15", count: 13 },
    { hour: "16", count: 10 },
    { hour: "17", count: 7 },
  ],
};

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: "APT-2401",
    customer: "Rahul Mehta",
    phone: "+91 98765 43210",
    email: "rahul@email.com",
    service: "General Medicine",
    appointmentType: "OPD Consultation",
    provider: "Dr. Sharma",
    branchId: "br-main",
    branchName: "Main Clinic",
    date: "Today",
    time: "10:30 AM",
    durationMin: 20,
    status: "confirmed",
    channel: "voice",
    assignedAgentId: "sa-1",
    reminderSent: true,
  },
  {
    id: "APT-2402",
    customer: "Anita Desai",
    phone: "+91 91234 56789",
    service: "Dental",
    appointmentType: "Check-up",
    provider: "Dr. Patel",
    branchId: "br-main",
    branchName: "Main Clinic",
    date: "Today",
    time: "11:00 AM",
    durationMin: 30,
    status: "checked-in",
    channel: "whatsapp",
    assignedAgentId: "sa-2",
    reminderSent: true,
  },
  {
    id: "APT-2403",
    customer: "Vikram Singh",
    phone: "+91 99887 76655",
    service: "Physiotherapy",
    appointmentType: "Follow-up",
    provider: "Dr. Iyer",
    branchId: "br-main",
    branchName: "Main Clinic",
    date: "Today",
    time: "02:15 PM",
    durationMin: 45,
    status: "pending",
    channel: "web",
    assignedAgentId: "sa-1",
    reminderSent: false,
  },
  {
    id: "APT-2404",
    customer: "Sneha Kapoor",
    phone: "+91 97654 32109",
    service: "Dermatology",
    appointmentType: "Consultation",
    provider: "Dr. Rao",
    branchId: "br-2",
    branchName: "City Branch",
    date: "Tomorrow",
    time: "09:45 AM",
    durationMin: 20,
    status: "confirmed",
    channel: "voice",
    assignedAgentId: "sa-3",
    reminderSent: true,
  },
  {
    id: "APT-2405",
    customer: "Mohammed Ali",
    phone: "+91 90123 45678",
    service: "General Medicine",
    appointmentType: "Health Check-up",
    provider: "Dr. Sharma",
    branchId: "br-main",
    branchName: "Main Clinic",
    date: "Yesterday",
    time: "04:00 PM",
    durationMin: 30,
    status: "no-show",
    channel: "voice",
    assignedAgentId: "sa-2",
    reminderSent: true,
    notes: "Reminder sent — no response",
  },
  {
    id: "APT-2406",
    customer: "Lakshmi Nair",
    phone: "+91 94444 55555",
    service: "Pediatrics",
    appointmentType: "Follow-up",
    provider: "Dr. Menon",
    branchId: "br-2",
    branchName: "City Branch",
    date: "Today",
    time: "03:30 PM",
    durationMin: 20,
    status: "cancelled",
    channel: "voice",
    assignedAgentId: "sa-1",
    notes: "Rescheduled to next week",
  },
];

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalAppointments: number;
  upcoming: number;
  noShows: number;
  lastVisit?: string;
  tags: string[];
}

export const MOCK_CUSTOMERS: CustomerRecord[] = [
  { id: "c-1", name: "Rahul Mehta", phone: "+91 98765 43210", email: "rahul@email.com", totalAppointments: 12, upcoming: 1, noShows: 0, lastVisit: "2 weeks ago", tags: ["Regular"] },
  { id: "c-2", name: "Anita Desai", phone: "+91 91234 56789", totalAppointments: 8, upcoming: 2, noShows: 1, lastVisit: "Today", tags: ["VIP", "Dental"] },
  { id: "c-3", name: "Vikram Singh", phone: "+91 99887 76655", totalAppointments: 5, upcoming: 1, noShows: 0, lastVisit: "1 month ago", tags: ["Physio"] },
  { id: "c-4", name: "Sneha Kapoor", phone: "+91 97654 32109", email: "sneha@email.com", totalAppointments: 3, upcoming: 1, noShows: 0, lastVisit: "3 months ago", tags: ["New"] },
];

export function getSchedulingAgent(id: string): SchedulingAgent | undefined {
  return SCHEDULING_AGENTS.find((a) => a.id === id);
}
