import { useCallback, useEffect, useState } from "react";
import { Department } from "./departmentsStore";
import { Branch } from "./branchesStore";
import { getActivePreset } from "./industryConfig";
import { removeAvailabilityForStaff, ensureStaffAvailability, seedAvailabilityForStaff } from "./availabilityStore";
import { isAppointmentCrmApiMode } from "./api/apiMode";
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

const STORAGE_KEY = "shivai_appointmentcrm_staff";
const CUSTOM_SPECIALIZATIONS_KEY = "shivai_appointmentcrm_custom_specializations";
const STAFF_EVENT = "shivai:appointment-staff-changed";
const HUES = [220, 280, 160, 40, 310, 180, 100, 250];

let memoryStaff: StaffMember[] | null = null;

function persistStaff(list: StaffMember[], fromApi = false): void {
  memoryStaff = list;
  try {
    if (!isAppointmentCrmApiMode() || !fromApi) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
    window.dispatchEvent(new CustomEvent(STAFF_EVENT));
  } catch {
    /* ignore */
  }
}

export function writeStaff(list: StaffMember[], opts?: { fromApi?: boolean; merge?: boolean }): void {
  if (opts?.merge && memoryStaff) {
    const byId = new Map(memoryStaff.map((s) => [s.id, s]));
    list.forEach((s) => byId.set(s.id, s));
    persistStaff([...byId.values()], opts?.fromApi);
    return;
  }
  persistStaff(list, opts?.fromApi);
}

const DEMO_NAMES = [
  { name: "Dr. Sharma", title: "Dr.", role: "Senior Physician" },
  { name: "Dr. Patel", title: "Dr.", role: "Specialist" },
  { name: "Dr. Iyer", title: "Dr.", role: "Consultant" },
  { name: "Dr. Rao", title: "Dr.", role: "Attending" },
  { name: "Dr. Menon", title: "Dr.", role: "Physician" },
  { name: "Nurse Ananya", title: "", role: "Staff Nurse" },
  { name: "Receptionist Kiran", title: "", role: "Front Desk" },
];

function makeId(): string {
  return `st-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function readStaff(): StaffMember[] {
  if (memoryStaff) return memoryStaff;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
  if (isAppointmentCrmApiMode()) {
    const created = await appointmentCrmAPI.createStaff(
      staffToApiBody({ ...params, slotDurationMin: preset.slotDurationMin }),
    );
    const member = mapStaff(created, list.length);
    if (params.specialization?.trim()) {
      member.specialization = params.specialization.trim();
    }
    persistStaff([...list, member], true);
    ensureStaffAvailability(member.id);
    return member;
  }
  const member: StaffMember = {
    id: makeId(),
    branchId: params.branchId,
    departmentId: params.departmentId,
    name: params.name.trim(),
    role: params.role.trim(),
    title: params.title?.trim(),
    specialization: params.specialization?.trim(),
    email: params.email?.trim(),
    phone: params.phone?.trim(),
    active: true,
    hue: HUES[list.length % HUES.length],
    slotDurationMin: preset.slotDurationMin,
  };
  persistStaff([...list, member]);
  ensureStaffAvailability(member.id);
  return member;
}

export async function updateStaffMember(id: string, patch: Partial<StaffMember>): Promise<void> {
  const current = getStaffById(id);
  if (isAppointmentCrmApiMode() && current) {
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
  persistStaff(readStaff().map((s) => (s.id === id ? { ...s, ...patch } : s)), isAppointmentCrmApiMode());
}

export async function removeStaffMember(id: string): Promise<void> {
  if (isAppointmentCrmApiMode()) {
    await appointmentCrmAPI.deleteStaff(id);
  }
  removeAvailabilityForStaff(id);
  persistStaff(readStaff().filter((s) => s.id !== id), isAppointmentCrmApiMode());
}

export function removeStaffForDepartment(departmentId: string): void {
  persistStaff(readStaff().filter((s) => s.departmentId !== departmentId), isAppointmentCrmApiMode());
}

export function removeStaffForBranch(branchId: string): void {
  persistStaff(readStaff().filter((s) => s.branchId !== branchId), isAppointmentCrmApiMode());
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

export function seedStaffForOrg(branches: Branch[], departments: Department[]): StaffMember[] {
  const existing = readStaff();
  if (existing.length) return existing;

  const preset = getActivePreset();
  const created: StaffMember[] = [];
  let nameIdx = 0;

  departments.forEach((dept, di) => {
    const demo = DEMO_NAMES[nameIdx % DEMO_NAMES.length];
    nameIdx += 1;
    const isProvider = demo.role.includes("Physician") || demo.role.includes("Specialist") || demo.role.includes("Consultant") || demo.role.includes("Attending");
    created.push({
      id: `st-${dept.id}-0`,
      branchId: dept.branchId,
      departmentId: dept.id,
      name: isProvider ? demo.name.replace(/^Dr\.\s*/, "") : demo.name,
      title: demo.title || undefined,
      role: isProvider ? preset.terms.provider : demo.role,
      active: true,
      hue: HUES[di % HUES.length],
      slotDurationMin: preset.slotDurationMin,
    });
  });

  writeStaff(created);
  seedAvailabilityForStaff(created.map((s) => s.id));
  return created;
}

export function useStaff() {
  const [, force] = useState(0);
  useEffect(() => {
    const sync = () => force((n) => n + 1);
    window.addEventListener(STAFF_EVENT, sync);
    window.addEventListener("shivai:appointment-departments-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STAFF_EVENT, sync);
      window.removeEventListener("shivai:appointment-departments-changed", sync);
      window.removeEventListener("storage", sync);
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
