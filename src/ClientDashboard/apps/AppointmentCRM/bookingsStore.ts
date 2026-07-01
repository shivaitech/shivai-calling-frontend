import { useEffect, useState } from "react";
import { Branch } from "./branchesStore";
import { Department } from "./departmentsStore";
import { StaffMember, staffDisplayName } from "./staffStore";
import type { Booking, BookingStatus, BookingChannel } from "./mockData";
import { toIsoDate } from "./availabilityStore";
import { getActiveIndustryId } from "./industryConfig";
import { isAppointmentCrmApiMode } from "./api/apiMode";

export function bookingMatchesViewDate(booking: Booking, viewDate: Date): boolean {
  const iso = toIsoDate(viewDate);
  const today = toIsoDate(new Date());
  if (booking.date === "Today") return iso === today;
  if (booking.date === "Tomorrow") {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return iso === toIsoDate(t);
  }
  if (booking.date === "Yesterday") {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return iso === toIsoDate(y);
  }
  return booking.date === iso;
}

const STORAGE_KEY = "shivai_appointmentcrm_bookings";
const BOOKING_EVENT = "shivai:appointment-bookings-changed";

let memoryBookings: Booking[] | null = null;

export function readBookings(): Booking[] {
  if (memoryBookings) return memoryBookings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeBookings(list: Booking[], opts?: { fromApi?: boolean; merge?: boolean }): void {
  if (opts?.merge && memoryBookings) {
    const byId = new Map(memoryBookings.map((b) => [b.id, b]));
    list.forEach((b) => byId.set(b.id, b));
    memoryBookings = [...byId.values()];
  } else {
    memoryBookings = list;
  }
  try {
    if (!isAppointmentCrmApiMode() || !opts?.fromApi) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryBookings));
    }
    window.dispatchEvent(new CustomEvent(BOOKING_EVENT));
  } catch {
    /* ignore */
  }
}

type BookingSample = {
  customer: string;
  phone: string;
  status: BookingStatus;
  date: string;
  time: string;
  channel: BookingChannel;
  staffIdx?: number;
  deptIndex?: number;
  durationMin?: number;
  appointmentType?: string;
  notes?: string;
};

const DEFAULT_BOOKING_SAMPLES: BookingSample[] = [
  { customer: "Rahul Mehta", phone: "+91 98765 43210", status: "confirmed", date: "Today", time: "09:30 AM", channel: "voice", staffIdx: 0, durationMin: 15 },
  { customer: "Anita Desai", phone: "+91 91234 56789", status: "checked-in", date: "Today", time: "11:00 AM", channel: "whatsapp", staffIdx: 1 },
  { customer: "Vikram Singh", phone: "+91 99887 76655", status: "pending", date: "Today", time: "02:15 PM", channel: "web", staffIdx: 2 },
  { customer: "Sneha Kapoor", phone: "+91 97654 32109", status: "confirmed", date: "Tomorrow", time: "09:45 AM", channel: "voice", staffIdx: 3 },
  { customer: "Mohammed Ali", phone: "+91 90123 45678", status: "no-show", date: "Yesterday", time: "04:00 PM", channel: "voice", staffIdx: 0 },
  { customer: "Lakshmi Nair", phone: "+91 94444 55555", status: "cancelled", date: "Today", time: "03:30 PM", channel: "voice", staffIdx: 4, notes: "Rescheduled to next week" },
];

