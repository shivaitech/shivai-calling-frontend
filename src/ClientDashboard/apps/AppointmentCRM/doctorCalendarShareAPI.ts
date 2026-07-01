import type { DoctorCalendarShare } from "./doctorCalendarShareStore";
import appointmentCrmAPI from "./api/index";
import { isAppointmentCrmApiConfigured } from "./api/client";
import { mapBooking, mapOfflineBlock, mapStaff, mapAvailability, mapLeave } from "./api/mappers";
import type { DoctorCalendarSnapshot } from "./doctorCalendarShareStore";

function mapShareToLocal(
  share: {
    shareToken: string;
    staffId: string;
    staffName?: string;
    doctorEmail?: string;
    branchId?: string;
    companyName?: string;
    createdAt?: string;
  },
  snapshot?: Partial<DoctorCalendarSnapshot>,
): DoctorCalendarShare {
  const emptySnapshot: DoctorCalendarSnapshot = {
    staff: snapshot?.staff ?? {
      id: share.staffId,
      branchId: share.branchId ?? "",
      departmentId: "",
      name: share.staffName ?? "Staff",
      role: "Staff",
      active: true,
      hue: 220,
      slotDurationMin: 30,
    },
    branchId: share.branchId ?? "",
    branchName: snapshot?.branchName ?? "",
    companyName: share.companyName ?? snapshot?.companyName ?? "",
    bookings: snapshot?.bookings ?? [],
    offlineBlocks: snapshot?.offlineBlocks ?? [],
    availability: snapshot?.availability ?? {
      staffId: share.staffId,
      weekly: [],
    },
    leaves: snapshot?.leaves ?? [],
    syncedAt: snapshot?.syncedAt ?? new Date().toISOString(),
  };
  return {
    shareToken: share.shareToken,
    staffId: share.staffId,
    staffName: share.staffName ?? emptySnapshot.staff.name,
    doctorEmail: share.doctorEmail ?? "",
    passwordHash: "",
    branchId: share.branchId ?? "",
    companyName: share.companyName ?? "",
    createdAt: share.createdAt ?? new Date().toISOString(),
    snapshot: { ...emptySnapshot, ...snapshot, staff: snapshot?.staff ?? emptySnapshot.staff },
  };
}

export async function syncDoctorShareToServer(
  share: DoctorCalendarShare,
  password: string,
): Promise<boolean> {
  if (!isAppointmentCrmApiConfigured()) return false;
  try {
    await appointmentCrmAPI.createStaffCalendarShare({
      staffId: share.staffId,
      password: password || undefined,
    });
    return true;
  } catch {
    return false;
  }
}

export async function fetchDoctorShareFromServer(
  shareToken: string,
): Promise<DoctorCalendarShare | null> {
  if (!isAppointmentCrmApiConfigured()) return null;
  try {
    const share = await appointmentCrmAPI.fetchStaffCalendarShare(shareToken);
    return mapShareToLocal(share);
  } catch {
    return null;
  }
}

export async function sendDoctorShareEmailViaApi(
  share: DoctorCalendarShare,
): Promise<boolean> {
  if (!isAppointmentCrmApiConfigured()) return false;
  try {
    const result = await appointmentCrmAPI.sendStaffCalendarShareEmail({
      shareToken: share.shareToken,
    });
    return Boolean(result?.sent);
  } catch {
    return false;
  }
}

export async function validateDoctorLoginViaApi(
  shareToken: string,
  email: string,
  password: string,
): Promise<DoctorCalendarShare | null> {
  if (!isAppointmentCrmApiConfigured()) return null;
  try {
    const share = await appointmentCrmAPI.loginStaffCalendarShare(shareToken, { email, password });
    return mapShareToLocal(share);
  } catch {
    return null;
  }
}

export async function fetchDoctorCalendarDayFromServer(
  shareToken: string,
  date: string,
): Promise<Partial<DoctorCalendarSnapshot> | null> {
  if (!isAppointmentCrmApiConfigured()) return null;
  try {
    const day = await appointmentCrmAPI.fetchStaffCalendarShareDay(shareToken, date);
    const staff = day.staff?.[0] ? mapStaff(day.staff[0]) : undefined;
    if (!staff) return null;
    const availability = day.availabilities?.[0]
      ? mapAvailability(staff.id, day.availabilities[0])
      : undefined;
    return {
      staff,
      branchId: day.branchId,
      bookings: (day.bookings ?? []).map((b) => mapBooking(b)),
      offlineBlocks: (day.blocks ?? []).map(mapOfflineBlock),
      availability,
      leaves: (day.leaves ?? []).map(mapLeave),
      syncedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
