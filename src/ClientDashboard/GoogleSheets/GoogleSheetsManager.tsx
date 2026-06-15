import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, SheetColumn } from '../../services/authAPI';
import { agentAPI, ApiAgent } from '../../services/agentAPI';
import GlassCard from '../../components/GlassCard';
import {
  ArrowLeft,
  ExternalLink,
  Plus,
  Users,
  Loader2,
  X,
  FileSpreadsheet,
  Check,
  ChevronDown,
  Phone,
  HeadphonesIcon,
  TicketIcon,
  Package,
  CalendarDays,
  Target,
  Play,
} from 'lucide-react';

interface Sheet {
  id: string;
  name: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  tab_name: string;
  columns: SheetColumn[];
}

const TEMPLATES: Template[] = [
  {
    id: 'call_logs',
    name: 'Call Logs',
    description: 'Track all AI agent call activity',
    icon: <Phone className="w-4 h-4" />,
    tab_name: 'Call Logs',
    columns: [
      { header: 'Start Date', field: 'start_date', required: true },
      { header: 'Start Time', field: 'start_time', required: false },
      { header: 'End Date', field: 'end_date', required: true },
      { header: 'End Time', field: 'end_time', required: false },
      { header: 'Caller Name', field: 'caller_name', required: true, ask_as: "What is the caller's name?" },
      { header: 'Phone', field: 'phone', required: false, ask_as: 'What is their phone number?' },
      { header: 'Assignee', field: 'assignee', required: false, ask_as: 'Who handled this call?' },
      { header: 'Duration', field: 'duration', required: false },
      { header: 'Direction', field: 'direction', required: false },
      { header: 'Status', field: 'status', required: false },
      { header: 'Outcome', field: 'outcome', required: false, ask_as: 'What was the call outcome?' },
      { header: 'Remarks', field: 'remarks', required: false },
    ],
  },
  {
    id: 'leads',
    name: 'Lead Management',
    description: 'Capture and manage sales leads',
    icon: <Target className="w-4 h-4" />,
    tab_name: 'Leads',
    columns: [
      { header: 'Name', field: 'name', required: true, ask_as: "What is the lead's name?" },
      { header: 'Phone', field: 'phone', required: true, ask_as: 'What is their phone number?' },
      { header: 'Email', field: 'email', required: false },
      { header: 'Company', field: 'company', required: false, ask_as: 'What company are they from?' },
      { header: 'Source', field: 'source', required: false },
      { header: 'Stage', field: 'stage', required: false },
      { header: 'Assignee', field: 'assignee', required: false, ask_as: 'Who is the assigned sales rep?' },
      { header: 'Status', field: 'status', required: false },
      { header: 'Start Date', field: 'start_date', required: true, ask_as: 'When did we first engage with this lead?' },
      { header: 'End Date', field: 'end_date', required: true, ask_as: 'What is the expected close or follow-up date?' },
      { header: 'Remarks', field: 'remarks', required: false },
    ],
  },
  {
    id: 'support',
    name: 'Customer Support',
    description: 'Log support requests and resolutions',
    icon: <HeadphonesIcon className="w-4 h-4" />,
    tab_name: 'Support',
    columns: [
      { header: 'Name', field: 'name', required: true, ask_as: "What is the customer's name?" },
      { header: 'Phone', field: 'phone', required: false },
      { header: 'Email', field: 'email', required: false },
      { header: 'Issue', field: 'issue', required: true, ask_as: 'What is the issue?' },
      { header: 'Category', field: 'category', required: false },
      { header: 'Priority', field: 'priority', required: false },
      { header: 'Assignee', field: 'assignee', required: false, ask_as: 'Who is assigned to handle this?' },
      { header: 'Status', field: 'status', required: false },
      { header: 'Start Date', field: 'start_date', required: true, ask_as: 'When was the issue reported?' },
      { header: 'End Date', field: 'end_date', required: true, ask_as: 'What is the target resolution date?' },
      { header: 'Remarks', field: 'remarks', required: false },
    ],
  },
  {
    id: 'tickets',
    name: 'Help Desk Tickets',
    description: 'Manage support tickets end-to-end',
    icon: <TicketIcon className="w-4 h-4" />,
    tab_name: 'Tickets',
    columns: [
      { header: 'Ticket ID', field: 'ticket_id', required: false },
      { header: 'Customer', field: 'customer', required: true, ask_as: "What is the customer's name?" },
      { header: 'Phone', field: 'phone', required: false },
      { header: 'Email', field: 'email', required: false },
      { header: 'Issue', field: 'issue', required: true, ask_as: 'What is the issue?' },
      { header: 'Category', field: 'category', required: false },
      { header: 'Priority', field: 'priority', required: false },
      { header: 'Assignee', field: 'assignee', required: false, ask_as: 'Who is the assigned agent?' },
      { header: 'Status', field: 'status', required: false },
      { header: 'Start Date', field: 'start_date', required: true, ask_as: 'When was the ticket opened?' },
      { header: 'End Date', field: 'end_date', required: true, ask_as: 'When was or will it be resolved?' },
      { header: 'Remarks', field: 'remarks', required: false },
    ],
  },
  {
    id: 'inventory',
    name: 'Product Inventory',
    description: 'Track products, stock and pricing',
    icon: <Package className="w-4 h-4" />,
    tab_name: 'Inventory',
    columns: [
      { header: 'Product Name', field: 'product_name', required: true, ask_as: 'What is the product name?' },
      { header: 'SKU', field: 'sku', required: false },
      { header: 'Category', field: 'category', required: false },
      { header: 'Stock', field: 'stock', required: false },
      { header: 'Price', field: 'price', required: false },
      { header: 'Reorder Level', field: 'reorder_level', required: false },
      { header: 'Supplier', field: 'supplier', required: false },
      { header: 'Assignee', field: 'assignee', required: false, ask_as: 'Who manages this product?' },
      { header: 'Status', field: 'status', required: false },
      { header: 'Start Date', field: 'start_date', required: true, ask_as: 'When was this product added or last restocked?' },
      { header: 'End Date', field: 'end_date', required: true, ask_as: 'What is the expiry or review date?' },
      { header: 'Remarks', field: 'remarks', required: false },
    ],
  },
  {
    id: 'appointments',
    name: 'Appointments',
    description: 'Schedule and track bookings',
    icon: <CalendarDays className="w-4 h-4" />,
    tab_name: 'Appointments',
    columns: [
      { header: 'Customer Name', field: 'customer_name', required: true, ask_as: "What is the customer's name?" },
      { header: 'Phone', field: 'phone', required: true, ask_as: 'What is their phone number?' },
      { header: 'Email', field: 'email', required: false },
      { header: 'Service', field: 'service', required: false, ask_as: 'What service is requested?' },
      { header: 'Assignee', field: 'assignee', required: false, ask_as: 'Who is the assigned staff member?' },
      { header: 'Status', field: 'status', required: false },
      { header: 'Start Date', field: 'start_date', required: true, ask_as: 'What is the appointment start date?' },
      { header: 'Start Time', field: 'start_time', required: true, ask_as: 'What time does it start?' },
      { header: 'End Date', field: 'end_date', required: true, ask_as: 'What is the appointment end date?' },
      { header: 'End Time', field: 'end_time', required: false, ask_as: 'What time does it end?' },
      { header: 'Remarks', field: 'remarks', required: false },
    ],
  },
];

const SheetIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" fill="#0F9D58" />
    <rect x="7" y="7" width="4" height="10" rx="0.5" fill="white" fillOpacity="0.9" />
    <rect x="13" y="7" width="4" height="10" rx="0.5" fill="white" fillOpacity="0.9" />
    <rect x="7" y="11" width="10" height="1.5" fill="#0F9D58" />
  </svg>
);

const GoogleSheetsManager = () => {
  const navigate = useNavigate();

  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageAgents, setPageAgents] = useState<ApiAgent[]>([]);
  const [pageIntegrations, setPageIntegrations] = useState<any[]>([]);
  const [pageCredentialId, setPageCredentialId] = useState('');

  // ── Assign modal ──
  const [assignSheet, setAssignSheet] = useState<Sheet | null>(null);
  const [agents, setAgents] = useState<ApiAgent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [existingIntegrationId, setExistingIntegrationId] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [assignError, setAssignError] = useState('');

  // ── Create modal ──
  const [createOpen, setCreateOpen] = useState(false);
  const [createAgents, setCreateAgents] = useState<ApiAgent[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [sheetTitle, setSheetTitle] = useState('');
  const [tabName, setTabName] = useState('');
  const [createAgentId, setCreateAgentId] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    Promise.all([
      authAPI.fetchGoogleSheets(),
      authAPI.getIntegrations('google_sheets').catch(() => []),
      agentAPI.getAgents().catch(() => []),
      authAPI.getOAuthStatus().catch(() => []),
    ]).then(([sheetsData, integrationsData, agentsData, oauthStatus]) => {
      // Only show sheets that were created in our panel (have an agent integration)
      const connectedSheetIds = new Set(
        (integrationsData as any[]).map((i: any) => i.config?.google_sheets?.sheet_id ?? i.sheet_id).filter(Boolean)
      );
      setSheets((sheetsData as Sheet[]).filter(s => connectedSheetIds.has(s.id)));
      setPageIntegrations(integrationsData);
      setPageAgents(agentsData);
      const googleCred = (oauthStatus as any[]).find((s: any) => s.provider?.includes('google'));
      setPageCredentialId(googleCred?.credential_id ?? '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const getSheetAssignment = (sheetId: string) => {
    const integration = pageIntegrations.find((i: any) =>
      i.config?.google_sheets?.sheet_id === sheetId || i.sheet_id === sheetId
    );
    if (!integration) return null;
    const agentId = integration.agent_id ?? integration.agentId ?? '';
    const agent = pageAgents.find(a => a.id === agentId);
    return { integrationId: integration._id ?? integration.id ?? '', agentId, agentName: agent?.name ?? '' };
  };

  // ── Assign handlers ──
  const handleAssign = async (sheet: Sheet) => {
    setAssignSheet(sheet);
    setAssignSuccess(false);
    setAssignError('');
    // Use page-level data for instant open
    setAgents(pageAgents);
    setCredentialId(pageCredentialId);
    const existing = getSheetAssignment(sheet.id);
    setSelectedAgentId(existing?.agentId ?? '');
    setExistingIntegrationId(existing?.integrationId ?? '');
  };

  const handleAssignSave = async () => {
    if (!assignSheet || !selectedAgentId) return;
    setAssigning(true);
    setAssignError('');
    try {
      if (existingIntegrationId) {
        await authAPI.updateIntegration(existingIntegrationId, { agent_id: selectedAgentId });
      } else {
        await authAPI.createIntegration({
          agent_id: selectedAgentId,
          service_name: 'google_sheets',
          label: assignSheet.name,
          credential_id: credentialId,
          config: {
            google_sheets: {
              sheet_id: assignSheet.id,
              sheet_name: assignSheet.name,
              tab_name: 'Sheet1',
            },
          },
        });
      }
      // Update local integrations so card reflects new assignment without refetch
      setPageIntegrations(prev => {
        const filtered = prev.filter((i: any) =>
          (i.config?.google_sheets?.sheet_id ?? i.sheet_id) !== assignSheet.id
        );
        return [...filtered, {
          _id: existingIntegrationId || `tmp-${Date.now()}`,
          agent_id: selectedAgentId,
          config: { google_sheets: { sheet_id: assignSheet.id, sheet_name: assignSheet.name } },
        }];
      });
      setAssignSuccess(true);
      setTimeout(() => { setAssignSheet(null); setAssignSuccess(false); }, 1500);
    } catch (err: any) {
      setAssignError(err?.response?.data?.message ?? 'Failed to assign. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  // ── Create handlers ──
  const openCreate = async () => {
    setCreateOpen(true);
    setSelectedTemplate(null);
    setSheetTitle('');
    setTabName('');
    setCreateAgentId('');
    setCreateError('');
    try {
      const data = await agentAPI.getAgents();
      setCreateAgents(data);
    } catch { /* ignore */ }
  };

  const handleSelectTemplate = (tpl: Template) => {
    setSelectedTemplate(tpl);
    if (!sheetTitle) setSheetTitle(tpl.name);
    setTabName(tpl.tab_name);
  };

  const handleCreate = async () => {
    if (!sheetTitle.trim() || !createAgentId) return;
    setCreating(true);
    setCreateError('');
    try {
      const payload: any = {
        agent_id: createAgentId,
        title: sheetTitle.trim(),
      };
      if (tabName.trim()) payload.tab_name = tabName.trim();
      if (selectedTemplate) payload.columns = selectedTemplate.columns;

      const result = await authAPI.createGoogleSheet(payload);

      // Add new sheet and its integration to local state so it passes the "connected" filter
      const newSheet = { id: result.sheet_id, name: result.sheet_name };
      setSheets(prev => [newSheet, ...prev]);
      setPageIntegrations(prev => [...prev, {
        _id: `tmp-${Date.now()}`,
        agent_id: createAgentId,
        config: { google_sheets: { sheet_id: result.sheet_id, sheet_name: result.sheet_name } },
      }]);
      setCreateOpen(false);
      navigate(`/google-sheets/${result.sheet_id}/view?name=${encodeURIComponent(result.sheet_name)}&new=true`);
    } catch (err: any) {
      setCreateError(err?.response?.data?.message ?? 'Failed to create sheet. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-5 w-full">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/settings')}
            className="common-button-bg2 flex items-center gap-1.5 px-3 py-2 rounded-xl flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Back</span>
          </button>

          <div className="hidden sm:block h-7 w-px bg-slate-200 dark:bg-slate-700 flex-shrink-0" />

          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
              <SheetIcon />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white leading-tight">Google Sheets</h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">Manage & assign spreadsheets to your AI Employees</p>
            </div>
          </div>
        </div>

        <button
          onClick={openCreate}
          className="common-button-bg flex items-center gap-1.5 !px-3 !py-2 rounded-xl text-xs font-medium flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Sheet</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* ── Sheets grid ── */}
      <GlassCard>
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="text-sm text-slate-500 dark:text-slate-400">Loading your spreadsheets…</span>
            </div>
          ) : sheets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <FileSpreadsheet className="w-7 h-7 text-green-500" />
              </div>
              <div className="text-center">
                <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">No spreadsheets found</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Create a new sheet or connect your Google account</p>
              </div>
              <button
                onClick={openCreate}
                className="common-button-bg flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Create Sheet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sheets.map(sheet => {
                const assignment = getSheetAssignment(sheet.id);
                return (
                <div
                  key={sheet.id}
                  className="common-bg-icons rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-3 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                      <SheetIcon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-white text-sm leading-snug line-clamp-2">{sheet.name}</p>
                      {assignment?.agentName ? (
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{assignment.agentName}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">No agent assigned</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/google-sheets/${sheet.id}/view?name=${encodeURIComponent(sheet.name)}`)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium common-button-bg2 flex-shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View
                    </button>
                    <button
                      onClick={() => assignment?.agentId && navigate(`/agents/${assignment.agentId}`)}
                      disabled={!assignment?.agentId}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium common-button-bg2 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Test AI
                    </button>
                    <button
                      onClick={() => handleAssign(sheet)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium common-button-bg transition-all active:scale-[0.98]"
                    >
                      <Users className="w-3.5 h-3.5 flex-shrink-0" />
                      {assignment ? 'Update Agent' : 'Assign AI'}
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </GlassCard>

      {/* ── Create Sheet modal ── */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 my-auto">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  <SheetIcon />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Create New Sheet</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Choose a template & link to an AI Employee</p>
                </div>
              </div>
              <button
                onClick={() => setCreateOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Template picker */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Choose a Template <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedTemplate?.id ?? ''}
                    onChange={e => {
                      const tpl = TEMPLATES.find(t => t.id === e.target.value) ?? null;
                      if (tpl) handleSelectTemplate(tpl);
                      else { setSelectedTemplate(null); }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-800 dark:text-white appearance-none pr-8"
                  >
                    <option value="">No template — blank sheet</option>
                    {TEMPLATES.map(tpl => (
                      <option key={tpl.id} value={tpl.id}>{tpl.name} — {tpl.description}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                {/* Column preview */}
                {selectedTemplate && (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Columns</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTemplate.columns.map(col => (
                        <span key={col.field} className="text-[11px] px-2 py-0.5 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium">
                          {col.header}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sheet title */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Sheet Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={sheetTitle}
                  onChange={e => setSheetTitle(e.target.value)}
                  placeholder="e.g. Customer Complaints Q2"
                  className="w-full px-3 py-2.5 rounded-xl text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-800 dark:text-white placeholder:text-slate-400"
                />
              </div>

              {/* Tab name */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Tab Name <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={tabName}
                  onChange={e => setTabName(e.target.value)}
                  placeholder="e.g. Sheet1"
                  className="w-full px-3 py-2.5 rounded-xl text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-800 dark:text-white placeholder:text-slate-400"
                />
              </div>

              {/* AI Employee */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Link to AI Employee <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={createAgentId}
                    onChange={e => setCreateAgentId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-800 dark:text-white appearance-none pr-8"
                  >
                    <option value="" disabled>Choose an AI Employee…</option>
                    {createAgents.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Error */}
              {createError && (
                <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                  {createError}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => setCreateOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium common-bg-icons border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!sheetTitle.trim() || !createAgentId || creating}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium common-button-bg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                  ) : (
                    <><Plus className="w-4 h-4" /> Create Sheet</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign modal ── */}
      {assignSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                  <SheetIcon />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-white">{existingIntegrationId ? 'Update Assignment' : 'Assign AI'}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{assignSheet.name}</p>
                </div>
              </div>
              <button
                onClick={() => setAssignSheet(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Select AI Employee <span className="text-red-400">*</span></label>
              <div className="relative">
                <select
                  value={selectedAgentId}
                  onChange={e => setSelectedAgentId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-800 dark:text-white appearance-none pr-8"
                >
                  <option value="" disabled>Choose an AI Employee…</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            {assignError && (
              <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                {assignError}
              </p>
            )}
            <div className="flex gap-2.5">
              <button
                onClick={() => setAssignSheet(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium common-bg-icons border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSave}
                disabled={!selectedAgentId || assigning || assignSuccess}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium common-button-bg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {assigning ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                ) : assignSuccess ? (
                  <><Check className="w-4 h-4" /> {existingIntegrationId ? 'Updated!' : 'Assigned!'}</>
                ) : existingIntegrationId ? 'Update' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleSheetsManager;
