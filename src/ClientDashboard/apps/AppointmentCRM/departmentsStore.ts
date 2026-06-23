import { useCallback, useEffect, useState } from "react";
import { getActivePreset } from "./industryConfig";
import { Branch } from "./branchesStore";

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

function makeId(): string {
  return `dept-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function readDepartments(): Department[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeDepartments(list: Department[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(DEPT_EVENT));
  } catch {
    /* ignore */
  }
}

export function getDepartmentsForBranch(branchId: string): Department[] {
  return readDepartments().filter((d) => d.branchId === branchId && d.active);
}

export function addDepartment(branchId: string, name: string, desc?: string): Department {
  const list = readDepartments();
  const dept: Department = {
    id: makeId(),
    branchId,
    name: name.trim(),
    desc: desc?.trim(),
    hue: HUES[list.length % HUES.length],
    active: true,
  };
  writeDepartments([...list, dept]);
  return dept;
}

export function updateDepartment(id: string, patch: Partial<Department>): void {
  writeDepartments(readDepartments().map((d) => (d.id === id ? { ...d, ...patch } : d)));
}

export function removeDepartment(id: string): void {
  writeDepartments(readDepartments().filter((d) => d.id !== id));
}

export function removeDepartmentsForBranch(branchId: string): void {
  writeDepartments(readDepartments().filter((d) => d.branchId !== branchId));
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
