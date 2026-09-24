import axios, { AxiosResponse } from "axios";
import type { Tenant, TenantStatus } from "../permissions/types";
import { staffTenantId } from "./actingContext";

// Sub-tenants API — tenant-facing team-member (sub-tenant) management.
// See public/test/tenants-sub-tenants-and-roles-api.md.
// Base: {API_BASE}/api/v1/tenants
//
// Responses use { user, permission, tenantDetail } — NOT `subTenant`.
// Create requires `roleId` + business fields (businessName, industry, phone…).
// `phone` is digits only. Role delete/soft-delete handled in rolesAPI.

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

// 401 auth · 403 missing tenants:* permission · 404 not found · 422 validation.
const errMessage = (error: any, fallback: string) =>
  error.response?.data?.error ||
  error.response?.data?.message ||
  fallback;

// ─── Raw API shapes ────────────────────────────────────────────────────────
// The backend returns a composite record per sub-tenant. We keep the raw shape
// loose (fields the detailed doc isn't published for yet) and map to the UI's
// existing `Tenant` type below so the list/cards need no changes.

// Exact response shapes from the API doc (data.user / permission / tenantDetail).
export interface SubTenantUser {
  id: string;
  parentTenantId: string;
  email: string;
  fullName: string;
  profilePicture?: string | null;
  emailVerified?: boolean;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubTenantRole {
  id: string;
  key: string;
  description: string;
}

export interface SubTenantPermission {
  id?: string;
  tenantId?: string; // parent tenant user id
  subTenantId?: string; // sub-tenant user id
  role?: SubTenantRole;
  modules?: string[];
  actions?: string[];
  permissions?: string[]; // ["tenants:read", ...]
}

export interface TenantDetail {
  id?: string;
  tenantId?: string; // sub-tenant user id
  businessName?: string;
  industry?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  logo?: string | null;
  website?: string;
  description?: string;
  planId?: string | null;
  maxEmployees?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Usage stats bundled per sub-tenant on the list endpoint.
export interface SubTenantStats {
  agent_count?: number;
  call_count?: number;
  call_success_ratio?: number;
}

// One sub-tenant bundle as returned by the API.
export interface SubTenantRecord {
  user: SubTenantUser;
  permission?: SubTenantPermission | null;
  tenantDetail?: TenantDetail | null;
  stats?: SubTenantStats | null;
}

export interface CreateSubTenantRequest {
  // Account & access
  email: string;
  fullName: string;
  password: string;
  roleId: string; // 24-char ObjectId from GET /roles
  sendInvite?: boolean;
  // Business profile (TenantDetail)
  businessName: string;
  industry?: string;
  phone?: string; // digits only, 6–15
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  website?: string;
  description?: string;
  logo?: string | null;
  maxEmployees?: number;
  // Optional permission overrides (default from the role when omitted)
  modules?: string[];
  actions?: string[];
  permissions?: string[];
}

export type UpdateSubTenantRequest = Partial<
  Omit<CreateSubTenantRequest, "email" | "password"> & {
    profilePicture: string;
    // Reactivate a soft-deleted sub-tenant. Deactivation uses DELETE /tenants/:id.
    isActive: boolean;
  }
>;

// Reactivate a soft-deleted sub-tenant (best-effort — the documented update body
// doesn't list isActive, but it's the natural field; deactivate uses DELETE).
export const reactivateSubTenant = async (id: string): Promise<SubTenantRecord> =>
  updateSubTenant(id, { isActive: true });

// The API requires `website` to be a valid URI. Users type "example.com", so
// prefix a scheme when missing. Returns undefined for blank input.
const normalizeWebsite = (raw?: string): string | undefined => {
  const v = (raw || "").trim();
  if (!v) return undefined;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
};

// phone must be digits only (6–15). Optional — blank/whitespace normalizes to
// undefined so it's dropped from the request instead of sending "".
const normalizePhone = (raw?: string): string | undefined => {
  if (raw == null) return undefined;
  const digits = raw.replace(/\D/g, "");
  return digits ? digits : undefined;
};

export interface SubTenantsListParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "email" | "fullName";
  sortOrder?: "asc" | "desc";
  search?: string;
  includeInactive?: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Mapping to the UI `Tenant` type ────────────────────────────────────────

const slugify = (s: string) =>
  (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Map an API record onto the module's existing `Tenant` shape so the list/cards
// need no changes. `isActive: false` → suspended.
export const toTenant = (rec: SubTenantRecord): Tenant => {
  const user = rec.user || ({} as SubTenantUser);
  const detail = rec.tenantDetail || ({} as TenantDetail);
  const stats = rec.stats || ({} as SubTenantStats);
  const id = String(user.id || detail.tenantId || "");
  const name = String(detail.businessName || user.fullName || user.email || "Sub Tenant");
  const location = [detail.city, detail.state, detail.country].filter(Boolean).join(", ");

  return {
    id,
    type: "SUBTENANT",
    parentTenantId: user.parentTenantId ?? null,
    name,
    slug: slugify(name) || id,
    status: user.isActive === false ? "suspended" : "active",
    createdAt: String(user.createdAt || detail.createdAt || new Date().toISOString()),
    createdBy: "",
    billing: { mode: "CENTRAL" },
    branding: {
      logoUrl: detail.logo || null,
      faviconUrl: null,
      primaryColor: "#7c3aed",
      accentColor: "#4f46e5",
    },
    limits: { maxAgents: detail.maxEmployees },
    usage: {
      activeAgents: stats.agent_count ?? 0,
      callsThisMonth: stats.call_count ?? 0,
      callMinutesThisMonth: 0,
      successRate: stats.call_success_ratio ?? 0,
      activeUsers: 0,
    },
    contact: {
      ownerName: String(user.fullName || ""),
      email: String(user.email || ""),
      phone: String(detail.phone || ""),
      location,
      industry: detail.industry || undefined,
      website: detail.website || undefined,
      notes: detail.description || undefined,
    },
  };
};

// ─── Default access for a new sub-tenant ─────────────────────────────────────
// Sent as permission overrides on create so a new sub-tenant can, by default:
// manage AI Employees, view Analytics & Call History, use Call Setup WITHOUT
// buying numbers, and access Settings + Billing. The backend maps its coarse
// module:action model; we send the fine-grained UI keys the app gates on.
export const DEFAULT_SUB_TENANT_PERMISSIONS: string[] = [
  // AI Employees
  "module:employees",
  "module:employees.page:list",
  "module:employees.page:list.action:create",
  "module:employees.page:edit-agent",
  "module:employees.page:edit-agent.action:improve-with-ai",
  "module:employees.page:training",
  // Call Setup — inbound + outbound, but NOT number purchase
  "module:call-setup",
  "module:call-setup.page:inbound",
  "module:call-setup.page:outbound",
  "module:call-setup.page:outbound.action:launch-campaign",
  // Command Center — human-employee workspace
  "module:command-center",
  "module:command-center.page:calls",
  "module:command-center.page:leads",
  "module:command-center.page:follow-ups",
  "module:command-center.page:activity",
  // Staff — hire people and grant them feature access
  "module:staff",
  "module:staff.page:list",
  "module:staff.page:list.action:invite",
  "module:staff.page:list.action:manage-access",
  // Analytics & Call History
  "module:analytics",
  "module:analytics.page:overview",
  // Billing
  "module:billing",
  "module:billing.page:overview",
  // Settings
  "module:settings",
  "module:settings.page:profile",
  "module:settings.page:security",
];

// Turn the API's granted-permission array (permission.permissions:
// ["module:employees", "module:employees.page:list", …]) into the UI's
// grant map ({ "module:employees": true, … }) so the matrix editor prefills.
export const permissionsToGrantMap = (
  keys?: string[] | null
): Record<string, boolean> => {
  const grants: Record<string, boolean> = {};
  for (const k of keys || []) if (k) grants[k] = true;
  return grants;
};

// Pull the granted-permission keys off a sub-tenant record (permission.permissions).
export const grantMapFromRecord = (rec: SubTenantRecord): Record<string, boolean> =>
  permissionsToGrantMap(rec.permission?.permissions);

// ─── Current-user profile (GET /auth/me) ─────────────────────────────────────
// After login the app fetches the signed-in user's own profile to learn whether
// they're a sub-tenant and what they're allowed to do. The login payload's
// top-level `permission` is null, so permissions are resolved here instead.

// A permission bundle can arrive in several shapes across endpoints. Pull the
// granted keys from wherever they are (permission.permissions, top-level
// permissions, or a modules[]+actions[] fallback).
// Staff permission strings encode a sub-tenant scope inline, e.g.
// "module:command-center-read-subtenant-(id1,id2)". Strip that so the key
// matches the permission registry (usePermission checks the base key).
const stripScopeSuffix = (key: string): string => key.replace(/-read-subtenant-\([^)]*\)$/, "");

const extractPermissionKeys = (src: any): string[] => {
  if (!src) return [];
  const perm = src.permission ?? src;
  if (Array.isArray(perm?.permissions)) return perm.permissions.filter(Boolean).map(stripScopeSuffix);
  if (Array.isArray(src?.permissions)) return src.permissions.filter(Boolean).map(stripScopeSuffix);
  // Coarse module:action fallback (e.g. modules:["users"], actions:["read"]).
  const modules: string[] = Array.isArray(perm?.modules) ? perm.modules : [];
  const actions: string[] = Array.isArray(perm?.actions) ? perm.actions : [];
  if (modules.length && actions.length) {
    const keys: string[] = [];
    for (const m of modules) for (const a of actions) keys.push(`${m}:${a}`);
    return keys;
  }
  return [];
};

// Normalize a raw tenant-detail object to the TenantDetail shape the UI uses.
// The API mixes camelCase and snake_case (e.g. max_employees, max_agents,
// tenant_id) across endpoints, so map both.
const normalizeTenantDetail = (d: any): TenantDetail => ({
  id: d.id ?? d._id,
  tenantId: d.tenantId ?? d.tenant_id,
  businessName: d.businessName ?? d.business_name ?? "",
  industry: d.industry ?? "",
  phone: d.phone ?? "",
  address: d.address ?? "",
  city: d.city ?? "",
  state: d.state ?? "",
  zip: d.zip ?? "",
  country: d.country ?? "",
  logo: d.logo ?? null,
  website: d.website ?? "",
  description: d.description ?? "",
  planId: d.planId ?? d.plan_id ?? null,
  maxEmployees: d.maxEmployees ?? d.max_employees ?? d.maxAgents ?? d.max_agents,
  createdAt: d.createdAt ?? d.created_at,
  updatedAt: d.updatedAt ?? d.updated_at,
});

export interface MyProfile {
  user: any;
  permission: any | null;
  tenantDetail: any | null;
  // Derived
  isSubTenant: boolean;
  isStaff: boolean;
  grants: Record<string, boolean>;
  roleKey: string | null; // e.g. "sub-tenant", "tenant", "admin", "staff"
  accounts: Array<{ tenantId: string; subTenantId?: string | null }>; // staff account switcher
}

// GET /auth/me — normalized for the current signed-in user. Reads the
// permission grants defensively and flags whether this account is a sub-tenant
// (has a parentTenantId, or a Permission scoped to a parent + this sub-tenant).
export const getMyProfile = async (): Promise<MyProfile> => {
  try {
    const res: AxiosResponse<{ success?: boolean; data: any }> = await axios.get(
      `${API_BASE_URL}/auth/me`,
      authHeaders()
    );
    // Unwrap { data: ... } but tolerate a bare body.
    const data = res.data?.data ?? res.data ?? {};
    const user = data.user ?? data;
    // The permission BUNDLE (object with role/permissions[]/modules/actions)
    // arrives under `permission` OR `permissions` (plural) depending on endpoint
    // — /auth/me uses the plural key. Take whichever is an object, not an array.
    const permissionCandidate = data.permission ?? data.permissions ?? user?.permission ?? user?.permissions ?? null;
    const permission =
      permissionCandidate && !Array.isArray(permissionCandidate) ? permissionCandidate : null;
    // Business detail arrives as `tenantDetail`, `tenant`, or (on /auth/me)
    // `tenantDetails` (plural) — nested under `user` or at the top level.
    // Field names mix camelCase and snake_case, so normalize.
    const rawDetail =
      data.tenantDetail ?? data.tenantDetails ?? data.tenant ??
      user?.tenantDetail ?? user?.tenantDetails ?? user?.tenant ?? null;
    const tenantDetail = rawDetail ? normalizeTenantDetail(rawDetail) : null;
    // Role can arrive at data.role (top-level, /auth/me) or permission.role.key.
    const roleKey: string | null =
      data.role ?? permission?.role?.key ?? permission?.roleKey ?? null;

    const isStaff = roleKey === "staff";
    const isSubTenant = Boolean(
      user?.parentTenantId ||
        permission?.subTenantId ||
        (roleKey && roleKey === "sub-tenant")
    );

    const accounts = Array.isArray(permission?.accounts) ? permission.accounts : [];

    return {
      user,
      permission,
      tenantDetail,
      isSubTenant,
      isStaff,
      grants: permissionsToGrantMap(extractPermissionKeys(permission ?? data)),
      roleKey,
      accounts,
    };
  } catch (error: any) {
    console.error("Error loading profile:", error);
    throw new Error(errMessage(error, "Failed to load your profile"));
  }
};

// ─── Endpoints ───────────────────────────────────────────────────────────────

// POST /tenants — create a sub-tenant (User + Permission + TenantDetail).
// phone → digits only; website → valid URI. Defaults the sub-tenant's access
// (Agents, Analytics, Call Setup w/o purchase, Settings, Billing) unless the
// caller passes explicit permission overrides.
export const createSubTenant = async (
  payload: CreateSubTenantRequest
): Promise<SubTenantRecord> => {
  try {
    const { maxEmployees, ...rest } = payload;
    const body: Record<string, unknown> = {
      ...rest,
      phone: normalizePhone(payload.phone),
      website: normalizeWebsite(payload.website),
      // API expects snake_case max_employees, not camelCase.
      max_employees: maxEmployees,
      // Default access when the caller didn't supply explicit overrides.
      permissions: payload.permissions ?? DEFAULT_SUB_TENANT_PERMISSIONS,
    };
    // Drop undefined so we never send blanks the API might reject.
    Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);
    const res: AxiosResponse<{ success: boolean; data: SubTenantRecord }> =
      await axios.post(`${API_BASE_URL}/tenants`, body, authHeaders());
    return res.data.data;
  } catch (error: any) {
    console.error("Error creating sub-tenant:", error);
    if (error.response?.status === 403) {
      throw new Error("You don't have permission to create sub-tenants.");
    }
    if (error.response?.status === 409) {
      throw new Error("A user already exists with this email.");
    }
    throw new Error(errMessage(error, "Failed to create sub-tenant"));
  }
};

// GET /tenants — list the parent's sub-tenants (data.subTenants + meta.pagination).
export const listSubTenantRecords = async (
  params: SubTenantsListParams = {}
): Promise<{ subTenants: SubTenantRecord[]; pagination?: PaginationMeta }> => {
  try {
    const { includeInactive, ...rest } = params;
    // Parent tenant comes from the auth token; for STAFF (who act as the parent
    // tenant) we send tenant_id = parent so they list that tenant's sub-tenants.
    const stTenant = staffTenantId();
    const res: AxiosResponse<{
      success: boolean;
      data: { subTenants?: SubTenantRecord[] };
      meta?: { pagination?: PaginationMeta };
    }> = await axios.get(`${API_BASE_URL}/tenants`, {
      ...authHeaders(),
      params: {
        ...rest,
        ...(stTenant ? { tenant_id: stTenant } : {}),
        // API expects the string "true"/"false".
        ...(includeInactive !== undefined ? { includeInactive: String(includeInactive) } : {}),
      },
    });
    return {
      subTenants: res.data.data?.subTenants || [],
      pagination: res.data.meta?.pagination,
    };
  } catch (error: any) {
    console.error("Error listing sub-tenants:", error);
    if (error.response?.status === 403) {
      throw new Error("You don't have permission to view sub-tenants.");
    }
    throw new Error(errMessage(error, "Failed to load sub-tenants"));
  }
};

// Convenience: list + map to UI Tenant[].
export const listSubTenants = async (
  params: SubTenantsListParams = {}
): Promise<Tenant[]> => {
  const { subTenants } = await listSubTenantRecords(params);
  return subTenants.map(toTenant);
};

// GET /tenants/:id
export const getSubTenant = async (id: string): Promise<SubTenantRecord> => {
  try {
    const res: AxiosResponse<{ success: boolean; data: any }> =
      await axios.get(`${API_BASE_URL}/tenants/${id}`, authHeaders());
    const rec = res.data.data || {};
    // Business detail may arrive as tenantDetail/tenantDetails with mixed casing.
    const rawDetail = rec.tenantDetail ?? rec.tenantDetails ?? rec.tenant ?? null;
    return {
      ...rec,
      tenantDetail: rawDetail ? normalizeTenantDetail(rawDetail) : rec.tenantDetail ?? null,
    };
  } catch (error: any) {
    console.error("Error fetching sub-tenant:", error);
    throw new Error(errMessage(error, "Failed to load sub-tenant"));
  }
};

// PUT /tenants/:id — update user + business + permission fields (send ≥1).
// Never send email/password/parentTenantId/sendInvite.
export const updateSubTenant = async (
  id: string,
  payload: UpdateSubTenantRequest
): Promise<SubTenantRecord> => {
  try {
    const { maxEmployees, ...rest } = payload;
    const body: Record<string, unknown> = {
      ...rest,
      ...(payload.phone !== undefined ? { phone: normalizePhone(payload.phone) } : {}),
      ...(payload.website !== undefined ? { website: normalizeWebsite(payload.website) } : {}),
      // API expects snake_case max_employees, not camelCase.
      ...(maxEmployees !== undefined ? { max_employees: maxEmployees } : {}),
    };
    Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);
    const res: AxiosResponse<{ success: boolean; data: SubTenantRecord }> =
      await axios.put(`${API_BASE_URL}/tenants/${id}`, body, authHeaders());
    return res.data.data;
  } catch (error: any) {
    console.error("Error updating sub-tenant:", error);
    throw new Error(errMessage(error, "Failed to update sub-tenant"));
  }
};

