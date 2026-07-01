import type { ApiStaff } from "./api/types";
import appointmentCrmAPI from "./api/index";
import { isAppointmentCrmApiConfigured } from "./api/client";
import { setAppointmentCrmApiMode } from "./api/apiMode";
import { hydrateFromBootstrap, hydrateStaffBookingsSchedule, hydrateCalendarDay } from "./api/hydrate";
import { apiId, mapStaff } from "./api/mappers";
import { toIsoDate } from "./availabilityStore";
import { readBranches } from "./branchesStore";
import { getStaffById, type StaffMember } from "./staffStore";

async function fetchApiStaffById(staffId: string): Promise<ApiStaff> {
  try {
    return await appointmentCrmAPI.fetchStaffById(staffId);
  } catch {
    const list = await appointmentCrmAPI.fetchStaff({ active: true });
    const match = list.find((s) => apiId(s) === staffId);
    if (!match) throw new Error("Staff not found");
    return match;
  }
}

/**
 * Load staff calendar data using the API staff `_id` from the URL.
 * Always hits the staff API when CRM API is configured.
 */
export async function loadStaffCalendarById(staffId: string): Promise<StaffMember> {
  if (!staffId.trim()) throw new Error("Staff not found");

  if (!isAppointmentCrmApiConfigured()) {
    const local = getStaffById(staffId);
    if (!local) throw new Error("Staff not found");
    return local;
  }

  setAppointmentCrmApiMode(true);

  const bootstrap = await appointmentCrmAPI.fetchBootstrap();
  hydrateFromBootstrap(bootstrap);

  const apiStaff = await fetchApiStaffById(staffId);
  const resolvedId = apiId(apiStaff);
  const member = mapStaff(apiStaff, 0);
  const branchId = member.branchId;
  const today = toIsoDate(new Date());

  const [allStaff, bookings, availability, leaves, blocks, calendarDay] = await Promise.all([
    appointmentCrmAPI.fetchStaff(branchId ? { branchId, active: true } : { active: true }),
    appointmentCrmAPI.fetchBookings(branchId ? { branchId } : undefined),
    appointmentCrmAPI.fetchAvailability(resolvedId).catch(() => null),
    appointmentCrmAPI.fetchLeaves(resolvedId).catch(() => []),
    appointmentCrmAPI.fetchOfflineBlocks({ staffId: resolvedId }).catch(() => []),
    branchId
      ? appointmentCrmAPI
          .fetchCalendarDay({ branchId, date: today, staffId: resolvedId })
          .catch(() => null)
      : Promise.resolve(null),
  ]);

  const branches = readBranches();
  await hydrateStaffBookingsSchedule({
    staff: allStaff.map((s, i) => mapStaff(s, i)),
    bookings,
    branches,
    availabilities: availability
      ? [{ staffId: resolvedId, weekly: availability.weekly, dailyBreak: availability.dailyBreak }]
      : undefined,
    leaves,
    blocks,
  });

  if (calendarDay) {
    hydrateCalendarDay(calendarDay, branches);
  }

  const loaded = getStaffById(resolvedId);
  if (!loaded) throw new Error("Staff not found");
  return loaded;
}
