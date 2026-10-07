import { useEffect, useState } from "react";

export type BranchMode = "single" | "multi";

export interface AppointmentSetup {
  setupComplete: boolean;
  companyName: string;
  industryId: string;
  branchMode: BranchMode;
  timezone: string;
  completedAt?: string;
}

const SETUP_EVENT = "shivai:appointment-setup-changed";
// Harmless UI preference (which branch tab was last viewed) — not business
// data, so it's still allowed to persist across reloads.
const ACTIVE_BRANCH_KEY = "shivai_appointmentcrm_active_branch";

const DEFAULT_SETUP: AppointmentSetup = {
  setupComplete: false,
  companyName: "",
  industryId: "clinic",
  branchMode: "single",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
};

// Setup state lives in memory only, for the lifetime of the tab — it always
// comes from the real API's bootstrap response, never cached to localStorage.
let memorySetup: AppointmentSetup | null = null;

export function readSetup(): AppointmentSetup {
  return memorySetup ? { ...DEFAULT_SETUP, ...memorySetup } : { ...DEFAULT_SETUP };
}

export function writeSetup(patch: Partial<AppointmentSetup>, opts?: { skipEvent?: boolean }): AppointmentSetup {
  const next = { ...readSetup(), ...patch };
  memorySetup = next;
  if (!opts?.skipEvent) window.dispatchEvent(new CustomEvent(SETUP_EVENT));
  return next;
}

export function isSetupComplete(): boolean {
  return readSetup().setupComplete;
}

/** Runs the real backend setup flow (templates, branches) and hydrates the
 * in-memory stores from the fresh bootstrap. There is no local/offline path. */
export async function completeSetup(params: {
  companyName: string;
  industryId: string;
  branchMode: BranchMode;
  timezone?: string;
  branches?: { name: string; address?: string; phone?: string; isPrimary?: boolean }[];
}): Promise<AppointmentSetup> {
  const { appointmentCrmAPI } = await import("./api/index");
  const { templateIdFromIndustry } = await import("./api/mappers");
  const { hydrateFromBootstrap } = await import("./api/hydrate");
  await appointmentCrmAPI.completeSetup({
    templateId: templateIdFromIndustry(params.industryId),
    companyName: params.companyName,
    timezone: params.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    branchMode: params.branchMode,
    branches: params.branches,
  });
  const bootstrap = await appointmentCrmAPI.fetchBootstrap();
  hydrateFromBootstrap(bootstrap);
  return writeSetup({
    companyName: params.companyName,
    industryId: params.industryId,
    branchMode: params.branchMode,
    timezone: params.timezone ?? DEFAULT_SETUP.timezone,
    setupComplete: true,
    completedAt: new Date().toISOString(),
  });
}

export function resetSetup(): void {
  memorySetup = null;
  window.dispatchEvent(new CustomEvent(SETUP_EVENT));
}

/** Uninstalling the app only needs to forget which branch tab was last
 * selected — there's no local business data to wipe anymore; everything
 * else always lives on the backend. */
export function resetAppointmentCrmData(): void {
  resetSetup();
  try {
    localStorage.removeItem(ACTIVE_BRANCH_KEY);
    window.dispatchEvent(new CustomEvent("shivai:appointment-active-branch-changed"));
  } catch {
    /* ignore */
  }
}

export function useAppointmentSetup() {
  const [, force] = useState(0);
  useEffect(() => {
    const sync = () => force((n) => n + 1);
    window.addEventListener(SETUP_EVENT, sync);
    return () => window.removeEventListener(SETUP_EVENT, sync);
  }, []);
  return readSetup();
}