/** Rich OPD day for hospital template — maps to primary-branch departments by index. */
const HOSPITAL_BOOKING_SAMPLES: BookingSample[] = [
  { customer: "Rahul Mehta", phone: "+91 98765 43210", status: "confirmed", date: "Today", time: "09:30 AM", channel: "voice", deptIndex: 0, appointmentType: "OPD Consultation" },
  { customer: "Vikram Singh", phone: "+91 99887 76655", status: "checked-in", date: "Today", time: "09:00 AM", channel: "walk-in", deptIndex: 2, appointmentType: "OPD Consultation" },
  { customer: "Anita Desai", phone: "+91 91234 56789", status: "confirmed", date: "Today", time: "10:00 AM", channel: "whatsapp", deptIndex: 1, appointmentType: "Follow-up Visit" },
  { customer: "Sneha Kapoor", phone: "+91 97654 32109", status: "confirmed", date: "Today", time: "10:30 AM", channel: "voice", deptIndex: 3, appointmentType: "Vaccination" },
  { customer: "Mohammed Ali", phone: "+91 90123 45678", status: "checked-in", date: "Today", time: "11:00 AM", channel: "voice", deptIndex: 4, appointmentType: "Diagnostics" },
  { customer: "Lakshmi Nair", phone: "+91 94444 55555", status: "confirmed", date: "Today", time: "11:30 AM", channel: "voice", deptIndex: 0, appointmentType: "OPD Consultation" },
  { customer: "Arjun Reddy", phone: "+91 95555 66666", status: "pending", date: "Today", time: "01:00 PM", channel: "web", deptIndex: 2, appointmentType: "Follow-up Visit" },
  { customer: "Kavita Shah", phone: "+91 96666 77777", status: "confirmed", date: "Today", time: "02:15 PM", channel: "whatsapp", deptIndex: 1, appointmentType: "OPD Consultation" },
  { customer: "Deepak Verma", phone: "+91 97777 88888", status: "confirmed", date: "Today", time: "02:30 PM", channel: "voice", deptIndex: 0, appointmentType: "Procedure" },
  { customer: "Meera Iyer", phone: "+91 98888 99999", status: "confirmed", date: "Today", time: "03:00 PM", channel: "voice", deptIndex: 1, appointmentType: "Follow-up Visit" },
  { customer: "Rajesh Kumar", phone: "+91 99999 00000", status: "pending", date: "Today", time: "04:00 PM", channel: "web", deptIndex: 3, appointmentType: "OPD Consultation" },
  { customer: "Former Patient", phone: "+91 90000 11111", status: "no-show", date: "Yesterday", time: "04:00 PM", channel: "voice", deptIndex: 0, appointmentType: "OPD Consultation" },
  { customer: "Tomorrow Patient", phone: "+91 91111 22222", status: "confirmed", date: "Tomorrow", time: "09:45 AM", channel: "voice", deptIndex: 0, appointmentType: "Follow-up Visit" },
];

function resolveStaffForSample(
  sample: BookingSample,
  branchId: string,
  departments: Department[],
  staff: StaffMember[],
): StaffMember | undefined {
  if (sample.deptIndex !== undefined) {
    const branchDepts = departments.filter((d) => d.branchId === branchId);
    const dept = branchDepts[sample.deptIndex];
    if (dept) return staff.find((s) => s.departmentId === dept.id);
  }
  const branchStaff = staff.filter((s) => s.branchId === branchId);
  const idx = sample.staffIdx ?? 0;
  return branchStaff[idx] ?? staff[idx % staff.length];
}

export function seedBookingsFromOrg(
  branches: Branch[],
  departments: Department[],
  staff: StaffMember[],
): Booking[] {
  const existing = readBookings();
  if (existing.length) return existing;

  const primaryBranch = branches.find((b) => b.isPrimary) ?? branches[0];
  const branchId = primaryBranch?.id ?? "";
  const isHospital = getActiveIndustryId() === "hospital";
  const samples = isHospital ? HOSPITAL_BOOKING_SAMPLES : DEFAULT_BOOKING_SAMPLES;

  const bookings: Booking[] = samples.map((s, i) => {
    const member = resolveStaffForSample(s, branchId, departments, staff);
    const dept = departments.find((d) => d.id === member?.departmentId) ?? departments[0];
    const branch = branches.find((b) => b.id === member?.branchId) ?? primaryBranch;
    const provider = member ? staffDisplayName(member) : "Unassigned";

    return {
      id: `APT-${2401 + i}`,
      customer: s.customer,
      phone: s.phone,
      service: dept?.name ?? "General",
      appointmentType: s.appointmentType ?? (isHospital ? "OPD Consultation" : "Consultation"),
      provider,
      staffId: member?.id,
      departmentId: dept?.id,
      departmentName: dept?.name,
      branchId: branch?.id ?? "",
      branchName: branch?.name ?? "",
      date: s.date,
      time: s.time,
      durationMin: s.durationMin ?? member?.slotDurationMin ?? 30,
      status: s.status,
      channel: s.channel,
      reminderSent: s.status !== "pending",
      notes: s.notes ?? (s.status === "cancelled" ? "Rescheduled to next week" : undefined),
    };
  });

  writeBookings(bookings);
  return bookings;
}

export function useBookings() {
  const [, force] = useState(0);
  useEffect(() => {
    const sync = () => force((n) => n + 1);
    window.addEventListener(BOOKING_EVENT, sync);
    window.addEventListener("shivai:appointment-staff-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(BOOKING_EVENT, sync);
      window.removeEventListener("shivai:appointment-staff-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return readBookings();
}
