import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  Globe,
  PhoneIncoming,
  PhoneOutgoing,
  AlertTriangle,
  Sparkles,
  X,
  Workflow,
  Zap,
  QrCode,
} from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import SearchableSelect from '../../components/SearchableSelect';
import Pagination from '../../components/Pagination';
import ModalOverlay from '../../components/ModalOverlay';
import { formatAgentLanguages } from '../../lib/utils';
import { mockAgentStore, type MockAgentRecord } from '../../services/mockAgentStore';
import QuickCreateAgentWizard, { type KbCreationProgress } from '../Employees/agents/QuickCreateAgentWizard';
import { createMockAgentDataSource } from '../Employees/agents/mockAgentDataSource';
import TenantAgentTrainModal from './TenantAgentTrainModal';
import TenantAgentQRModal from './TenantAgentQRModal';

const AGENTS_PER_PAGE = 6;

interface SubTenantAgentsProps {
  tenantId: string;
  companyName: string;
}

/**
 * Mirrors AgentManagement.tsx's card-grid list UI/CRUD actions for a
 * sub-tenant's AI employees, and reuses the SAME "Create AI Employee" wizard
 * (QuickCreateAgentWizard, extracted out of AgentManagement.tsx) via a mock
 * data source (mockAgentDataSource.ts) instead of the real backend — no KB
 * training pipeline or TTS voice preview exists for mock agents, so those
 * are stubbed to complete instantly / show an explanatory toast.
 */
