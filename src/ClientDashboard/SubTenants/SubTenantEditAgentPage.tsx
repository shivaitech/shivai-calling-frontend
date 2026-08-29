import { useParams } from 'react-router-dom';
import EditAgent from '../Employees/EditAgent';
import TenantAgentScope from './TenantAgentScope';

/**
 * Hosts the REAL EditAgent page (unmodified — it takes no props, reading
 * everything from useParams/agentAPI internally) for a sub-tenant's mock
 * agent. TenantAgentScope puts agentAPI into tenant-scoped mode for as long
 * as this route is mounted, so EditAgent's getAgentConfig/updateAgent/
 * uploadKnowledgeBase/getPresignedUrl calls read/write the mock store.
 */
const SubTenantEditAgentPage = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  if (!tenantId) return null;
  return (
    <TenantAgentScope tenantId={tenantId}>
      <EditAgent />
    </TenantAgentScope>
  );
};

export default SubTenantEditAgentPage;
