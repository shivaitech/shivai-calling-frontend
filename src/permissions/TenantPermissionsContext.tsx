import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { tenantAPI } from '../services/tenantAPI';
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

/**
 * Loads the CURRENT user's own tenant's permission grants (only meaningful
 * for SUBTENANT_* users — see usePermission for how Main Business roles skip
 * this entirely). Fetched once per session and cached here rather than
 * re-fetched on every usePermission() call.
 */
export const TenantPermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [grants, setGrants] = useState<PermissionGrantMap>({});
  const [loaded, setLoaded] = useState(false);

  const refresh = async () => {
    if (!user?.tenantId) {
      setGrants({});
      setLoaded(true);
      return;
    }
    try {
      const res = await tenantAPI.getPermissions(user.tenantId);
      setGrants(res.grants);
    } catch (err) {
      console.error('Failed to load tenant permissions:', err);
      setGrants({});
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
