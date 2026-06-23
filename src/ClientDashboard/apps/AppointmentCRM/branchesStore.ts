import { useEffect, useState } from "react";
import { BranchSeed } from "./industryConfig";
import { removeDepartmentsForBranch } from "./departmentsStore";
import { removeStaffForBranch } from "./staffStore";

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

function makeId(): string {
  return `br-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function readBranches(): Branch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeBranches(branches: Branch[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(branches));
    window.dispatchEvent(new CustomEvent(BRANCH_EVENT));
    const activeId = getActiveBranchId();
    if (activeId && !branches.some((b) => b.id === activeId)) {
      const fallback = branches.find((b) => b.isPrimary) ?? branches[0];
      if (fallback) setActiveBranchId(fallback.id);
      else clearActiveBranchId();
    }
  } catch {
    /* ignore */
  }
}

export function getActiveBranchId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_BRANCH_KEY);
  } catch {
    return null;
  }
}

export function setActiveBranchId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_BRANCH_KEY, id);
    window.dispatchEvent(new CustomEvent(ACTIVE_BRANCH_EVENT));
  } catch {
    /* ignore */
  }
}

export function clearActiveBranchId(): void {
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

export function addBranch(name: string, address?: string): Branch {
  const branches = readBranches();
  const branch: Branch = {
    id: makeId(),
    name,
    address,
    isPrimary: branches.length === 0,
    active: true,
  };
  writeBranches([...branches, branch]);
  if (branches.length === 0) setActiveBranchId(branch.id);
  return branch;
}

export function updateBranch(id: string, patch: Partial<Branch>): void {
  writeBranches(
    readBranches().map((b) => (b.id === id ? { ...b, ...patch } : b)),
  );
}

export function removeBranch(id: string): void {
  removeDepartmentsForBranch(id);
  removeStaffForBranch(id);
  const next = readBranches().filter((b) => b.id !== id);
  if (next.length && !next.some((b) => b.isPrimary)) {
    next[0].isPrimary = true;
  }
  writeBranches(next);
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
