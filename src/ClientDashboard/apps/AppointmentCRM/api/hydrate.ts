import { setActiveIndustryId } from "../industryConfig";
import { writeBranches, setActiveBranchId } from "../branchesStore";
import { writeDepartments } from "../departmentsStore";
import { writeStaff } from "../staffStore";
import { writeBookings } from "../bookingsStore";
import {
  writeAvailabilityList,
  writeLeavesList,
} from "../availabilityStore";
import { writeOfflineBlocks } from "../offlineBlocksStore";
import { writeSetup } from "../setupStore";
import type { ApiBooking, ApiBootstrap, ApiCalendarDay, ApiOfflineBlock } from "./types";
import {
  mapAvailability,
  mapBooking,
  mapBranch,
  mapDepartment,
  mapLeave,
  mapOfflineBlock,
  mapSetupFromBootstrap,
  mapStaff,
} from "./mappers";
import type { Branch } from "../branchesStore";

export function hydrateFromBootstrap(bootstrap: ApiBootstrap): void {
  const setup = mapSetupFromBootstrap(bootstrap);
  writeSetup(setup);
  setActiveIndustryId(setup.industryId);

  const branches = (bootstrap.branches ?? []).map((b, i) => mapBranch(b, i));
  writeBranches(branches);

  const activeId = bootstrap.preferences?.activeBranchId;
  if (activeId && branches.some((b) => b.id === activeId)) {
    setActiveBranchId(activeId, { fromApi: true });
  } else if (branches.length) {
    const primary = branches.find((b) => b.isPrimary) ?? branches[0];
    if (primary) setActiveBranchId(primary.id, { fromApi: true });
  }

  const departments = (bootstrap.departments ?? []).map((d, i) => mapDepartment(d, i));
  writeDepartments(departments);
}

export async function hydrateStaffBookingsSchedule(params: {
  staff: ReturnType<typeof mapStaff>[];
  bookings: ApiBooking[];
  branches: Branch[];
  availabilities?: { staffId?: string; weekly: unknown[]; dailyBreak?: unknown }[];
  leaves?: Parameters<typeof mapLeave>[0][];
  blocks?: ApiOfflineBlock[];
}): Promise<void> {
  writeStaff(params.staff);

  const branchMap = new Map(params.branches.map((b) => [b.id, b.name]));
  const bookings = params.bookings.map((b) =>
    mapBooking(b, { branchName: branchMap.get(b.branchId ?? "") ?? "" }),
  );
  writeBookings(bookings);

  if (params.availabilities?.length) {
    const list = params.availabilities
      .filter((a) => a.staffId)
      .map((a) =>
        mapAvailability(a.staffId!, { weekly: a.weekly as never, dailyBreak: a.dailyBreak as never }),
      );
    writeAvailabilityList(list);
  }

  if (params.leaves?.length) {
    writeLeavesList(params.leaves.map(mapLeave));
  }

  if (params.blocks?.length) {
    writeOfflineBlocks(params.blocks.map(mapOfflineBlock));
  }
}

export function hydrateCalendarDay(day: ApiCalendarDay, branches: Branch[]): void {
  const branchName = branches.find((b) => b.id === day.branchId)?.name ?? "";
  const staff = (day.staff ?? []).map((s, i) => mapStaff(s, i));
  writeStaff(staff, { merge: true });

  const bookings = (day.bookings ?? []).map((b) => mapBooking(b, { branchName }));
  writeBookings(bookings, { merge: true });

  const availabilities = (day.availabilities ?? [])
    .filter((a) => a.staffId)
    .map((a) => mapAvailability(a.staffId!, { weekly: a.weekly, dailyBreak: a.dailyBreak }));
  if (availabilities.length) writeAvailabilityList(availabilities, { merge: true });

  if (day.leaves?.length) writeLeavesList(day.leaves.map(mapLeave), { merge: true });
  if (day.blocks?.length) {
    writeOfflineBlocks(day.blocks.map(mapOfflineBlock), { merge: true });
  }
}
