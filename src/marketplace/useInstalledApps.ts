import { useCallback, useEffect, useSyncExternalStore } from "react";
import { canInstallApp } from "./apps";
import { useAuth } from "../contexts/AuthContext";
import {
  APP_ID_TO_SKILL_NAME,
  SKILL_NAME_TO_APP_ID,
  SkillAppsError,
  hasAuthToken,
  skillAppsAPI,
} from "../services/skillAppsAPI";

/**
 * ── Installed-apps store ─────────────────────────────────────────────────────
 *
 * Which marketplace apps the current tenant has installed. The server
 * (/api/v1/skill-apps, see skillAppsAPI.ts) is the source of truth; localStorage
 * keeps a per-user copy so the sidebar and app guards render instantly on load
 * and keep working for accounts the API refuses (403 — e.g. sub-tenant staff).
 *
 * One module-level store shared by every hook instance; changes are broadcast with
 * a window event (same tab) and the storage event (other tabs).
 */

const STORAGE_PREFIX = "shivai_installed_apps_";
const MIGRATED_PREFIX = "shivai_installed_apps_migrated_";
const INSTALLED_APPS_EVENT = "shivai:installed-apps-changed";

interface Store {
  userKey: string;
  ids: string[];
  /** Server document ids per app (an app can have several: one per agent association). */
  docs: Record<string, string[]>;
  /** true once the server list has loaded (or we've settled on local-only). */
  ready: boolean;
  /** "local" = the API refused this account; installs stay in this browser only. */
  source: "server" | "local";
}

let store: Store = { userKey: "", ids: [], docs: {}, ready: false, source: "server" };
let loading: Promise<void> | null = null;

// ── local copy ───────────────────────────────────────────────────────────────

function readLocal(userKey: string): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_PREFIX + userKey) || "[]");
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeLocal(userKey: string, ids: string[]) {
  try {
    localStorage.setItem(STORAGE_PREFIX + userKey, JSON.stringify(ids));
  } catch {
    /* storage full / unavailable */
  }
}

function setStore(patch: Partial<Store>) {
  store = { ...store, ...patch };
  if (patch.ids) writeLocal(store.userKey, store.ids);
  window.dispatchEvent(new CustomEvent(INSTALLED_APPS_EVENT));
}

// ── server sync ──────────────────────────────────────────────────────────────

const byApp = (apps: { _id: string; name: string }[]) => {
  const docs: Record<string, string[]> = {};
  for (const a of apps) {
    const id = SKILL_NAME_TO_APP_ID[a.name as keyof typeof SKILL_NAME_TO_APP_ID];
    if (id) (docs[id] ??= []).push(a._id);
  }
  return docs;
};

/** Replaces the list with the server's — unless the account changed while we waited. */
async function refresh(userKey = store.userKey) {
  const docs = byApp(await skillAppsAPI.list());
  if (store.userKey !== userKey) return;
  setStore({ docs, ids: Object.keys(docs), ready: true, source: "server" });
}

/** Loads the server list for this user; installs made before the API existed are uploaded once. */
function load(userKey: string): Promise<void> {
  if (store.userKey === userKey && (store.ready || loading)) return loading ?? Promise.resolve();
  const local = readLocal(userKey);
  store = { userKey, ids: local, docs: {}, ready: false, source: "server" };
  window.dispatchEvent(new CustomEvent(INSTALLED_APPS_EVENT));

  if (userKey === "anon" || !hasAuthToken()) {
    setStore({ ready: true, source: "local" });
    return Promise.resolve();
  }

  loading = (async () => {
    try {
      await refresh(userKey);
      const migratedKey = MIGRATED_PREFIX + userKey;
      if (store.userKey === userKey && !localStorage.getItem(migratedKey)) {
        const missing = local.filter((id) => !store.ids.includes(id) && APP_ID_TO_SKILL_NAME[id]);
        await Promise.allSettled(missing.map((id) => skillAppsAPI.install(APP_ID_TO_SKILL_NAME[id])));
        localStorage.setItem(migratedKey, "1");
        if (missing.length) await refresh(userKey);
      }
    } catch (e) {
      // 403: this role can't use the API. 404: the API isn't deployed yet on this server.
      // Either way keep the browser-only list (the one-time upload above runs once the API
      // answers). 401/network: show the cached list; the next load tries again.
      if (store.userKey !== userKey) return;
      const status = (e as SkillAppsError).status;
      setStore({ ready: true, source: status === 403 || status === 404 ? "local" : "server" });
    } finally {
      if (store.userKey === userKey) loading = null;
    }
  })();
  return loading;
}

