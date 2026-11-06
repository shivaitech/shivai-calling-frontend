import { useCallback, useEffect, useSyncExternalStore } from "react";
import { canInstallApp } from "./apps";
import { useAuth } from "../contexts/AuthContext";
import {
  SERVER_APP_IDS,
  SkillApp,
  SkillAppsError,
  catalogIdFor,
  hasAuthToken,
  marketplaceIdOf,
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
 * Installing needs the app's catalog record id. Until it's known (learned from the installed
 * list, or listed in skillAppsAPI.ts) an install is kept as "pending" in this browser and
 * uploaded as soon as the id turns up, so it never disappears on reload.
 *
 * One module-level store shared by every hook instance; changes are broadcast with
 * a window event (same tab) and the storage event (other tabs).
 */

const STORAGE_PREFIX = "shivai_installed_apps_";
const MIGRATED_PREFIX = "shivai_installed_apps_migrated_";
const PENDING_PREFIX = "shivai_installed_apps_pending_";
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

function readList(key: string): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeList(key: string, ids: string[]) {
  try {
    if (ids.length) localStorage.setItem(key, JSON.stringify(ids));
    else localStorage.removeItem(key);
  } catch {
    /* storage full / unavailable */
  }
}

const readLocal = (userKey: string) => readList(STORAGE_PREFIX + userKey);
const writeLocal = (userKey: string, ids: string[]) => {
  try {
    localStorage.setItem(STORAGE_PREFIX + userKey, JSON.stringify(ids));
  } catch {
    /* storage full / unavailable */
  }
};

/** Installs waiting to be uploaded (their catalog id wasn't known when they were made). */
const readPending = (userKey: string) => readList(PENDING_PREFIX + userKey);
const writePending = (userKey: string, ids: string[]) => writeList(PENDING_PREFIX + userKey, [...new Set(ids)]);

function setStore(patch: Partial<Store>) {
  store = { ...store, ...patch };
  if (patch.ids) writeLocal(store.userKey, store.ids);
  window.dispatchEvent(new CustomEvent(INSTALLED_APPS_EVENT));
}

// ── server sync ──────────────────────────────────────────────────────────────

/** Installed records grouped by marketplace app (matched by the catalog record's name). */
const byApp = (apps: SkillApp[]) => {
  const docs: Record<string, string[]> = {};
  for (const a of apps) {
    const id = marketplaceIdOf(a);
    if (id) (docs[id] ??= []).push(a._id);
  }
  return docs;
};

/** Uploads pending installs whose catalog id is now known. Returns true if any were sent. */
async function uploadPending(userKey: string): Promise<boolean> {
  const pending = readPending(userKey);
  const ready = pending.filter((id) => !store.docs[id] && catalogIdFor(id));
  if (!ready.length) return false;
  const results = await Promise.allSettled(ready.map((id) => skillAppsAPI.install(catalogIdFor(id)!)));
  // Sent (or already there — 409): no longer pending.
  const done = ready.filter((_, i) => {
    const r = results[i];
    return r.status === "fulfilled" || (r.reason as SkillAppsError)?.status === 409;
  });
  writePending(
    userKey,
    pending.filter((id) => !done.includes(id)),
  );
  return done.length > 0;
}

/** Replaces the list with the server's (plus installs still waiting to upload) — unless the account changed while we waited. */
async function refresh(userKey = store.userKey) {
  const docs = byApp(await skillAppsAPI.list());
  if (store.userKey !== userKey) return;
  const pending = readPending(userKey).filter((id) => !docs[id]);
  setStore({ docs, ids: [...new Set([...Object.keys(docs), ...pending])], ready: true, source: "server" });
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
      if (store.userKey !== userKey) return;
      // Once per account: apps installed in this browser before the API existed join the
      // pending list, then everything pending with a known catalog id is uploaded.
      const migratedKey = MIGRATED_PREFIX + userKey;
      if (!localStorage.getItem(migratedKey)) {
        const missing = local.filter((id) => !store.ids.includes(id) && SERVER_APP_IDS.includes(id));
        writePending(userKey, [...readPending(userKey), ...missing]);
        localStorage.setItem(migratedKey, "1");
      }
      if (await uploadPending(userKey)) await refresh(userKey);
    } catch (e) {
      // 403: this role can't use the API. 404: the API isn't deployed yet on this server.
      // Either way keep the browser-only list (pending installs upload once the API answers).
      // 401/network: show the cached list; the next load tries again.
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
  if (store.source === "local" || !SERVER_APP_IDS.includes(appId)) return;
  const catalogId = catalogIdFor(appId);
  if (!catalogId) {
    // Catalog id not known yet: keep the install and upload it as soon as the id is known.
    writePending(store.userKey, [...readPending(store.userKey), appId]);
    return;
  }
  try {
    const created = await skillAppsAPI.install(catalogId);
    setStore({ docs: { ...store.docs, [appId]: [...(store.docs[appId] ?? []), created._id] } });
  } catch (e) {
    const status = (e as SkillAppsError).status;
    if (status === 409) return void refresh().catch(() => {}); // already installed
    // 404 = this catalog app (or the endpoint) wasn't found: keep the install here and retry later.
    if (status === 404) return writePending(store.userKey, [...readPending(store.userKey), appId]);
    setStore({ ids: store.ids.filter((id) => id !== appId) });
    throw e;
  }
}

async function uninstallApp(appId: string): Promise<void> {
  if (!store.ids.includes(appId)) return;
  const before = { ids: store.ids, docs: store.docs };
  setStore({ ids: store.ids.filter((id) => id !== appId) });
  writePending(
    store.userKey,
    readPending(store.userKey).filter((id) => id !== appId),
  );
  if (store.source === "local" || !SERVER_APP_IDS.includes(appId)) return;
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
