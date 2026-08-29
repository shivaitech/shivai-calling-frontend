import { useEffect } from 'react';
import { setTenantScope } from '../../services/agentAPI';

/**
 * Puts agentAPI into "tenant scope" for as long as this wrapper is mounted,
 * so the real EditAgent / AgentViewPage pages (rendered unmodified at
 * /sub-tenants/:tenantId/agents/:agentId routes — see App.tsx) read/write a
 * per-tenant mock store instead of the real backend. Cleared on unmount so
 * navigating back to the Main Business's own /agents is unaffected.
 */
const TenantAgentScope = ({ tenantId, children }: { tenantId: string; children: React.ReactNode }) => {
  useEffect(() => {
    setTenantScope(tenantId);
    return () => setTenantScope(null);
  }, [tenantId]);

  return <>{children}</>;
};

export default TenantAgentScope;
