import { useAuth } from '../contexts/AuthContext';
import { useTenantPermissions } from './TenantPermissionsContext';
import type { PermissionGrantMap } from './types';
import type { TenantRole } from '../contexts/AuthContext';

/**
 * Core grant check, extracted from the hook so call sites that need to check
 * many keys (e.g. filtering a nav-item array) don't have to call a hook once
 * per key inside a loop (violates rules-of-hooks). Use usePermission() for a
 * single key, useCanAccess() when checking a whole list.
 */
function checkPermission(
  tenantId: string | undefined,
  tenantRole: TenantRole | undefined,
  grants: PermissionGrantMap,
  loaded: boolean,
  key: string,
): boolean {
  // No tenant context, or the tenant's own permissions haven't loaded yet —
  // fail open (never block) rather than flash content in/out while loading.
  if (!tenantId || !tenantRole) return true;

  // Main Business roles are never restricted by a permission matrix —
  // that matrix is what THEY set for sub-tenants, not for themselves.
  if (tenantRole === 'MAIN_OWNER' || tenantRole === 'MAIN_ADMIN' || tenantRole === 'MAIN_MEMBER') {
    return true;
  }

  if (!loaded) return true;

  // Deny-by-default per spec §5.4 — but only once grants have actually loaded.
  return grants[key] === true;
}

/**
 * Returns whether the current user can access a given module/page/action
 * permission key (see registry.ts for the key taxonomy).
 *
 * Accounts with no tenantId (every account today, until sub-tenants are
 * actually assigned) are never restricted — this hook is additive: it only
 * starts denying things once a real SUBTENANT_* tenant with an explicit
 * grant map is in play. This keeps the whole existing app unaffected until
 * a Main Business actually configures a sub-tenant's permissions.
 */
export function usePermission(key: string): boolean {
  const { user } = useAuth();
  const { grants, loaded } = useTenantPermissions();
  return checkPermission(user?.tenantId, user?.tenantRole, grants, loaded, key);
}

/**
 * Returns a stable checker function for filtering/mapping over many
 * permission keys at once (e.g. Sidebar nav items) without calling a hook
 * per item. `checker(key)` — same semantics as usePermission(key).
 */
export function useCanAccess(): (key: string) => boolean {
  const { user } = useAuth();
  const { grants, loaded } = useTenantPermissions();
  return (key: string) => checkPermission(user?.tenantId, user?.tenantRole, grants, loaded, key);
}
