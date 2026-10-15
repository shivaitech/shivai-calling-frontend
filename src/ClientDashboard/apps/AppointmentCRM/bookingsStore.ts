import { useEffect, useState } from "react";
import type { Booking } from "./mockData";
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
  phone?: string;
  branchName: string;
  department?: string;
  designation?: string;
  staffId: string;
  provider: string;
  dateIso: string;
  time: string;
  endTime: string;
  notes?: string;
}

/** Creates a manual (staff-side) booking — same record shape and list the
 * AI-booked appointments use, so it shows up in Bookings/Calendar immediately. */
export async function addBooking(input: ManualBookingInput): Promise<Booking> {
  const created = await appointmentCrmAPI.createBooking(
    bookingToApiBody({
      staffId: input.staffId,
      customer: input.customer,
      phone: input.phone,
      department: input.department,
      designation: input.designation,
      dateIso: input.dateIso,
      time: input.time,
      endTime: input.endTime,
      notes: input.notes,
    }),
  );
  const booking = mapBooking(created, {
    branchName: input.branchName,
    departmentName: input.department,
    provider: input.provider,
  });
  writeBookings([...readBookings(), booking], { merge: true });
  return booking;
}

/** Cancels a booked appointment via PUT /appointments/:id/cancel — the only
 * status transition this API supports — and syncs the local cache from the
 * response. */
export async function cancelBookingRecord(id: string): Promise<Booking> {
  const existing = readBookings().find((b) => b.id === id);
  const updated = await appointmentCrmAPI.cancelBooking(id);
  const booking = mapBooking(updated, {
    branchName: existing?.branchName,
    departmentName: existing?.departmentName,
    provider: existing?.provider,
  });
  writeBookings([...readBookings().filter((b) => b.id !== id), booking], { merge: true });
  return booking;
}

/** Fetches bookings for exactly the staff shown on the Calendar, scoped to
 * the viewed date, via POST /staff-bookings — replaces the branch-wide
 * bootstrap fetch as the Calendar's per-day booking source. Merges into the
 * shared cache so Bookings/Overview keep seeing everything they already had. */
export async function fetchStaffBookingsForCalendar(params: {
  staffIds: string[];
  dateIso: string;
  branchName?: string;
}): Promise<void> {
  if (params.staffIds.length === 0) return;
  const response = await appointmentCrmAPI.fetchStaffBookings({
    staffIds: params.staffIds,
    date: params.dateIso,
  });
  const bookings = (response.staff ?? []).flatMap((s) =>
    (s.bookings ?? []).map((b) => mapBooking(b, { branchName: params.branchName, provider: s.name })),
  );
  writeBookings(bookings, { merge: true });
}

/** Fetches every booking (all dates) for a set of staff, via
 * GET /appointments/by-staff/:staffId with no ?date= — the Bookings page's
 * full list/filter view, using the same underlying API the Calendar uses
 * (just without the single-date scoping fetchStaffBookingsForCalendar
 * applies). One request per staff member; merges into the shared cache. */
export async function fetchAllBookingsForStaff(params: {
  staff: { id: string; name: string }[];
  branchName?: string;
}): Promise<void> {
  if (params.staff.length === 0) return;
  const results = await Promise.all(
    params.staff.map((s) =>
      appointmentCrmAPI.fetchBookingsByStaff(s.id).then(
        (apiBookings) => apiBookings.map((b) => mapBooking(b, { branchName: params.branchName, provider: s.name })),
        () => [] as Booking[],
      ),
    ),
  );
  writeBookings(results.flat(), { merge: true });
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
