import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth, TENANT_GRANTS_STORAGE_KEY } from '../contexts/AuthContext';
import { getMyProfile } from '../services/subTenantsAPI';
import { withLockedGrants } from './registry';
import type { PermissionGrantMap } from './types';

interface TenantPermissionsContextType {
  grants: PermissionGrantMap;
  loaded: boolean;
  refresh: () => Promise<void>;
}

const TenantPermissionsContext = createContext<TenantPermissionsContextType>({
  grants: {},
  loaded: false,
  refresh: async () => {},
});

// Read the grant map the login flow cached from GET /users/profile so the very
// first render (before the background refresh) already has the right access.
const readCachedGrants = (): PermissionGrantMap | null => {
  try {
    const raw = localStorage.getItem(TENANT_GRANTS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as PermissionGrantMap) : null;
  } catch {
    return null;
  }
};

/**
 * Loads the CURRENT user's permission grants (only meaningful for SUBTENANT_*
 * users — see usePermission for how Main Business roles skip this entirely).
 * Grants come from the signed-in user's own profile (GET /users/profile),
 * cached by the login flow and refreshed here once per session. Dashboard and
 * other always-on modules are forced granted (withLockedGrants).
 */
export const TenantPermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [grants, setGrants] = useState<PermissionGrantMap>({});
  const [loaded, setLoaded] = useState(false);

  const refresh = async () => {
    // No tenant context → not a gated sub-tenant/staff; nothing to load.
    if (!user?.tenantId) {
      setGrants({});
      setLoaded(true);
      return;
    }
    // Staff have no always-on modules — Dashboard is grantable for them, so
    // don't force-lock it. Sub-tenants keep the locked (always-on) modules.
    const isStaff = user?.tenantRole === 'STAFF';
    const applyLocks = (g: PermissionGrantMap) => (isStaff ? g : withLockedGrants(g));
    // Seed from the cached map immediately so we don't flash-deny on reload.
    const cached = readCachedGrants();
    if (cached) {
      setGrants(applyLocks(cached));
      setLoaded(true);
    }
    try {
      const profile = await getMyProfile();
      const next = applyLocks(profile.grants);
      setGrants(next);
      try {
        localStorage.setItem(TENANT_GRANTS_STORAGE_KEY, JSON.stringify(profile.grants));
      } catch {
        /* storage may be unavailable — the in-memory grants still apply */
      }
    } catch (err) {
      console.error('Failed to load tenant permissions:', err);
      // Keep the cached grants if we had them; otherwise deny-by-default.
      if (!cached) setGrants({});
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    setLoaded(false);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.tenantId]);

  return (
    <TenantPermissionsContext.Provider value={{ grants, loaded, refresh }}>
      {children}
    </TenantPermissionsContext.Provider>
  );
};

export const useTenantPermissions = () => useContext(TenantPermissionsContext);
