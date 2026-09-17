/**
 * Real, sub-tenant-scoped QuickCreateDataSource.
 *
 * Used by the Sub Tenant detail "AI Employees" tab so a Main Business can create
 * an AI employee that belongs to a specific sub-tenant. Create sends
 * `sub_tenant_id` so the backend attributes the agent to that sub-tenant; KB
 * upload / progress / voice preview reuse the real production implementations.
 */
import { agentAPI } from '../../../services/agentAPI';
import realAgentDataSource from './realAgentDataSource';
import type { QuickCreateDataSource } from './QuickCreateAgentWizard';

/** Builds a real data source that tags created agents with sub_tenant_id. */
export function createSubTenantAgentDataSource(
  subTenantId: string,
  onAgentCreated: () => void,
): QuickCreateDataSource {
  return {
    ...realAgentDataSource,
    createAgentFull: async (payload) => {
      const agent = await agentAPI.createAgentFull(payload, subTenantId);
      onAgentCreated();
      return agent;
    },
  };
}

export default createSubTenantAgentDataSource;
