import type { PermissionModule } from './types';

/**
 * Declarative module -> page -> action tree. This is the single source of
 * truth for every gate-able surface in the app — the Sub Tenants permission
 * matrix (PermissionMatrixEditor) renders directly from this list, and
 * usePermission()/PermissionRoute check against it. Add a row here whenever
 * a new page/action should be independently restrictable for a sub-tenant.
 * See SUB_TENANTS_MODULE_SPEC.md §5.
 */
// Order mirrors the Sidebar sequence (see components/Sidebar.tsx):
// Dashboard → AI Employees → Training → Call Setup → Workflows →
// Feature Marketplace (which owns the connected apps: Zoho, Google Calendar) →
// Analytics → Monitoring → Billing → Settings. Sub Tenants isn't gate-able here.
export const PERMISSION_REGISTRY: PermissionModule[] = [
  {
    key: 'module:dashboard',
    label: 'Dashboard',
    pages: [{ key: 'module:dashboard.page:overview', label: 'Overview' }],
  },
  {
    key: 'module:employees',
    label: 'AI Employees',
    pages: [
      {
        key: 'module:employees.page:list',
        label: 'Employee List',
        actions: [
          { key: 'module:employees.page:list.action:create', label: 'Create New Employee' },
          { key: 'module:employees.page:list.action:delete', label: 'Delete Employee' },
        ],
      },
      {
        key: 'module:employees.page:edit-agent',
        label: 'Edit Employee',
        actions: [
          { key: 'module:employees.page:edit-agent.action:regenerate-template', label: 'Regenerate Template' },
          { key: 'module:employees.page:edit-agent.action:improve-with-ai', label: 'Improve with AI' },
          { key: 'module:employees.page:edit-agent.action:delete', label: 'Delete Employee' },
        ],
      },
      {
        key: 'module:employees.page:training',
        label: 'Training',
      },
    ],
  },
  {
    // Staff — human employees the tenant/sub-tenant hires and grants per-feature
    // access to. Only owners/managers should get this (it manages other people).
    key: 'module:staff',
    label: 'Staff',
    pages: [
      {
        key: 'module:staff.page:list',
        label: 'Staff List',
        actions: [
          { key: 'module:staff.page:list.action:invite', label: 'Add / Invite Staff' },
          { key: 'module:staff.page:list.action:manage-access', label: 'Manage Access' },
        ],
      },
    ],
  },
  {
    // Command Center — human-employee workspace: combined calls, leads,
    // follow-ups and per-employee activity. Nested tabs are gate-able pages.
    key: 'module:command-center',
    label: 'Command Center',
    pages: [
      { key: 'module:command-center.page:calls', label: 'All Calls' },
      { key: 'module:command-center.page:leads', label: 'Leads' },
      { key: 'module:command-center.page:follow-ups', label: 'Follow-ups' },
      { key: 'module:command-center.page:activity', label: 'Employee Activity' },
    ],
  },
  {
    // Call Setup is its own top-level module (independent of Workflows).
    key: 'module:call-setup',
    label: 'Call Setup',
    pages: [
      {
        key: 'module:call-setup.page:inbound',
        label: 'Inbound',
      },
      {
        key: 'module:call-setup.page:outbound',
        label: 'Outbound',
        actions: [
          { key: 'module:call-setup.page:outbound.action:launch-campaign', label: 'Launch Campaign' },
        ],
      },
    ],
  },
  {
    key: 'module:workflows',
    label: 'Workflows',
    pages: [
      { key: 'module:workflows.page:canvas', label: 'Canvas Builder' },
      { key: 'module:workflows.page:documents', label: 'AI Docs' },
    ],
  },
  {
    // Connected apps (Zoho, Google Calendar, …) live under Feature Marketplace.
    key: 'module:marketplace',
    label: 'Feature Marketplace',
    pages: [
      { key: 'module:marketplace.page:browse', label: 'Browse Apps' },
      { key: 'module:marketplace.page:zoho', label: 'Zoho CRM' },
      { key: 'module:marketplace.page:google-calendar', label: 'Google Calendar' },
    ],
  },
  {
    key: 'module:analytics',
    label: 'Analytics & Call History',
    pages: [{ key: 'module:analytics.page:overview', label: 'Overview' }],
  },
  {
    key: 'module:monitoring',
    label: 'Monitoring & Reports',
    pages: [{ key: 'module:monitoring.page:overview', label: 'Overview' }],
  },
  {
    key: 'module:billing',
    label: 'Billing',
    pages: [{ key: 'module:billing.page:overview', label: 'Overview' }],
  },
  {
    // Sub Tenants — main-business-only management surface. Gate-able so a main
    // tenant can grant a staff member the ability to manage sub-tenants.
    key: 'module:sub-tenants',
    label: 'Sub Tenants',
    pages: [
      {
        key: 'module:sub-tenants.page:list',
        label: 'Sub Tenant List',
        actions: [
          { key: 'module:sub-tenants.page:list.action:create', label: 'Create Sub Tenant' },
          { key: 'module:sub-tenants.page:list.action:manage', label: 'Manage / Edit' },
        ],
      },
    ],
  },
  {
    key: 'module:settings',
    label: 'Settings',
    pages: [
      { key: 'module:settings.page:profile', label: 'Profile' },
      { key: 'module:settings.page:security', label: 'Security' },
      { key: 'module:settings.page:team', label: 'Team' },
      { key: 'module:settings.page:api', label: 'API Keys' },
      { key: 'module:settings.page:accounts', label: 'Connected Accounts' },
    ],
  },
];

/**
 * Modules that are always granted and can't be toggled off for a sub-tenant.
 * Dashboard is the landing surface everyone has. The Sidebar renders these
 * without a permissionKey, and PermissionMatrixEditor locks their toggles on.
 */
export const LOCKED_MODULE_KEYS = ['module:dashboard'] as const;

/** Every permission key under the always-granted modules (module + pages + actions). */
export function lockedPermissionKeys(): string[] {
  const locked = new Set<string>(LOCKED_MODULE_KEYS);
  const keys: string[] = [];
  for (const mod of PERMISSION_REGISTRY) {
    if (!locked.has(mod.key)) continue;
    keys.push(mod.key);
    for (const page of mod.pages) {
      keys.push(page.key);
      for (const action of page.actions || []) keys.push(action.key);
    }
  }
  return keys;
}

/** A grant map with every always-granted key forced on — merge into any map
 * before persisting so Dashboard is never saved as ungranted. */
export function withLockedGrants(grants: Record<string, boolean>): Record<string, boolean> {
  const next = { ...grants };
  for (const key of lockedPermissionKeys()) next[key] = true;
  return next;
}

/** Flat list of every permission key in the registry, module keys first. */
export function allPermissionKeys(): string[] {
  const keys: string[] = [];
  for (const mod of PERMISSION_REGISTRY) {
    keys.push(mod.key);
    for (const page of mod.pages) {
      keys.push(page.key);
      for (const action of page.actions || []) keys.push(action.key);
    }
  }
  return keys;
}

/** A grant map with every registry key set to `granted` — used for the
 * "Full Access" starting template and as the default for accounts with no
 * tenant context (see usePermission). */
export function fullAccessGrants(granted = true): Record<string, boolean> {
  const grants: Record<string, boolean> = {};
  for (const key of allPermissionKeys()) grants[key] = granted;
  return grants;
}
