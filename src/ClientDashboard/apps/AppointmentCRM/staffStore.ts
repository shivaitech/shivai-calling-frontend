import { useCallback, useEffect, useState } from "react";
import { getActivePreset } from "./industryConfig";
import { removeAvailabilityForStaff, ensureStaffAvailability } from "./availabilityStore";
import appointmentCrmAPI from "./api/index";
import { mapStaff, staffToApiBody } from "./api/mappers";

export interface StaffMember {
  id: string;
  branchId: string;
  departmentId: string;
  name: string;
  role: string;
  title?: string;
  specialization?: string;
  email?: string;
  phone?: string;
  active: boolean;
  hue: number;
  slotDurationMin: number;
}

// Specialization autocomplete suggestions are a harmless, per-browser UI
// convenience (not business data), so they're still remembered across reloads.
const CUSTOM_SPECIALIZATIONS_KEY = "shivai_appointmentcrm_custom_specializations";
const STAFF_EVENT = "shivai:appointment-staff-changed";

// Staff always come from the API — this is an in-memory cache of the last
// fetch/mutation response, never persisted to localStorage.
let memoryStaff: StaffMember[] = [];

function persistStaff(list: StaffMember[]): void {
  memoryStaff = list;
  window.dispatchEvent(new CustomEvent(STAFF_EVENT));
}

export function writeStaff(list: StaffMember[], opts?: { merge?: boolean }): void {
  if (opts?.merge) {
    const byId = new Map(memoryStaff.map((s) => [s.id, s]));
    list.forEach((s) => byId.set(s.id, s));
    persistStaff([...byId.values()]);
    return;
  }
  persistStaff(list);
}

export function readStaff(): StaffMember[] {
  return memoryStaff;
}

export function getStaffForDepartment(departmentId: string): StaffMember[] {
  return readStaff().filter((s) => s.departmentId === departmentId && s.active);
}

export function getStaffForBranch(branchId: string): StaffMember[] {
  return readStaff().filter((s) => s.branchId === branchId && s.active);
}

export function getStaffById(id: string): StaffMember | undefined {
  return readStaff().find((s) => s.id === id);
}

export async function addStaffMember(params: {
  branchId: string;
  departmentId: string;
  name: string;
  role: string;
  title?: string;
  specialization?: string;
  email?: string;
  phone?: string;
}): Promise<StaffMember> {
  const list = readStaff();
  const preset = getActivePreset();
  const created = await appointmentCrmAPI.createStaff(
    staffToApiBody({ ...params, slotDurationMin: preset.slotDurationMin }),
  );
  const member = mapStaff(created, list.length);
  if (params.specialization?.trim()) {
    member.specialization = params.specialization.trim();
  }
  persistStaff([...list, member]);
  await ensureStaffAvailability(member.id);
  return member;
}

export async function updateStaffMember(id: string, patch: Partial<StaffMember>): Promise<void> {
  const current = getStaffById(id);
  if (current) {
    await appointmentCrmAPI.patchStaff(
      id,
      staffToApiBody({
        name: patch.name ?? current.name,
        title: patch.title ?? current.title,
        role: patch.role ?? current.role,
        email: patch.email ?? current.email,
        phone: patch.phone ?? current.phone,
        branchId: patch.branchId ?? current.branchId,
        departmentId: patch.departmentId ?? current.departmentId,
        slotDurationMin: patch.slotDurationMin ?? current.slotDurationMin,
        active: patch.active ?? current.active,
      }),
    );
  }
  persistStaff(readStaff().map((s) => (s.id === id ? { ...s, ...patch } : s)));
}

export async function removeStaffMember(id: string): Promise<void> {
  await appointmentCrmAPI.deleteStaff(id);
  await removeAvailabilityForStaff(id);
  persistStaff(readStaff().filter((s) => s.id !== id));
}

export function removeStaffForDepartment(departmentId: string): void {
  persistStaff(readStaff().filter((s) => s.departmentId !== departmentId));
}

export function removeStaffForBranch(branchId: string): void {
  persistStaff(readStaff().filter((s) => s.branchId !== branchId));
}

export function staffDisplayName(s: StaffMember): string {
  return s.title ? `${s.title} ${s.name.replace(/^Dr\.\s*/i, "")}`.trim() : s.name;
}

export function staffRoleLine(s: StaffMember): string {
  if (s.specialization) return `${s.role} · ${s.specialization}`;
  return s.role;
}

export function readCustomSpecializations(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_SPECIALIZATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string" && s.trim()) : [];
  } catch {
    return [];
  }
}

function writeCustomSpecializations(list: string[]): void {
  try {
    localStorage.setItem(CUSTOM_SPECIALIZATIONS_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

/** Remember a user-typed specialization for future quick picks. */
export function rememberCustomSpecialization(value: string): void {
  const trimmed = value.trim();
  if (!trimmed) return;
  const merged = [...new Set([...readCustomSpecializations(), trimmed])].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
  writeCustomSpecializations(merged);
}

/** Preset + saved custom + already assigned staff specializations. */
export function getSpecializationSuggestions(presetOptions: string[] = []): string[] {
  const fromStaff = readStaff()
    .map((s) => s.specialization?.trim())
    .filter((s): s is string => Boolean(s));
  return [...new Set([...presetOptions, ...readCustomSpecializations(), ...fromStaff])].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

export function useStaff() {
  const [, force] = useState(0);
  useEffect(() => {
    const sync = () => force((n) => n + 1);
    window.addEventListener(STAFF_EVENT, sync);
    window.addEventListener("shivai:appointment-departments-changed", sync);
    return () => {
      window.removeEventListener(STAFF_EVENT, sync);
      window.removeEventListener("shivai:appointment-departments-changed", sync);
    };
  }, []);

  const staff = readStaff();

  return {
    staff,
    forDepartment: useCallback((departmentId: string) => getStaffForDepartment(departmentId), []),
    forBranch: useCallback((branchId: string) => getStaffForBranch(branchId), []),
    getById: getStaffById,
    addStaffMember,
    updateStaffMember,
    removeStaffMember,
    displayName: staffDisplayName,
  };
}
