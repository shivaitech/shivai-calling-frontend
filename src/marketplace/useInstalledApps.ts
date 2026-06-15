import { useCallback, useEffect, useState } from "react";
import { canInstallApp } from "./apps";

/**
 * ── Installed-apps store ─────────────────────────────────────────────────────
 *
 * Tracks which marketplace apps the current user has installed.
 *
 * STORAGE: localStorage for now, scoped per user. This is intentionally the
 * ONLY place that touches persistence — when the backend / subscription layer
 * lands, swap `readInstalled` + `writeInstalled` for API calls and every
 * consumer (sidebar, marketplace, detail page) keeps working unchanged.
 *
 * SYNC: components in the same tab stay in sync via a custom window event
 * (`INSTALLED_APPS_EVENT`); other tabs sync via the native `storage` event.
 */

const STORAGE_PREFIX = "shivai_installed_apps_";
const INSTALLED_APPS_EVENT = "shivai:installed-apps-changed";

function readAuthUser(): { id?: string; email?: string } | null {
  try {
    const raw = localStorage.getItem("auth_user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    return {
      id: u?.id || u?.user?.id,
      email: u?.email || u?.user?.email,
    };
  } catch {
    return null;
  }
}

/** Resolve the current user id from auth storage to scope installs per-account. */
function getUserId(): string {
  return readAuthUser()?.id || "anon";
}

function storageKey(): string {
  return `${STORAGE_PREFIX}${getUserId()}`;
}

// ── Persistence layer (the swap point for a future backend) ───────────────────

function readInstalled(): string[] {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeInstalled(ids: string[]): void {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(ids));
  } catch {
    /* storage full / unavailable — ignore */
  }
  // Notify listeners in THIS tab (storage event only fires in OTHER tabs).
  window.dispatchEvent(new CustomEvent(INSTALLED_APPS_EVENT));
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UseInstalledApps {
  installedIds: string[];
  isInstalled: (appId: string) => boolean;
  install: (appId: string) => void;
  uninstall: (appId: string) => void;
}

export function useInstalledApps(): UseInstalledApps {
  const [installedIds, setInstalledIds] = useState<string[]>(() => readInstalled());

  // Keep state in sync with storage changes (same tab via custom event,
  // other tabs via native storage event).
  useEffect(() => {
    const sync = () => setInstalledIds(readInstalled());
    window.addEventListener(INSTALLED_APPS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(INSTALLED_APPS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isInstalled = useCallback(
    (appId: string) => installedIds.includes(appId),
    [installedIds]
  );

  const install = useCallback((appId: string) => {
    const email = readAuthUser()?.email;
    if (!canInstallApp(appId, email)) return;
    const current = readInstalled();
    if (current.includes(appId)) return;
    writeInstalled([...current, appId]);
  }, []);

  const uninstall = useCallback((appId: string) => {
    const current = readInstalled();
    if (!current.includes(appId)) return;
    writeInstalled(current.filter((id) => id !== appId));
  }, []);

  return { installedIds, isInstalled, install, uninstall };
}
