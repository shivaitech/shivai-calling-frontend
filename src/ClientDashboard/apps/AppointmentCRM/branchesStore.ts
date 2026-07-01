import { useEffect, useState } from "react";
import { BranchSeed } from "./industryConfig";
import { removeDepartmentsForBranch } from "./departmentsStore";
import { removeStaffForBranch } from "./staffStore";
import { isAppointmentCrmApiMode } from "./api/apiMode";
import { mapBranch } from "./api/mappers";
import appointmentCrmAPI from "./api/index";

export interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  isPrimary?: boolean;
  active?: boolean;
}

const STORAGE_KEY = "shivai_appointmentcrm_branches";
const ACTIVE_BRANCH_KEY = "shivai_appointmentcrm_active_branch";
const BRANCH_EVENT = "shivai:appointment-branches-changed";
const ACTIVE_BRANCH_EVENT = "shivai:appointment-active-branch-changed";

let memoryBranches: Branch[] | null = null;
let memoryActiveBranchId: string | null | undefined;

function persistBranches(branches: Branch[], fromApi = false): void {
  memoryBranches = branches;
  try {
    if (!isAppointmentCrmApiMode() || !fromApi) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(branches));
    }
    window.dispatchEvent(new CustomEvent(BRANCH_EVENT));
    const activeId = getActiveBranchId();
    if (activeId && !branches.some((b) => b.id === activeId)) {
      const fallback = branches.find((b) => b.isPrimary) ?? branches[0];
      if (fallback) void setActiveBranchId(fallback.id);
      else clearActiveBranchId();
    }
  } catch {
    /* ignore */
  }
}

export function writeBranches(branches: Branch[], opts?: { fromApi?: boolean }): void {
  persistBranches(branches, opts?.fromApi);
}

function makeId(): string {
  return `br-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function readBranches(): Branch[] {
  if (memoryBranches) return memoryBranches;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getActiveBranchId(): string | null {
  if (memoryActiveBranchId !== undefined) return memoryActiveBranchId;
  try {
    return localStorage.getItem(ACTIVE_BRANCH_KEY);
  } catch {
    return null;
  }
}

export async function setActiveBranchId(id: string, opts?: { fromApi?: boolean }): Promise<void> {
  if (isAppointmentCrmApiMode() && !opts?.fromApi) {
    await appointmentCrmAPI.setActiveBranch(id);
  }
  memoryActiveBranchId = id;
  try {
    if (!isAppointmentCrmApiMode()) {
      localStorage.setItem(ACTIVE_BRANCH_KEY, id);
    }
    window.dispatchEvent(new CustomEvent(ACTIVE_BRANCH_EVENT));
  } catch {
    /* ignore */
  }
}

export function clearActiveBranchId(): void {
  memoryActiveBranchId = null;
  try {
    localStorage.removeItem(ACTIVE_BRANCH_KEY);
    window.dispatchEvent(new CustomEvent(ACTIVE_BRANCH_EVENT));
  } catch {
    /* ignore */
  }
}

export function resolveActiveBranch(branches: Branch[]): Branch | null {
  if (!branches.length) return null;
  const stored = getActiveBranchId();
  if (stored) {
    const match = branches.find((b) => b.id === stored);
    if (match) return match;
  }
  return branches.find((b) => b.isPrimary) ?? branches[0] ?? null;
}

/** Call after seeding branches so Command Center has a default context. */
export function ensureActiveBranch(branches: Branch[]): Branch | null {
  const resolved = resolveActiveBranch(branches);
  if (resolved && getActiveBranchId() !== resolved.id) {
    setActiveBranchId(resolved.id);
  }
  return resolved;
}

export function seedBranchesFromPreset(seeds: BranchSeed[], mode: "single" | "multi"): Branch[] {
  const list = mode === "single" ? seeds.slice(0, 1) : seeds;
  const branches: Branch[] = list.map((s, i) => ({
    id: makeId(),
    name: s.name,
    address: s.address,
    isPrimary: i === 0,
    active: true,
  }));
  writeBranches(branches);
  ensureActiveBranch(branches);
  return branches;
}

export async function addBranch(name: string, address?: string): Promise<Branch> {
  const branches = readBranches();
  if (isAppointmentCrmApiMode()) {
    const created = await appointmentCrmAPI.createBranch({
      name,
      address,
      isPrimary: branches.length === 0,
    });
    const branch = mapBranch(created, branches.length);
    persistBranches([...branches, branch], true);
    if (branches.length === 0) await setActiveBranchId(branch.id);
    return branch;
  }
  const branch: Branch = {
    id: makeId(),
    name,
    address,
    isPrimary: branches.length === 0,
    active: true,
  };
  persistBranches([...branches, branch]);
  if (branches.length === 0) await setActiveBranchId(branch.id);
  return branch;
}

export async function updateBranch(id: string, patch: Partial<Branch>): Promise<void> {
  if (isAppointmentCrmApiMode()) {
    await appointmentCrmAPI.patchBranch(id, patch);
  }
  persistBranches(readBranches().map((b) => (b.id === id ? { ...b, ...patch } : b)), isAppointmentCrmApiMode());
}

export async function removeBranch(id: string): Promise<void> {
  if (isAppointmentCrmApiMode()) {
    await appointmentCrmAPI.deleteBranch(id);
  }
  removeDepartmentsForBranch(id);
  removeStaffForBranch(id);
  const next = readBranches().filter((b) => b.id !== id);
  if (next.length && !next.some((b) => b.isPrimary)) {
    next[0].isPrimary = true;
  }
  persistBranches(next, isAppointmentCrmApiMode());
}

export function useBranches() {
  const [, force] = useState(0);
  useEffect(() => {
    const sync = () => force((n) => n + 1);
    window.addEventListener(BRANCH_EVENT, sync);
    window.addEventListener(ACTIVE_BRANCH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(BRANCH_EVENT, sync);
      window.removeEventListener(ACTIVE_BRANCH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return readBranches();
}

export function useActiveBranch() {
  const branches = useBranches();
  const [, force] = useState(0);

  useEffect(() => {
    const sync = () => force((n) => n + 1);
    window.addEventListener(BRANCH_EVENT, sync);
    window.addEventListener(ACTIVE_BRANCH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(BRANCH_EVENT, sync);
      window.removeEventListener(ACTIVE_BRANCH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const activeBranch = resolveActiveBranch(branches);

  return {
    branches,
    activeBranch,
    activeBranchId: activeBranch?.id ?? null,
    setActiveBranch: setActiveBranchId,
  };
}