const SubTenantAgents = ({ tenantId, companyName }: SubTenantAgentsProps) => {
  const navigate = useNavigate();
  const [refreshToken, setRefreshToken] = useState(0);
  const [agents, setAgents] = useState<MockAgentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [publishingIds, setPublishingIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<MockAgentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [trainAgent, setTrainAgent] = useState<MockAgentRecord | null>(null);
  const [qrAgent, setQrAgent] = useState<MockAgentRecord | null>(null);

  // QuickCreateAgentWizard's controlled minimize/creation state — this view
  // has no per-card "training in progress" overlay (mock KB completes
  // instantly), so these are just plumbing to satisfy the shared component's
  // props, not meaningfully user-visible here.
  const [isModalMinimized, setIsModalMinimized] = useState(false);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [creatingAgentId, setCreatingAgentId] = useState<string | null>(null);
  const [kbCreationProgress, setKbCreationProgress] = useState<KbCreationProgress>(null);

  useEffect(() => {
    setIsLoading(true);
    // Mirror the async feel of the real API without an artificial store dependency.
    const timer = setTimeout(() => {
      setAgents(mockAgentStore.list(tenantId) as MockAgentRecord[]);
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [tenantId, refreshToken]);

  const filtered = useMemo(() => {
    let list = agents;
    if (genderFilter !== 'all') list = list.filter((a) => a.gender === genderFilter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((a) => a.name.toLowerCase().includes(q));
    return list;
  }, [agents, search, genderFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / AGENTS_PER_PAGE));
  const paged = filtered.slice((page - 1) * AGENTS_PER_PAGE, page * AGENTS_PER_PAGE);

  const totalAgents = agents.length;
  const liveCount = agents.filter((a) => a.status === 'Published' || a.is_active).length;
  const unpublishedCount = totalAgents - liveCount;

  const refresh = () => setRefreshToken((n) => n + 1);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dataSource = useMemo(() => createMockAgentDataSource(tenantId, refresh), [tenantId]);

  const handleTogglePublish = (agent: MockAgentRecord) => {
    setPublishingIds((prev) => new Set(prev).add(agent.id));
    setTimeout(() => {
      mockAgentStore.setPublished(tenantId, agent.id, !(agent.status === 'Published' || agent.is_active));
      setPublishingIds((prev) => {
        const next = new Set(prev);
        next.delete(agent.id);
        return next;
      });
      refresh();
    }, 400);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      mockAgentStore.remove(tenantId, deleteTarget.id);
      setDeleteTarget(null);
      refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
        <p className="text-xs text-indigo-700 dark:text-indigo-300">
          Preview with sample data — will manage this sub-tenant's real AI employees once agents are tenant-scoped.
        </p>
      </div>

      {/* Header with stats */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="grid grid-cols-3 gap-2 lg:gap-4 flex-1">
          <div className="bg-white/50 flex items-center justify-center gap-1.5 dark:bg-slate-800/50 rounded-lg px-2 lg:px-6 py-2 text-center shadow-sm transition-all duration-200 hover:shadow-md">
            <p className="text-base lg:text-2xl font-bold text-slate-800 dark:text-white">{totalAgents}</p>
            <p className="text-[10px] lg:text-sm font-medium text-slate-600 dark:text-slate-400">Total</p>
          </div>
          <div className="bg-white/50 flex items-center justify-center gap-1.5 dark:bg-slate-800/50 rounded-lg px-2 lg:px-6 py-2 text-center shadow-sm transition-all duration-200 hover:shadow-md">
            <p className="text-base lg:text-2xl font-bold text-green-600 dark:text-green-400">{liveCount}</p>
            <p className="text-[10px] lg:text-sm font-medium text-slate-600 dark:text-slate-400">Live</p>
          </div>
          <div className="bg-white/50 flex items-center justify-center gap-1.5 dark:bg-slate-800/50 rounded-lg px-2 lg:px-6 py-2 text-center shadow-sm transition-all duration-200 hover:shadow-md">
            <p className="text-base lg:text-2xl font-bold text-orange-600 dark:text-orange-400">{unpublishedCount}</p>
            <p className="text-[10px] lg:text-sm font-medium text-slate-600 dark:text-slate-400">Unpublished</p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl text-sm lg:text-base font-medium bg-violet-600 hover:bg-violet-700 text-white transition-all shadow-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
          Create AI Employee
        </button>
      </div>

      {/* Search + filter */}
      <GlassCard>
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
              <input
                type="text"
                placeholder="Search agents..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white text-sm transition-all"
              />
            </div>
            <div className="hidden sm:block min-w-[140px]">
              <SearchableSelect
                options={[
                  { value: 'all', label: 'All Gender' },
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                ]}
                value={genderFilter}
                onChange={(v) => {
                  setGenderFilter(v);
                  setPage(1);
                }}
                placeholder="Filter by gender..."
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {[...Array(3)].map((_, i) => (
            <GlassCard key={i}>
              <div className="p-5 animate-pulse space-y-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
                <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            </GlassCard>
          ))}
        </div>
      ) : paged.length === 0 ? (
        <GlassCard className="p-2 sm:p-3">
          <div className="text-center py-10">
            <Bot className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {agents.length === 0 ? 'No AI employees created yet.' : 'No agents match your search'}
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {paged.map((agent) => {
            const isPublishing = publishingIds.has(agent.id);
            const isLive = agent.status === 'Published' || agent.is_active;
            const channelMeta = agent.agent_type === 'inbound'
              ? { label: 'Inbound', Icon: PhoneIncoming }
              : agent.agent_type === 'outbound'
              ? { label: 'Outbound', Icon: PhoneOutgoing }
              : { label: 'Web', Icon: Globe };

            return (
              <GlassCard key={agent.id} hover>
                <div className="p-4 sm:p-5 lg:p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 sm:w-6 h-5 sm:h-6 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-800 dark:text-white text-sm sm:text-base truncate">
                            {agent.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
                            {formatAgentLanguages(agent.language)} • {agent.personality}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-white bg-slate-900 dark:bg-slate-700 flex-shrink-0">
                          <channelMeta.Icon className="w-3 h-3" />
                          {channelMeta.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-4 text-xs sm:text-sm">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Voice</span>
                      <span className="text-slate-800 dark:text-white font-medium truncate">{agent.voice}</span>
                    </div>
                    {agent.gender && (
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Gender</span>
                        <span className="text-slate-800 dark:text-white font-medium capitalize truncate">{agent.gender}</span>
                      </div>
                    )}
                    {agent.business_process && (
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Process</span>
                        <span className="text-slate-800 dark:text-white font-medium capitalize truncate">{agent.business_process}</span>
                      </div>
                    )}
                    {agent.industry && (
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Industry</span>
                        <span className="text-slate-800 dark:text-white font-medium capitalize truncate">{agent.industry}</span>
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Created</span>
                      <span className="text-slate-800 dark:text-white font-medium truncate">
                        {new Date(agent.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">Company</span>
                      <span className="text-slate-800 dark:text-white font-medium truncate">{companyName}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-2.5 py-2 mb-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Workflow className="w-3 h-3" /> Integrated Workflows
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">None</span>
                  </div>

                  {agent.knowledge_base_status === 'failed' && (
                    <div className="w-full mb-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-red-700 dark:text-red-400">Knowledge Base Training Failed</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => navigate(`/sub-tenants/${tenantId}/agents/${agent.id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" /> View
                    </button>
                    <button
                      onClick={() => navigate(`/sub-tenants/${tenantId}/agents/${agent.id}/edit`)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() =>
                        agent.knowledge_base_status === 'failed' ? undefined : setTrainAgent(agent)
                      }
                      disabled={agent.knowledge_base_status === 'failed'}
                      title={agent.knowledge_base_status === 'failed' ? 'KB training failed — re-upload required' : 'Train'}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                        agent.knowledge_base_status === 'failed'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                          : 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                      }`}
                    >
                      <Zap className="w-4 h-4" /> Train
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePublish(agent)}
                      disabled={isPublishing}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-white ${
                        isPublishing ? 'opacity-50 cursor-not-allowed bg-slate-400' : isLive ? 'bg-slate-600 hover:bg-slate-700' : 'bg-violet-600 hover:bg-violet-700'
                      }`}
                    >
                      {isPublishing ? (
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : isLive ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      {isPublishing ? '...' : isLive ? 'Pause' : 'Publish'}
                    </button>
                    {isLive && (
                      <button
                        onClick={() => setQrAgent(agent)}
                        className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Show QR code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget(agent)}
                      className="p-2.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete agent"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {totalAgents > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          itemsPerPage={AGENTS_PER_PAGE}
          onPageChange={setPage}
        />
      )}

      <QuickCreateAgentWizard
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onRequestOpen={() => setShowCreateModal(true)}
        dataSource={dataSource}
        publishAllowedEmails={[]}
        userEmail={undefined}
        isModalMinimized={isModalMinimized}
        setIsModalMinimized={setIsModalMinimized}
        isCreatingAgent={isCreatingAgent}
        setIsCreatingAgent={setIsCreatingAgent}
        creatingAgentId={creatingAgentId}
        setCreatingAgentId={setCreatingAgentId}
        kbCreationProgress={kbCreationProgress}
        setKbCreationProgress={setKbCreationProgress}
        onAgentListRefresh={refresh}
      />

      <ModalOverlay open={!!deleteTarget} onClose={() => (isDeleting ? undefined : setDeleteTarget(null))} closeOnBackdrop={!isDeleting} panelClassName="max-w-sm">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-slate-800 dark:text-white">Delete AI Employee</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {deleteTarget?.name} will be permanently removed.
                </p>
              </div>
            </div>
            <button onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex-shrink-0 disabled:opacity-40">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex gap-2.5">
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </ModalOverlay>

      <TenantAgentTrainModal agent={trainAgent} onClose={() => setTrainAgent(null)} />
      <TenantAgentQRModal agent={qrAgent} onClose={() => setQrAgent(null)} />
    </div>
  );
};

export default SubTenantAgents;
