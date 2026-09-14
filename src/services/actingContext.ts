// Staff acting-context — the parent tenant a staff user operates as. Staff act
// AS THE MAIN (PARENT) TENANT: the parent tenant id is sent as `tenant_id` IN
// EVERY API (query param on GET/list, body on POST/PUT) — NOT via a header.
// Non-staff users don't send it (their scope comes from their own token).
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

// Staff act AS THE MAIN (parent) TENANT. Instead of an acting header, the parent
// tenant id is sent as `tenant_id` IN EVERY API (query param on GET/list, body
// on POST/PUT). Returns the parent tenant id for a logged-in staff, else null.
export const staffTenantId = (): string | null => {
  if (!isStaffUser()) return null;
  return getActingAccount()?.tenantId ?? null;
};

// Merge the staff's parent tenant id into a params/body object as `tenant_id`.
// No-op for non-staff; never overrides an explicit tenant_id already set.
export const withStaffScope = <T extends Record<string, any>>(params: T = {} as T): T => {
  const id = staffTenantId();
  if (!id) return params;
  if (params && (params as any).tenant_id !== undefined) return params;
  return { ...params, tenant_id: id };
};
