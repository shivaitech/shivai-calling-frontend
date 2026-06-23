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

export function saveLastRoute(path: string): void {
  if (!path || path === "/") return;
  if (SKIP_PERSIST_PREFIXES.some((p) => path.startsWith(p))) return;
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
  return !SKIP_PERSIST_PREFIXES.some((p) => path.startsWith(p));
}

/** Default landing route after login or app reopen. */
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
