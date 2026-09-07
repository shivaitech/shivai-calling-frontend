// Staff — human employees a tenant/sub-tenant hires and grants per-feature
// access to. No backend endpoint exists yet, so this operates on a
// localStorage-backed store shaped like the intended API (same pattern as
// tenantAPI members/branding). Swapping in real HTTP later touches only the
// method bodies here, not calling code.
//
// TODO(staff backend): replace with GET/POST/PATCH/DELETE /staff (or
// /tenants/:id/staff), returning { staff: StaffMember[] } and persisting the
// per-staff `grants` map + role. Invites should reuse the invite flow.

import type { PermissionGrantMap } from '../permissions/types';

export type StaffStatus = 'active' | 'invited' | 'suspended';

export interface StaffMember {
  id: string;
  tenantId: string; // owning tenant/sub-tenant (parent JWT userId or scoped id)
  name: string;
  email: string;
  phone?: string; // contact number, digits only
  roleName: string; // free-text job title, e.g. "Lead Manager"
  status: StaffStatus;
  grants: PermissionGrantMap; // per-feature access (module:page:action -> bool)
  // Sub-tenants (celebrities) this member manages. Empty = all of the owner's
  // sub-tenants. Only meaningful when the owner is the main tenant.
  managedSubTenantIds?: string[];
  lastActive: string | null;
  createdAt: string;
  updatedAt: string;
  // NOTE: passwords are NEVER stored on the record. On create it's sent to the
  // backend (once wired) to provision sign-in; the mock store discards it.
}

export const countGrants = (grants: PermissionGrantMap): number =>
  Object.values(grants || {}).filter(Boolean).length;

// ─── Store ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'staff_v1';
const MOCK_LATENCY = 250;
const delay = (ms = MOCK_LATENCY) => new Promise((r) => setTimeout(r, ms));

const readAll = (): StaffMember[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeAll = (rows: StaffMember[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    /* storage unavailable */
  }
};

const uid = () => Math.random().toString(36).slice(2, 10);

export interface StaffInput {
  name: string;
  email: string;
  phone?: string;
  password?: string; // sign-in credential — sent to backend, never persisted here
  roleName: string;
  grants: PermissionGrantMap;
  managedSubTenantIds?: string[];
  invite?: boolean;
}

// phone → digits only (matches sub-tenant normalization).
const normalizePhone = (raw?: string): string | undefined =>
  raw != null && raw !== '' ? raw.replace(/\D/g, '') : undefined;

export const staffAPI = {
  async list(tenantId: string): Promise<StaffMember[]> {
    await delay();
    return readAll()
      .filter((s) => s.tenantId === tenantId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  async create(tenantId: string, input: StaffInput): Promise<StaffMember> {
    await delay();
    const now = new Date().toISOString();
    // TODO(staff backend): send input.password to provision sign-in; the mock
    // store intentionally discards it (never persist a password client-side).
    const member: StaffMember = {
      id: uid(),
      tenantId,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: normalizePhone(input.phone),
      roleName: input.roleName.trim(),
      status: input.invite ? 'invited' : 'active',
      grants: input.grants,
      managedSubTenantIds: input.managedSubTenantIds ?? [],
      lastActive: null,
      createdAt: now,
      updatedAt: now,
    };
    const all = readAll();
    if (all.some((s) => s.tenantId === tenantId && s.email === member.email)) {
      throw new Error('A staff member with this email already exists.');
    }
    all.unshift(member);
    writeAll(all);
    return member;
  },

  async update(id: string, patch: Partial<StaffInput>): Promise<StaffMember> {
    await delay();
    const all = readAll();
    const idx = all.findIndex((s) => s.id === id);
    if (idx < 0) throw new Error('Staff member not found.');
    all[idx] = {
      ...all[idx],
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.email !== undefined ? { email: patch.email.trim().toLowerCase() } : {}),
      ...(patch.phone !== undefined ? { phone: normalizePhone(patch.phone) } : {}),
      ...(patch.roleName !== undefined ? { roleName: patch.roleName.trim() } : {}),
      ...(patch.grants !== undefined ? { grants: patch.grants } : {}),
      ...(patch.managedSubTenantIds !== undefined ? { managedSubTenantIds: patch.managedSubTenantIds } : {}),
      updatedAt: new Date().toISOString(),
    };
    writeAll(all);
    return all[idx];
  },

  async setStatus(id: string, status: StaffStatus): Promise<StaffMember> {
    await delay(120);
    const all = readAll();
    const idx = all.findIndex((s) => s.id === id);
    if (idx < 0) throw new Error('Staff member not found.');
    all[idx] = { ...all[idx], status, updatedAt: new Date().toISOString() };
    writeAll(all);
    return all[idx];
  },

  async remove(id: string): Promise<void> {
    await delay(120);
    writeAll(readAll().filter((s) => s.id !== id));
  },
};

export default staffAPI;
