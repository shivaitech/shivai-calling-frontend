import { useCallback, useEffect, useState } from "react";
import { getActivePreset } from "./industryConfig";
import { Branch } from "./branchesStore";
import { isAppointmentCrmApiMode } from "./api/apiMode";
import appointmentCrmAPI from "./api/index";
import { mapDepartment } from "./api/mappers";

export interface Department {
  id: string;
  branchId: string;
  name: string;
  desc?: string;
  hue: number;
  active: boolean;
}

const STORAGE_KEY = "shivai_appointmentcrm_departments";
const DEPT_EVENT = "shivai:appointment-departments-changed";
const HUES = [265, 200, 330, 150, 25, 210, 95, 280];

let memoryDepartments: Department[] | null = null;

function persistDepartments(list: Department[], fromApi = false): void {
  memoryDepartments = list;
  try {
    if (!isAppointmentCrmApiMode() || !fromApi) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
    window.dispatchEvent(new CustomEvent(DEPT_EVENT));
  } catch {
    /* ignore */
  }
}

export function writeDepartments(list: Department[], opts?: { fromApi?: boolean }): void {
  persistDepartments(list, opts?.fromApi);
}

function makeId(): string {
  return `dept-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function readDepartments(): Department[] {
  if (memoryDepartments) return memoryDepartments;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addDepartment(branchId: string, name: string, desc?: string): Promise<Department> {
  const list = readDepartments();
  if (isAppointmentCrmApiMode()) {
    const created = await appointmentCrmAPI.createDepartment(branchId, { name, desc });
    const dept = mapDepartment(created, list.length);
    persistDepartments([...list, dept], true);
    return dept;
  }
  const dept: Department = {
    id: makeId(),
    branchId,
    name: name.trim(),
    desc: desc?.trim(),
    hue: HUES[list.length % HUES.length],
    active: true,
  };
  persistDepartments([...list, dept]);
  return dept;
}

export async function updateDepartment(id: string, patch: Partial<Department>): Promise<void> {
  if (isAppointmentCrmApiMode()) {
    await appointmentCrmAPI.patchDepartment(id, patch);
  }
  persistDepartments(
    readDepartments().map((d) => (d.id === id ? { ...d, ...patch } : d)),
    isAppointmentCrmApiMode(),
  );
}

export async function removeDepartment(id: string): Promise<void> {
  if (isAppointmentCrmApiMode()) {
    await appointmentCrmAPI.deleteDepartment(id);
  }
  persistDepartments(readDepartments().filter((d) => d.id !== id), isAppointmentCrmApiMode());
}

export function getDepartmentsForBranch(branchId: string): Department[] {
  return readDepartments().filter((d) => d.branchId === branchId && d.active);
}

export function removeDepartmentsForBranch(branchId: string): void {
  persistDepartments(readDepartments().filter((d) => d.branchId !== branchId), isAppointmentCrmApiMode());
}

export function seedDepartmentsForBranches(branches: Branch[]): Department[] {
  const preset = getActivePreset();
  const existing = readDepartments();
  if (existing.length) return existing;

  const created: Department[] = [];
  branches.forEach((branch) => {
    preset.services.forEach((svc, i) => {
      created.push({
        id: `dept-${branch.id}-${i}`,
        branchId: branch.id,
        name: svc,
        desc: `${svc} — ${branch.name}`,
        hue: HUES[i % HUES.length],
        active: true,
      });
    });
  });
  writeDepartments(created);
  return created;
}

export function useDepartments() {
  const [, force] = useState(0);
  useEffect(() => {
    const sync = () => force((n) => n + 1);
    window.addEventListener(DEPT_EVENT, sync);
    window.addEventListener("shivai:appointment-industry-changed", sync);
    window.addEventListener("shivai:appointment-branches-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DEPT_EVENT, sync);
      window.removeEventListener("shivai:appointment-industry-changed", sync);
      window.removeEventListener("shivai:appointment-branches-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const departments = readDepartments();

  return {
    departments,
    forBranch: useCallback((branchId: string) => getDepartmentsForBranch(branchId), []),
    addDepartment,
    updateDepartment,
    removeDepartment,
  };
}