/**
 * Save a sub-tenant's permissions via PUT /tenants/:id.
 *
 * The doc's update body accepts `permissions` (explicit module:action-style
 * grant strings). The UI holds a fine-grained grant map (module:page:action ->
 * boolean); we send the list of granted keys. Backend adapts the model.
 */
export const updateSubTenantPermissions = async (
  id: string,
  grants: Record<string, boolean>
): Promise<SubTenantRecord> => {
  try {
    const permissions = Object.keys(grants).filter((k) => grants[k]);
    const res: AxiosResponse<{ success: boolean; data: SubTenantRecord }> =
      await axios.put(`${API_BASE_URL}/tenants/${id}`, { permissions }, authHeaders());
    return res.data.data;
  } catch (error: any) {
    console.error("Error updating sub-tenant permissions:", error);
    if (error.response?.status === 403) {
      throw new Error("You don't have permission to change this.");
    }
    throw new Error(errMessage(error, "Failed to save permissions"));
  }
};

// DELETE /tenants/:id — soft delete (sets user.isActive=false). Returns the
// updated SubTenantDetail. 400 if already soft-deleted.
export const deleteSubTenant = async (id: string): Promise<string> => {
  try {
    const res: AxiosResponse<{ success: boolean; message: string }> =
      await axios.delete(`${API_BASE_URL}/tenants/${id}`, authHeaders());
    return res.data.message || "Sub-tenant deactivated";
  } catch (error: any) {
    console.error("Error deleting sub-tenant:", error);
    if (error.response?.status === 400) {
      throw new Error("This sub-tenant is already deactivated.");
    }
    throw new Error(errMessage(error, "Failed to deactivate sub-tenant"));
  }
};

export default {
  createSubTenant,
  listSubTenantRecords,
  listSubTenants,
  getSubTenant,
  updateSubTenant,
  reactivateSubTenant,
  updateSubTenantPermissions,
  deleteSubTenant,
  toTenant,
  permissionsToGrantMap,
  grantMapFromRecord,
  getMyProfile,
};
