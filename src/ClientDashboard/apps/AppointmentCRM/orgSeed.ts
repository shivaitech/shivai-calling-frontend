import { useEffect, useState } from "react";
import { Branch, ensureActiveBranch } from "./branchesStore";
import { Department, seedDepartmentsForBranches } from "./departmentsStore";
import { StaffMember, seedStaffForOrg } from "./staffStore";
import { seedBookingsFromOrg } from "./bookingsStore";
import { seedAvailabilityForStaff } from "./availabilityStore";
import { seedOfflineBlocksFromOrg } from "./offlineBlocksStore";

/** Seeds branch → department → staff → sample bookings after setup. */
export function seedOrgHierarchy(branches: Branch[]): {
  departments: Department[];
  staff: StaffMember[];
} {
  const departments = seedDepartmentsForBranches(branches);
  const staff = seedStaffForOrg(branches, departments);
  seedAvailabilityForStaff(staff.map((s) => s.id));
  seedBookingsFromOrg(branches, departments, staff);
  seedOfflineBlocksFromOrg(branches, departments, staff);
  ensureActiveBranch(branches);
  return { departments, staff };
}

/** Rebuild hierarchy when industry changes (keeps branches, refreshes depts/staff). */
export function rebuildOrgFromIndustry(branches: Branch[]): void {
  if (!branches.length) return;
  try {
    localStorage.removeItem("shivai_appointmentcrm_departments");
    localStorage.removeItem("shivai_appointmentcrm_staff");
    localStorage.removeItem("shivai_appointmentcrm_bookings");
    localStorage.removeItem("shivai_appointmentcrm_availability");
    localStorage.removeItem("shivai_appointmentcrm_leaves");
    localStorage.removeItem("shivai_appointmentcrm_offline_blocks");
  } catch {
    /* ignore */
  }
  seedOrgHierarchy(branches);
  window.dispatchEvent(new CustomEvent("shivai:appointment-departments-changed"));
  window.dispatchEvent(new CustomEvent("shivai:appointment-staff-changed"));
}

export function ensureOrgSeeded(branches: Branch[]): void {
  if (!branches.length) return;
  const hasDepts = localStorage.getItem("shivai_appointmentcrm_departments");
  if (!hasDepts) {
    seedOrgHierarchy(branches);
    return;
  }
  ensureActiveBranch(branches);
  const staffRaw = localStorage.getItem("shivai_appointmentcrm_staff");
  if (staffRaw) {
    try {
      const staff = JSON.parse(staffRaw) as { id: string }[];
      if (Array.isArray(staff)) seedAvailabilityForStaff(staff.map((s) => s.id));
    } catch {
      /* ignore */
    }
  }
}

export function useEnsureOrgSeeded(branches: Branch[]) {
  useEffect(() => {
    ensureOrgSeeded(branches);
  }, [branches.length]);
}
