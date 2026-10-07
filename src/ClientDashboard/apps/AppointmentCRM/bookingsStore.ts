import { useEffect, useState } from "react";
import type { Booking, BookingStatus } from "./mockData";
import { toIsoDate } from "./availabilityStore";
import { mapBooking, bookingToApiBody } from "./api/mappers";
import appointmentCrmAPI from "./api/index";

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

const BOOKING_EVENT = "shivai:appointment-bookings-changed";

// Bookings always come from the API — this is an in-memory cache of the last
// fetch/mutation response, never persisted to localStorage.
let memoryBookings: Booking[] = [];

export function readBookings(): Booking[] {
  return memoryBookings;
}

export function writeBookings(list: Booking[], opts?: { merge?: boolean }): void {
  if (opts?.merge) {
    const byId = new Map(memoryBookings.map((b) => [b.id, b]));
    list.forEach((b) => byId.set(b.id, b));
    memoryBookings = [...byId.values()];
  } else {
    memoryBookings = list;
  }
  window.dispatchEvent(new CustomEvent(BOOKING_EVENT));
}

export interface ManualBookingInput {
  customer: string;
  phone: string;
  email?: string;
  branchId: string;
  branchName: string;
  departmentId?: string;
  departmentName?: string;
  staffId?: string;
  provider: string;
  service: string;
  dateIso: string;
  time: string;
  durationMin?: number;
  status?: BookingStatus;
  notes?: string;
}

/** Creates a manual (staff-side) booking — same record shape and list the
 * AI-booked appointments use, so it shows up in Bookings/Calendar immediately. */
export async function addBooking(input: ManualBookingInput): Promise<Booking> {
  const created = await appointmentCrmAPI.createBooking({
    ...bookingToApiBody({
      branchId: input.branchId,
      staffId: input.staffId,
      provider: input.provider,
      customer: input.customer,
      phone: input.phone,
      email: input.email,
      service: input.service,
      dateIso: input.dateIso,
      time: input.time,
      durationMin: input.durationMin,
      status: input.status ?? "confirmed",
      notes: input.notes,
    }),
    channel: "walk-in",
  });
  const booking = mapBooking(created, {
    branchName: input.branchName,
    departmentName: input.departmentName,
    provider: input.provider,
  });
  writeBookings([...readBookings(), booking], { merge: true });
  return booking;
}

export function useBookings() {
  const [, force] = useState(0);
  useEffect(() => {
    const sync = () => force((n) => n + 1);
    window.addEventListener(BOOKING_EVENT, sync);
    window.addEventListener("shivai:appointment-staff-changed", sync);
    return () => {
      window.removeEventListener(BOOKING_EVENT, sync);
      window.removeEventListener("shivai:appointment-staff-changed", sync);
    };
  }, []);
  return readBookings();
}
