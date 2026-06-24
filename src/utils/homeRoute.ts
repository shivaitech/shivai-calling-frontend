import { readInstalledAppIds } from "../marketplace/useInstalledApps";

export const APPOINTMENT_CALENDAR_ROUTE = "/app/appointment-crm?section=calendar";

const LAST_ROUTE_KEY = "shivai_last_route";

const SKIP_PERSIST_PREFIXES = [
  "/landing",
  "/reset-password",
  "/auth/",
  "/MyAIEmployee",
  "/doctor-calendar",
  "/website-preview",
];

/** App workspace deep links should not hijack home or dashboard navigation. */
const SKIP_PERSIST_EXACT = ["/", "/dashboard"];

function isAppWorkspacePath(path: string): boolean {
  return path.startsWith("/app/");
}

export function saveLastRoute(path: string): void {
  if (!path || SKIP_PERSIST_EXACT.includes(path)) return;
  if (SKIP_PERSIST_PREFIXES.some((p) => path.startsWith(p))) return;
  // Do not persist marketplace app URLs — reopen uses calendar default, not last CRM section.
  if (isAppWorkspacePath(path)) return;
  try {
    localStorage.setItem(LAST_ROUTE_KEY, path);
  } catch {
    /* ignore */
  }
}

export function readLastRoute(): string | null {
  try {
    return localStorage.getItem(LAST_ROUTE_KEY);
  } catch {
    return null;
  }
}

function isRestorableRoute(path: string): boolean {
  if (!path || path === "/") return false;
  if (isAppWorkspacePath(path)) return false;
  return !SKIP_PERSIST_PREFIXES.some((p) => path.startsWith(p));
}

/** Default landing route after login or visiting `/` (not `/dashboard`). */
export function getHomeRoute(): string {
  const installed = readInstalledAppIds();
  if (installed.includes("appointment-crm")) {
    const last = readLastRoute();
    if (last && isRestorableRoute(last) && last !== "/dashboard") {
      return last;
    }
    return APPOINTMENT_CALENDAR_ROUTE;
  }
  const last = readLastRoute();
  if (last && isRestorableRoute(last)) return last;
  return "/dashboard";
}
