import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bot } from 'lucide-react';
import AgentViewPage from '../Employees/AgentViewPage';
import { convertApiAgentToAgent, type Agent } from '../../contexts/AgentContext';
import { agentAPI } from '../../services/agentAPI';
import { mockAgentStore } from '../../services/mockAgentStore';
import appToast from '../../components/AppToast';
import TenantAgentScope from './TenantAgentScope';

const SALES_WHATSAPP_HREF = 'https://wa.me/919211490707?text=' + encodeURIComponent(
  'Hi ShivAI sales team, I want to activate live publishing for my ShivAI agent. Please help me get started.',
);
const SALES_EMAIL_HREF = 'mailto:hello@shivaitech.com?subject=' + encodeURIComponent('Activate live agent publishing');

const formatCallDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Hosts the REAL AgentViewPage for a sub-tenant's mock agent — the page
 * itself is reused unmodified; this component only supplies the props it
 * needs (a locally-fetched Agent, and simplified local state for the
 * publish/pause/delete confirmations and the "Test Chat" panel, which has no
 * real voice pipeline to connect to for a mock agent — starting a call just
 * shows an explanatory toast instead of a fake call).
 */
const SubTenantAgentViewPageInner = () => {
  // Route is /sub-tenants/:tenantId/agents/:id — AgentViewPage itself reads
  // `id` via its own useParams() call, so this component reads the SAME
  // params object (not a separate `agentId` name) to stay in sync with it.
  const { tenantId, id: agentId } = useParams<{ tenantId: string; id: string }>();
  const navigate = useNavigate();
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTestChat, setShowTestChat] = useState(false);

  const load = () => {
    if (!agentId) return;
    agentAPI.getAgentConfig(agentId).then(({ agent }) => setCurrentAgent(convertApiAgentToAgent(agent)));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  if (!currentAgent) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <div className="text-center">
          <Bot className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-400">Loading agent...</p>
        </div>
      </div>
    );
  }

  return (
    <AgentViewPage
      currentAgent={currentAgent}
      publishingAgents={new Set()}
      showQRModal={showQRModal}
      setShowQRModal={setShowQRModal}
      openAgentTestPage={() => appToast.info("Public test page isn't available for a sub-tenant preview agent.")}
      handlePublish={() => setShowPublishConfirm(true)}
      showPublishConfirm={showPublishConfirm}
      handlePublishCancel={() => setShowPublishConfirm(false)}
      handlePublishConfirm={async () => {
        if (!agentId) return;
        setIsPublishing(true);
        try {
          mockAgentStore.setPublished(tenantId!, agentId, true);
          load();
        } finally {
          setIsPublishing(false);
          setShowPublishConfirm(false);
        }
      }}
      isPublishing={isPublishing}
      showPublishContactModal={false}
      salesWhatsAppHref={SALES_WHATSAPP_HREF}
      salesEmailHref={SALES_EMAIL_HREF}
      handlePause={() => setShowPauseConfirm(true)}
      showPauseConfirm={showPauseConfirm}
      handlePauseCancel={() => setShowPauseConfirm(false)}
      handlePauseConfirm={async () => {
        if (!agentId) return;
        setIsPausing(true);
        try {
          mockAgentStore.setPublished(tenantId!, agentId, false);
          load();
        } finally {
          setIsPausing(false);
          setShowPauseConfirm(false);
        }
      }}
      isPausing={isPausing}
      showDeleteConfirm={showDeleteConfirm}
      handleDeleteCancel={() => setShowDeleteConfirm(false)}
      handleDeleteConfirm={async () => {
        if (!agentId) return;
        setIsDeleting(true);
        try {
          mockAgentStore.remove(tenantId!, agentId);
          navigate(`/sub-tenants/${tenantId}`);
        } finally {
          setIsDeleting(false);
        }
      }}
      isDeleting={isDeleting}
      showTestChat={showTestChat}
      setShowTestChat={setShowTestChat}
      room={null}
      setIsCallActive={() => {}}
      setIsRecording={() => {}}
      setConnectionStatus={() => {}}
      setStatusMessage={() => {}}
      callTimerInterval={null}
      setCallTimerInterval={() => {}}
      setCallDuration={() => {}}
      activeTestTab="call"
      setActiveTestTab={() => {}}
      connectionStatus="disconnected"
      statusMessage="Live test calls aren't available for a sub-tenant preview agent."
      isCallActive={false}
      callDuration={0}
      formatCallDuration={formatCallDuration}
      handleStartCall={() => appToast.info("Live test calls aren't available for a sub-tenant preview agent.")}
      isTestLoading={false}
      isConnecting={false}
      handleToggleMute={() => {}}
      isMuted={false}
      handleEndCall={() => {}}
      testConnection={() => {}}
      messages={[]}
      testInput=""
      setTestInput={() => {}}
      handleTestSend={() => {}}
    />
  );
};

const SubTenantAgentViewPage = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  if (!tenantId) return null;
  return (
    <TenantAgentScope tenantId={tenantId}>
      <SubTenantAgentViewPageInner />
    </TenantAgentScope>
  );
};

export default SubTenantAgentViewPage;
