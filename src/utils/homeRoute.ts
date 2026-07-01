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
  // Do not persist marketplace app URLs — apps open only when the user chooses them.
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

/** Default landing route after login — always the main dashboard (apps open only when user picks them). */
export function getHomeRoute(): string {
  return "/dashboard";
}
