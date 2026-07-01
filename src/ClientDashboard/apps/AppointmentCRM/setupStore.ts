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

const STORAGE_KEY = "shivai_appointmentcrm_setup_v1";
const SETUP_EVENT = "shivai:appointment-setup-changed";

const DEFAULT_SETUP: AppointmentSetup = {
  setupComplete: false,
  companyName: "",
  industryId: "clinic",
  branchMode: "single",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
};

let memorySetup: AppointmentSetup | null = null;

export function readSetup(): AppointmentSetup {
  if (memorySetup) return { ...DEFAULT_SETUP, ...memorySetup };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETUP };
    return { ...DEFAULT_SETUP, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETUP };
  }
}

export function writeSetup(
  patch: Partial<AppointmentSetup>,
  opts?: { fromApi?: boolean; skipEvent?: boolean },
): AppointmentSetup {
  const next = { ...readSetup(), ...patch };
  memorySetup = next;
  try {
    if (!opts?.fromApi) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    if (!opts?.skipEvent) window.dispatchEvent(new CustomEvent(SETUP_EVENT));
  } catch {
    /* ignore */
  }
  return next;
}

export function isSetupComplete(): boolean {
  return readSetup().setupComplete;
}

export function completeSetup(params: {
  companyName: string;
  industryId: string;
  branchMode: BranchMode;
  timezone?: string;
}): AppointmentSetup {
  return writeSetup({
    ...params,
    setupComplete: true,
    completedAt: new Date().toISOString(),
  });
}

export async function completeSetupViaApi(params: {
  companyName: string;
  industryId: string;
  branchMode: BranchMode;
  timezone?: string;
  branches?: { name: string; address?: string; phone?: string; isPrimary?: boolean }[];
}): Promise<AppointmentSetup> {
  const { appointmentCrmAPI } = await import("./api/index");
  const { templateIdFromIndustry } = await import("./api/mappers");
  const { hydrateFromBootstrap } = await import("./api/hydrate");
  const { setAppointmentCrmApiMode } = await import("./api/apiMode");
  setAppointmentCrmApiMode(true);
  await appointmentCrmAPI.completeSetup({
    templateId: templateIdFromIndustry(params.industryId),
    companyName: params.companyName,
    timezone: params.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    branchMode: params.branchMode,
    branches: params.branches,
  });
  const bootstrap = await appointmentCrmAPI.fetchBootstrap();
  hydrateFromBootstrap(bootstrap);
  return writeSetup(
    {
      companyName: params.companyName,
      industryId: params.industryId,
      branchMode: params.branchMode,
      timezone: params.timezone,
      setupComplete: true,
      completedAt: new Date().toISOString(),
    },
    { fromApi: true },
  );
}

export function resetSetup(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(SETUP_EVENT));
  } catch {
    /* ignore */
  }
}

export function useAppointmentSetup() {
  const [, force] = useState(0);
  useEffect(() => {
    const sync = () => force((n) => n + 1);
    window.addEventListener(SETUP_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SETUP_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return readSetup();
}
