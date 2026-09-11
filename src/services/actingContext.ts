// Staff acting-context — the tenant/sub-tenant a staff user is currently
// operating as. The backend resolves scope from these headers on EVERY
// protected route (X-Acting-Tenant-Id / X-Acting-Sub-Tenant-Id). Non-staff
// users don't send them (their scope comes from their own token).
//
// The selected account is persisted so it survives reloads and is available to
// all service modules without prop-drilling.

export const ACTING_TENANT_ID_KEY = "acting_tenant_id"; // parent tenant id
export const ACTING_SUB_TENANT_ID_KEY = "acting_sub_tenant_id"; // optional sub-tenant id
export const IS_STAFF_KEY = "is_staff"; // "true" when the signed-in user is staff

export interface ActingAccount {
  tenantId: string;
  subTenantId?: string | null;
}

const read = (k: string): string | null => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};

export const isStaffUser = (): boolean => read(IS_STAFF_KEY) === "true";

// A logged-in REAL sub-tenant's own id — used to append ?sub_tenant_id to their
// list/action calls (their JWT also scopes them server-side, but the backend
// contract wants the explicit param). Returns null for main tenant / staff /
// main-in-sub-tenant-view (those pass sub_tenant_id explicitly per call).
export const selfSubTenantId = (): string | null => {
  try {
    const raw = read("auth_user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    const role = u?.tenantRole;
    if (role === "SUBTENANT_OWNER" || role === "SUBTENANT_MEMBER") {
      return u?.id ? String(u.id) : null;
    }
  } catch {
    /* ignore */
  }
  return null;
};

// Merge the logged-in sub-tenant's own scope into a params object. No-op for
// non-sub-tenants, and never overrides an explicit sub_tenant_id already set
// (e.g. a main tenant drilling into a specific sub-tenant).
export const withSelfScope = <T extends Record<string, any>>(params: T = {} as T): T => {
  const id = selfSubTenantId();
  if (!id) return params;
  if (params && params.sub_tenant_id !== undefined) return params;
  return { ...params, sub_tenant_id: id };
};

export const setStaffFlag = (isStaff: boolean): void => {
  try {
    if (isStaff) localStorage.setItem(IS_STAFF_KEY, "true");
    else localStorage.removeItem(IS_STAFF_KEY);
  } catch {
    /* ignore */
  }
};

export const getActingAccount = (): ActingAccount | null => {
  const tenantId = read(ACTING_TENANT_ID_KEY);
  if (!tenantId) return null;
  const subTenantId = read(ACTING_SUB_TENANT_ID_KEY);
  return { tenantId, subTenantId: subTenantId || null };
};

export const setActingAccount = (acct: ActingAccount | null): void => {
  try {
    if (!acct || !acct.tenantId) {
      localStorage.removeItem(ACTING_TENANT_ID_KEY);
      localStorage.removeItem(ACTING_SUB_TENANT_ID_KEY);
      return;
    }
    localStorage.setItem(ACTING_TENANT_ID_KEY, acct.tenantId);
    if (acct.subTenantId) localStorage.setItem(ACTING_SUB_TENANT_ID_KEY, acct.subTenantId);
    else localStorage.removeItem(ACTING_SUB_TENANT_ID_KEY);
  } catch {
    /* ignore */
  }
};

export const clearActingContext = (): void => {
  try {
    localStorage.removeItem(ACTING_TENANT_ID_KEY);
    localStorage.removeItem(ACTING_SUB_TENANT_ID_KEY);
    localStorage.removeItem(IS_STAFF_KEY);
  } catch {
    /* ignore */
  }
};

// Headers to merge into any authenticated request. Empty for non-staff.
// Staff act AS THE MAIN (parent) TENANT — only X-Acting-Tenant-Id is sent.
// Scoping to a specific sub-tenant (Command Center / Sub Tenants) is done via a
// ?sub_tenant_id query param on those listings, exactly like the main tenant
// drilling in — NOT via X-Acting-Sub-Tenant-Id.
export const actingHeaders = (): Record<string, string> => {
  if (!isStaffUser()) return {};
  const acct = getActingAccount();
  if (!acct?.tenantId) return {};
  return { "X-Acting-Tenant-Id": acct.tenantId };
};
