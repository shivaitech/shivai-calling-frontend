import { useCallback, useEffect, useState } from "react";
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

const DEPT_EVENT = "shivai:appointment-departments-changed";

// Departments always come from the API — this is an in-memory cache of the
// last fetch/mutation response, never persisted to localStorage.
let memoryDepartments: Department[] = [];

function persistDepartments(list: Department[]): void {
  memoryDepartments = list;
  window.dispatchEvent(new CustomEvent(DEPT_EVENT));
}

export function writeDepartments(list: Department[]): void {
  persistDepartments(list);
}

export function readDepartments(): Department[] {
  return memoryDepartments;
}

export async function addDepartment(branchId: string, name: string, desc?: string): Promise<Department> {
  const list = readDepartments();
  const created = await appointmentCrmAPI.createDepartment(branchId, { name, desc });
  const dept = mapDepartment(created, list.length);
  persistDepartments([...list, dept]);
  return dept;
}

export async function updateDepartment(id: string, patch: Partial<Department>): Promise<void> {
  await appointmentCrmAPI.patchDepartment(id, patch);
  persistDepartments(readDepartments().map((d) => (d.id === id ? { ...d, ...patch } : d)));
}

export async function removeDepartment(id: string): Promise<void> {
  await appointmentCrmAPI.deleteDepartment(id);
  persistDepartments(readDepartments().filter((d) => d.id !== id));
}

export function getDepartmentsForBranch(branchId: string): Department[] {
  return readDepartments().filter((d) => d.branchId === branchId && d.active);
}

export function removeDepartmentsForBranch(branchId: string): void {
  persistDepartments(readDepartments().filter((d) => d.branchId !== branchId));
}

export function useDepartments() {
  const [, force] = useState(0);
  useEffect(() => {
    const sync = () => force((n) => n + 1);
    window.addEventListener(DEPT_EVENT, sync);
    window.addEventListener("shivai:appointment-industry-changed", sync);
    window.addEventListener("shivai:appointment-branches-changed", sync);
    return () => {
      window.removeEventListener(DEPT_EVENT, sync);
      window.removeEventListener("shivai:appointment-industry-changed", sync);
      window.removeEventListener("shivai:appointment-branches-changed", sync);
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
