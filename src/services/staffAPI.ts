// Staff — delegated users a tenant grants feature access to. Talks to the real
// /api/v1/staff endpoints. The PAYLOAD SHAPE follows the frontend UI (fine-
// grained grants, sub-tenant scope, phone, free-text role) — the backend is
// being updated to accept this shape, so we send it as-is rather than remapping.

import axios, { AxiosResponse } from "axios";
import type { PermissionGrantMap } from "../permissions/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getAuthToken = () => {
  try {
    const stored = localStorage.getItem("auth_tokens");
    if (stored) {
      const { accessToken } = JSON.parse(stored);
      if (accessToken) return accessToken;
    }
  } catch (e) {
    console.warn("Failed to parse auth tokens:", e);
  }
  return localStorage.getItem("authToken");
};

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getAuthToken()}`,
    "Content-Type": "application/json",
  },
});

const errMessage = (error: any, fallback: string) =>
  error.response?.data?.message || error.response?.data?.error || fallback;

const STAFF_BASE = `${API_BASE_URL}/staff`;

export type StaffStatus = "active" | "invited" | "suspended";

// UI-shaped staff record (what the frontend renders & the API returns/accepts).
export interface StaffMember {
  id: string;
  tenantId: string; // owning tenant (parent user id)
  name: string;
  email: string;
  phone?: string;
  roleName: string; // free-text job title
  status: StaffStatus;
  grants: PermissionGrantMap; // fine-grained module:page:action -> bool
  // Per-scoped-module sub-tenant scope (command-center, sub-tenants).
  // subTenantScopes[moduleKey] = 'all' | 'select';
  // managedSubTenantsByModule[moduleKey] = selected sub-tenant ids.
  subTenantScopes?: Record<string, "all" | "select">;
  managedSubTenantsByModule?: Record<string, string[]>;
  lastActive: string | null;
  createdAt: string;
  updatedAt: string;
}

export const countGrants = (grants: PermissionGrantMap): number =>
  Object.values(grants || {}).filter(Boolean).length;

// ─── Normalize an API record → UI StaffMember ────────────────────────────────
// Tolerant to a few shapes the backend might settle on (flat fields, or a
// { user, permission } bundle, grants as a boolean map or a key array).
// Strip the inline sub-tenant scope suffix, e.g.
// "module:command-center-read-subtenant-(id1,id2)" → base key + parsed scope.
const SCOPE_SUFFIX_RE = /-read-subtenant-\(([^)]*)\)$/;

const parseScopedKey = (key: string): { base: string; ids: string[]; all: boolean } => {
  const m = key.match(SCOPE_SUFFIX_RE);
  if (!m) return { base: key, ids: [], all: false };
  const inner = (m[1] || "").trim();
  const all = inner === "" || inner === "all";
  const ids = all ? [] : inner.split(",").map((s) => s.trim()).filter(Boolean);
  return { base: key.replace(SCOPE_SUFFIX_RE, ""), ids, all };
};

const gfrom = (raw: any): PermissionGrantMap => {
  const g = raw?.grants ?? raw?.permission?.grants ?? raw?.permissions ?? raw?.permission?.permissions;
  const map: PermissionGrantMap = {};
  if (Array.isArray(g)) {
    for (const k of g) if (k) map[parseScopedKey(String(k)).base] = true;
    return map;
  }
  if (g && typeof g === "object") {
    for (const k of Object.keys(g)) if (g[k]) map[parseScopedKey(k).base] = true;
    return map;
  }
  return {};
};

// Scoped module roots that carry an inline sub-tenant scope.
const SCOPED_ROOTS = ["module:command-center", "module:sub-tenants"];
const rootOf = (baseKey: string): string | null =>
  SCOPED_ROOTS.find((r) => baseKey === r || baseKey.startsWith(`${r}.`)) || null;

// Recover the PER-MODULE sub-tenant scope from scoped permission strings so the
// editor can prefill each module's All/Select picker independently.
const scopesFrom = (
  raw: any
): { scopes: Record<string, "all" | "select">; ids: Record<string, string[]> } => {
  const g = raw?.permissions ?? raw?.permission?.permissions ?? raw?.grants;
  const keys = Array.isArray(g) ? g.map(String) : g && typeof g === "object" ? Object.keys(g) : [];
  const scopes: Record<string, "all" | "select"> = {};
  const ids: Record<string, string[]> = {};
  for (const k of keys) {
    const parsed = parseScopedKey(k);
    if (parsed.base === k) continue; // no suffix
    const root = rootOf(parsed.base);
    if (!root) continue;
    // First scoped key per module wins (they should agree).
    if (!(root in scopes)) {
      scopes[root] = parsed.all ? "all" : "select";
      ids[root] = parsed.all ? [] : parsed.ids;
    }
  }
  return { scopes, ids };
};

const normalize = (raw: any): StaffMember => {
  const user = raw?.user ?? raw;
  const perm = raw?.permission ?? raw;
  const isActive = user?.isActive ?? raw?.isActive ?? raw?.is_active;
  return {
    id: String(user?.id ?? user?._id ?? raw?.id ?? ""),
    tenantId: String(perm?.managedByTenantId ?? raw?.tenantId ?? ""),
    name: String(user?.fullName ?? raw?.name ?? raw?.fullName ?? ""),
    email: String(user?.email ?? raw?.email ?? ""),
    phone: raw?.phone ?? perm?.phone ?? user?.phone ?? undefined,
    roleName: String(perm?.role_name ?? raw?.roleName ?? raw?.role_name ?? "Staff"),
    status: raw?.status ?? (isActive === false ? "suspended" : "active"),
    grants: gfrom(raw),
    // Per-module sub-tenant scope recovered from the inline permission suffix.
    subTenantScopes: scopesFrom(raw).scopes,
    managedSubTenantsByModule: scopesFrom(raw).ids,
    lastActive: user?.lastLoginAt ?? raw?.lastActive ?? null,
    createdAt: user?.createdAt ?? raw?.createdAt ?? new Date().toISOString(),
    updatedAt: user?.updatedAt ?? raw?.updatedAt ?? new Date().toISOString(),
  };
};

// ─── Request payload ─────────────────────────────────────────────────────────
// The backend currently validates the documented shape (fullName + accounts[]),
// so we send those. We ALSO send the UI's extra fields (phone, grants,
// managedSubTenantIds) so they carry through once the backend accepts them.
export interface StaffAccountInput {
  tenantId: string;
  subTenantId?: string | null;
}

export interface StaffInput {
  name: string;
  email: string;
  phone?: string;
  password?: string; // create only
  roleName: string;
  grants: PermissionGrantMap;
  /** Per-module scope: subTenantScopes[moduleRoot] = 'all' | 'select'. */
  subTenantScopes?: Record<string, "all" | "select">;
  /** Per-module selected ids: managedSubTenantsByModule[moduleRoot] = ids[]. */
  managedSubTenantsByModule?: Record<string, string[]>;
  /** Resolved { tenantId, subTenantId } accounts this staff can act on.
   * REQUIRED by the API (min 1 for a tenant caller). */
  accounts?: StaffAccountInput[];
  invite?: boolean;
}

// The backend validates strictly (unknown keys → 422), so send ONLY the
// documented fields. The UI's fine-grained grants are flattened into
// `permissions[]` (a documented field). phone / grants-map / managedSubTenantIds
// are UI-only and intentionally NOT sent until the backend accepts them.
// Encode a module's sub-tenant scope INTO its permission string, e.g.
//   module:command-center-read-subtenant-(id1,id2)
//   module:command-center-read-subtenant-(all)
// Each scoped module (command-center, sub-tenants) uses ITS OWN scope; all
// other keys stay plain.
const suffixFor = (scope?: "all" | "select", ids?: string[]): string => {
  const inner = scope === "select" && ids && ids.length ? ids.join(",") : "all";
  return `-read-subtenant-(${inner})`;
};

const applyScopeToPermissions = (
  keys: string[],
  scopes: Record<string, "all" | "select"> = {},
  idsByModule: Record<string, string[]> = {}
): string[] =>
  keys.map((k) => {
    const root = rootOf(k);
    if (!root) return k;
    return `${k}${suffixFor(scopes[root], idsByModule[root])}`;
  });

const buildBody = (input: Partial<StaffInput>) => {
  const body: Record<string, unknown> = {};
  if (input.name !== undefined) body.fullName = input.name.trim();
  if (input.email !== undefined) body.email = input.email.trim().toLowerCase();
  if (input.password !== undefined) body.password = input.password;
  if (input.roleName !== undefined) body.role_name = input.roleName.trim();
  if (input.accounts !== undefined) body.accounts = input.accounts;
  if (input.grants !== undefined) {
    const granted = Object.keys(input.grants).filter((k) => input.grants![k]);
    // Per-module sub-tenant scope encoded into the command-center/sub-tenants keys.
    body.permissions = applyScopeToPermissions(
      granted,
      input.subTenantScopes,
      input.managedSubTenantsByModule
    );
  }
  if (input.invite !== undefined) body.sendInvite = input.invite;
  Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);
  return body;
};

// ─── Endpoints ───────────────────────────────────────────────────────────────

export const staffAPI = {
  async list(_tenantId?: string): Promise<StaffMember[]> {
    try {
      const res: AxiosResponse<any> = await axios.get(STAFF_BASE, {
        ...authHeaders(),
        params: { limit: 100, includeInactive: "true" },
      });
      const data = res.data?.data ?? res.data ?? {};
      const rows = Array.isArray(data.staff) ? data.staff : Array.isArray(data) ? data : [];
      return rows.map(normalize);
    } catch (error: any) {
      console.error("Error listing staff:", error);
      throw new Error(errMessage(error, "Failed to load staff"));
    }
  },

  async create(_tenantId: string, input: StaffInput): Promise<StaffMember> {
    try {
      const res: AxiosResponse<any> = await axios.post(STAFF_BASE, buildBody(input), authHeaders());
      return normalize(res.data?.data ?? res.data);
    } catch (error: any) {
      console.error("Error creating staff:", error);
      if (error.response?.status === 409) throw new Error("A user already exists with this email.");
      throw new Error(errMessage(error, "Failed to create staff member"));
    }
  },

  async update(id: string, patch: Partial<StaffInput>): Promise<StaffMember> {
    try {
      const res: AxiosResponse<any> = await axios.put(`${STAFF_BASE}/${id}`, buildBody(patch), authHeaders());
      return normalize(res.data?.data ?? res.data);
    } catch (error: any) {
      console.error("Error updating staff:", error);
      throw new Error(errMessage(error, "Failed to update staff member"));
    }
  },

  // Suspend = soft-delete (DELETE). Reactivate = best-effort PUT { isActive:true }
  // (the documented API only exposes soft-delete). Both return the updated record.
  async setStatus(id: string, status: StaffStatus): Promise<StaffMember> {
    try {
      const res: AxiosResponse<any> =
        status === "suspended"
          ? await axios.delete(`${STAFF_BASE}/${id}`, authHeaders())
          : await axios.put(`${STAFF_BASE}/${id}`, { isActive: true }, authHeaders());
      return normalize(res.data?.data ?? res.data);
    } catch (error: any) {
      console.error("Error updating staff status:", error);
      throw new Error(errMessage(error, "Failed to update status"));
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await axios.delete(`${STAFF_BASE}/${id}`, authHeaders());
    } catch (error: any) {
      console.error("Error removing staff:", error);
      if (error.response?.status === 400) throw new Error("This staff member is already deactivated.");
      throw new Error(errMessage(error, "Failed to remove staff member"));
    }
  },
};

export default staffAPI;