// ── actions (optimistic; roll back if the server refuses) ───────────────────

async function installApp(appId: string, email?: string): Promise<void> {
  if (!canInstallApp(appId, email) || store.ids.includes(appId)) return;
  const before = store.ids;
  setStore({ ids: [...before, appId] }); // instant: callers may navigate into the app right away
  const name = APP_ID_TO_SKILL_NAME[appId];
  if (store.source === "local" || !name) return;
  try {
    const created = await skillAppsAPI.install(name);
    setStore({ docs: { ...store.docs, [appId]: [...(store.docs[appId] ?? []), created._id] } });
  } catch (e) {
    const status = (e as SkillAppsError).status;
    if (status === 409) return void refresh().catch(() => {}); // already installed
    // 404 without an agent_id = the endpoint isn't deployed: keep the local install;
    // it's uploaded once the API is live (see load()).
    if (status === 404) return setStore({ source: "local" });
    setStore({ ids: store.ids.filter((id) => id !== appId) });
    throw e;
  }
}

async function uninstallApp(appId: string): Promise<void> {
  if (!store.ids.includes(appId)) return;
  const before = { ids: store.ids, docs: store.docs };
  setStore({ ids: store.ids.filter((id) => id !== appId) });
  if (store.source === "local" || !APP_ID_TO_SKILL_NAME[appId]) return;
  try {
    let docIds = before.docs[appId];
    if (!docIds?.length) docIds = byApp(await skillAppsAPI.list())[appId] ?? [];
    // 404 on delete = already gone; that's the outcome we wanted.
    await Promise.all(
      docIds.map((id) =>
        skillAppsAPI.uninstall(id).catch((err: SkillAppsError) => {
          if (err.status !== 404) throw err;
        }),
      ),
    );
    const docs = { ...store.docs };
    delete docs[appId];
    setStore({ docs });
  } catch (e) {
    setStore(before);
    throw e;
  }
}

// ── hook ─────────────────────────────────────────────────────────────────────

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_PREFIX + store.userKey) {
      store = { ...store, ids: readLocal(store.userKey) };
      onChange();
    }
  };
  window.addEventListener(INSTALLED_APPS_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(INSTALLED_APPS_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export interface UseInstalledApps {
  installedIds: string[];
  isInstalled: (appId: string) => boolean;
  /** Resolves once the server confirms; the app shows as installed immediately. Rejects (and rolls back) on failure. */
  install: (appId: string) => Promise<void>;
  uninstall: (appId: string) => Promise<void>;
  /** false while the server list is still loading — guards should wait instead of redirecting. */
  ready: boolean;
}

export function useInstalledApps(): UseInstalledApps {
  const { user } = useAuth();
  const userKey = user?.id || "anon";
  const email = user?.email;

  // Keyed per user, so signing in/out (or switching account) reloads the right list.
  useEffect(() => {
    void load(userKey);
  }, [userKey]);

  const snapshot = useSyncExternalStore(subscribe, () => store);
  const installedIds = snapshot.userKey === userKey ? snapshot.ids : [];

  const isInstalled = useCallback((appId: string) => installedIds.includes(appId), [installedIds]);
  const install = useCallback((appId: string) => installApp(appId, email), [email]);
  const uninstall = useCallback((appId: string) => uninstallApp(appId), []);

  return { installedIds, isInstalled, install, uninstall, ready: snapshot.ready && snapshot.userKey === userKey };
}
