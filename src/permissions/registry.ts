import type { PermissionModule } from './types';

/**
 * Declarative module -> page -> action tree. This is the single source of
 * truth for every gate-able surface in the app — the Sub Tenants permission
 * matrix (PermissionMatrixEditor) renders directly from this list, and
 * usePermission()/PermissionRoute check against it. Add a row here whenever
 * a new page/action should be independently restrictable for a sub-tenant.
 * See SUB_TENANTS_MODULE_SPEC.md §5.
 */
export const PERMISSION_REGISTRY: PermissionModule[] = [
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
    key: 'module:workflows',
    label: 'Workflows',
    pages: [
      {
        key: 'module:workflows.page:call-setup',
        label: 'Call Setup',
        actions: [
          { key: 'module:workflows.page:call-setup.action:launch-campaign', label: 'Launch Campaign' },
        ],
      },
      { key: 'module:workflows.page:canvas', label: 'Canvas Builder' },
      { key: 'module:workflows.page:documents', label: 'AI Docs' },
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
    key: 'module:zoho',
    label: 'Zoho CRM',
    pages: [{ key: 'module:zoho.page:dashboard', label: 'Dashboard' }],
  },
  {
    key: 'module:google-calendar',
    label: 'Google Calendar',
    pages: [{ key: 'module:google-calendar.page:events', label: 'Events' }],
  },
  {
    key: 'module:marketplace',
    label: 'Feature Marketplace',
    pages: [{ key: 'module:marketplace.page:browse', label: 'Browse Apps' }],
  },
  {
    key: 'module:billing',
    label: 'Billing',
    pages: [{ key: 'module:billing.page:overview', label: 'Overview' }],
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
