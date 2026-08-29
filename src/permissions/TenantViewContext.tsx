import React, { createContext, useContext, useState } from 'react';
import { tenantAPI } from '../services/tenantAPI';
import type { Tenant } from './types';

interface TenantViewState {
  tenant: Tenant | null;
  enteredAt: string | null;
}

interface TenantViewContextType extends TenantViewState {
  isViewing: boolean;
  enterView: (tenant: Tenant) => Promise<void>;
  exitView: () => Promise<void>;
}

const TenantViewContext = createContext<TenantViewContextType>({
  tenant: null,
  enteredAt: null,
  isViewing: false,
  enterView: async () => {},
  exitView: async () => {},
});

/**
 * "Enter Tenant View" observer-mode state (spec §8.1). A Main Business admin
 * can enter this mode from SubTenantDetail; the whole authed shell then
 * renders a persistent banner (TenantViewBanner) until they exit. Every
 * enter/exit is written to the tenant's audit log (§8.2) — visible to the
 * sub-tenant themselves too, for transparency.
 *
 * NOTE: there is no backend-issued scoped view token yet (no multi-tenant
 * data isolation exists server-side), so entering this mode does not
 * actually re-scope API calls to the sub-tenant's real data — it only
 * provides the UI shell/banner and the audit trail. Wiring real scoped data
 * is a backend-dependent follow-up (see SUB_TENANTS_MODULE_SPEC.md §8.1, §9).
 */
export const TenantViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [enteredAt, setEnteredAt] = useState<string | null>(null);

  const enterView = async (t: Tenant) => {
    setTenant(t);
    const now = new Date().toISOString();
    setEnteredAt(now);
    await tenantAPI.recordViewSession(t.id, 'enter');
  };

  const exitView = async () => {
    if (tenant) await tenantAPI.recordViewSession(tenant.id, 'exit');
    setTenant(null);
    setEnteredAt(null);
  };

  return (
    <TenantViewContext.Provider value={{ tenant, enteredAt, isViewing: !!tenant, enterView, exitView }}>
      {children}
    </TenantViewContext.Provider>
  );
};

export const useTenantView = () => useContext(TenantViewContext);
