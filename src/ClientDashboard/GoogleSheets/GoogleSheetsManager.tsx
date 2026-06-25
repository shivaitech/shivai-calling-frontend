import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, SheetColumn } from '../../services/authAPI';
import { agentAPI, ApiAgent } from '../../services/agentAPI';
import GlassCard from '../../components/GlassCard';
import SearchableSelect from '../../components/SearchableSelect';
import ModalOverlay from '../../components/ModalOverlay';
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
  UserCog,
  AlertTriangle,
  Columns3,
  Trash2,
  Settings2,
} from 'lucide-react';
import SheetColumnsModal, { SheetColumnsModalTarget } from './SheetColumnsModal';
import DeleteIntegrationModal from './DeleteIntegrationModal';
import AgentPickerField from './AgentPickerField';
import { getLinkedGoogleSheetsAgentIds } from './agentPickerUtils';
import { cloneColumns, applyAiFillDefaults, normalizeColumnsForApi, roleBadgeClass } from './sheetColumnUtils';
import {
  DEFAULT_DIRECTORY_COLUMNS,
  DEFAULT_DIRECTORY_TAB_NAME,
  DEFAULT_INTEGRATION_TIMEZONE,
  getDirectorySheetId,
  hasAutoAssignment,
  buildAssignmentConfig,
  GoogleSheetsIntegrationConfig,
  markGoogleSheetRecent,
  sheetViewPath,
  isGoogleSheetRecent,
  buildFullIntegrationConfig,
  resolveDataSheetColumns,
  defaultDirectorySheetTitle,
  DiscoveredGoogleSheet,
  rosterSheetsForPicker,
  getLinkedDirectoryForDataSheet,
  isDirectoryOnlySheet,
  buildDataSheetCards,
  buildRosterSheetCards,
} from './sheetTypes';

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
  /** Creates a staff directory + assignment block on initial setup */
  auto_assign?: boolean;
}

const TEMPLATES: Template[] = [
  {
    id: 'call_logs',
    name: 'Call Logs',
    description: 'Track all AI agent call activity',
    icon: <Phone className="w-4 h-4" />,
    tab_name: 'Call Logs',
    columns: [
      { header: 'Call ID', field: 'call_id', required: true, role: 'system', prefix: 'CL' },
      { header: 'Start Date', field: 'start_date', required: true, role: 'system' },
      { header: 'Start Time', field: 'start_time', required: false, role: 'system' },
      { header: 'End Date', field: 'end_date', required: true, role: 'system' },
      { header: 'End Time', field: 'end_time', required: false, role: 'system' },
      { header: 'Caller Name', field: 'caller_name', required: true, ask_as: "What is the caller's name?", role: 'caller' },
      { header: 'Phone', field: 'caller_phone', required: false, ask_as: 'What is their phone number?', role: 'caller' },
      { header: 'Assignee', field: 'assigned_to', required: false, role: 'internal' },
      { header: 'Duration', field: 'duration', required: false, role: 'system' },
      { header: 'Direction', field: 'direction', required: false, role: 'system' },
      { header: 'Status', field: 'status', required: false, role: 'tracking' },
      { header: 'Outcome', field: 'outcome', required: false, ask_as: 'What was the call outcome?', role: 'caller' },
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
      { header: 'Lead ID', field: 'lead_id', required: true, role: 'system', prefix: 'LD' },
      { header: 'Name', field: 'caller_name', required: true, ask_as: "What is the lead's name?", role: 'caller' },
      { header: 'Phone', field: 'caller_phone', required: true, ask_as: 'What is their phone number?', role: 'caller' },
      { header: 'Email', field: 'email', required: false, role: 'caller' },
      { header: 'Company', field: 'company', required: false, ask_as: 'What company are they from?', role: 'caller' },
      { header: 'Source', field: 'source', required: false, role: 'caller' },
      { header: 'Stage', field: 'stage', required: false, role: 'tracking' },
      { header: 'Assignee', field: 'assigned_to', required: false, role: 'internal' },
      { header: 'Status', field: 'status', required: false, role: 'tracking' },
      { header: 'Start Date', field: 'start_date', required: true, ask_as: 'When did we first engage with this lead?', role: 'system' },
      { header: 'End Date', field: 'end_date', required: true, ask_as: 'What is the expected close or follow-up date?', role: 'system' },
      { header: 'Remarks', field: 'remarks', required: false },
    ],
  },
  {
    id: 'support',
    name: 'Customer Support',
    description: 'Log support requests and resolutions',
    icon: <HeadphonesIcon className="w-4 h-4" />,
    tab_name: 'Support',
    auto_assign: true,
    columns: [
      { header: 'Complaint ID', field: 'complaint_id', required: true, role: 'system', prefix: 'CMP' },
      { header: 'Name', field: 'caller_name', required: true, ask_as: 'your full name', role: 'caller' },
      { header: 'Phone', field: 'caller_phone', required: true, ask_as: 'your mobile number', role: 'caller' },
      { header: 'Email', field: 'email', required: false, role: 'caller' },
      { header: 'Category', field: 'category', required: true, ask_as: 'type of issue', role: 'caller', auto_classify: true },
      { header: 'Description', field: 'description', required: true, ask_as: 'describe your issue', role: 'caller' },
      { header: 'Registered At', field: 'registered_at', required: false, role: 'system' },
      { header: 'Assigned To', field: 'assigned_to', required: false, role: 'internal' },
      { header: 'Assigned Email', field: 'assigned_email', required: false, role: 'internal' },
      { header: 'Status', field: 'status', required: false, role: 'tracking' },
      { header: 'Remarks', field: 'remarks', required: false },
    ],
  },
  {
    id: 'tickets',
    name: 'Help Desk Tickets',
    description: 'Manage support tickets end-to-end',
    icon: <TicketIcon className="w-4 h-4" />,
    tab_name: 'Tickets',
    auto_assign: true,
    columns: [
      { header: 'Ticket ID', field: 'ticket_id', required: true, role: 'system', prefix: 'TKT' },
      { header: 'Customer', field: 'caller_name', required: true, ask_as: 'your full name', role: 'caller' },
      { header: 'Phone', field: 'caller_phone', required: false, ask_as: 'your mobile number', role: 'caller' },
      { header: 'Email', field: 'email', required: false, role: 'caller' },
      { header: 'Category', field: 'category', required: true, ask_as: 'type of issue', role: 'caller', auto_classify: true },
      { header: 'Description', field: 'description', required: true, ask_as: 'describe the problem', role: 'caller' },
      { header: 'Registered At', field: 'registered_at', required: false, role: 'system' },
      { header: 'Assigned To', field: 'assigned_to', required: false, role: 'internal' },
      { header: 'Assigned Email', field: 'assigned_email', required: false, role: 'internal' },
      { header: 'Status', field: 'status', required: false, role: 'tracking' },
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
      { header: 'Product ID', field: 'product_id', required: true, role: 'system', prefix: 'PRD' },
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
      { header: 'Appointment ID', field: 'appointment_id', required: true, role: 'system', prefix: 'APT' },
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
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [existingIntegrationId, setExistingIntegrationId] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [assignError, setAssignError] = useState('');

  // ── Create modal ──
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [sheetTitle, setSheetTitle] = useState('');
  const [tabName, setTabName] = useState('');
  const [createAgentId, setCreateAgentId] = useState('');
  const [enableAutoAssign, setEnableAutoAssign] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [draftColumns, setDraftColumns] = useState<SheetColumn[]>([]);

  // ── Column manager modal ──
  const [columnsModalTarget, setColumnsModalTarget] = useState<SheetColumnsModalTarget | null>(null);

  // ── Delete integration modal ──
  const [deleteTarget, setDeleteTarget] = useState<{
    sheet: Sheet;
    integrationId: string;
    hasLinkedRoster: boolean;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [sheetsTab, setSheetsTab] = useState<'main' | 'roster'>('main');

  // ── Staff roster modal (per agent / data sheet) ──
  const [staffSheet, setStaffSheet] = useState<Sheet | null>(null);
  const [rosterSourceMode, setRosterSourceMode] = useState<'pick' | 'create'>('pick');
  const [discoveredSheets, setDiscoveredSheets] = useState<DiscoveredGoogleSheet[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [selectedRosterSheetId, setSelectedRosterSheetId] = useState('');
  const [staffRosterTitle, setStaffRosterTitle] = useState('');
  const [rosterColumnsDraft, setRosterColumnsDraft] = useState<SheetColumn[]>(cloneColumns(DEFAULT_DIRECTORY_COLUMNS));
  const [creatingStaffRoster, setCreatingStaffRoster] = useState(false);
  const [staffRosterError, setStaffRosterError] = useState('');
  const [staffRosterSuccess, setStaffRosterSuccess] = useState(false);
  const [linkedRosterForModal, setLinkedRosterForModal] = useState<{
    sheetId: string;
    sheetName: string;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      authAPI.fetchGoogleSheets(),
      authAPI.getIntegrations('google_sheets').catch(() => []),
      agentAPI.getAgents().catch(() => []),
      authAPI.getOAuthStatus().catch(() => []),
    ]).then(([sheetsData, integrationsData, agentsData, oauthStatus]) => {
      // Only show sheets that were created in our panel (have an agent integration)
      const connectedSheetIds = new Set(
        (integrationsData as any[]).flatMap((i: any) => {
          const gs = i.config?.google_sheets;
          const ids = [gs?.sheet_id ?? i.sheet_id, gs?.assignment?.directory_sheet_id].filter(Boolean);
          return ids;
        })
      );
      setSheets((sheetsData as Sheet[]).filter(s => connectedSheetIds.has(s.id)));
      setPageIntegrations(integrationsData);
      setPageAgents(agentsData);
      const googleCred = (oauthStatus as any[]).find((s: any) => s.provider?.includes('google'));
      setPageCredentialId(googleCred?.credential_id ?? '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const getSheetIntegration = (sheetId: string) =>
    pageIntegrations.find((i: any) =>
      i.config?.google_sheets?.sheet_id === sheetId || i.sheet_id === sheetId
    );

  const getSheetAssignment = (sheetId: string) => {
    const integration = getSheetIntegration(sheetId);
    if (!integration || isDirectoryOnlySheet(sheetId, pageIntegrations)) return null;
    const gs = integration.config?.google_sheets as GoogleSheetsIntegrationConfig | undefined;
    const agentId = integration.agent_id ?? integration.agentId ?? '';
    const agent = pageAgents.find(a => a.id === agentId);
    const linked = getLinkedDirectoryForDataSheet(sheetId, pageIntegrations, id => sheets.find(s => s.id === id)?.name);
    return {
      integrationId: integration._id ?? integration.id ?? '',
      agentId,
      agentName: agent?.name ?? '',
      directorySheetId: linked?.sheetId ?? getDirectorySheetId(gs),
      directorySheetName: linked?.sheetName ?? (getDirectorySheetId(gs) ? findDirectorySheetName(getDirectorySheetId(gs)) : ''),
      hasAutoAssign: hasAutoAssignment(gs) || Boolean(linked),
      dataSheetColumns: gs?.columns,
    };
  };

  const findDirectorySheetName = (directoryId: string) => {
    const sheet = sheets.find(s => s.id === directoryId);
    if (sheet) return sheet.name;
    const parent = pageIntegrations.find((i: any) => {
      const gs = i.config?.google_sheets as GoogleSheetsIntegrationConfig | undefined;
      return getDirectorySheetId(gs) === directoryId;
    });
    return parent?.config?.google_sheets?.assignment?.directory_sheet_name ?? 'Staff Directory';
  };

  const getStaffRosterForDataSheet = (dataSheetId: string) =>
    getLinkedDirectoryForDataSheet(dataSheetId, pageIntegrations, id => sheets.find(s => s.id === id)?.name);

  /** Primary data sheets only — roster sheets have their own tab. */
  const dataSheets = buildDataSheetCards(pageIntegrations, sheets);

  const rosterSheets = useMemo(
    () =>
      buildRosterSheetCards(pageIntegrations, sheets, agentId =>
        pageAgents.find(a => a.id === agentId)?.name,
      ),
    [pageIntegrations, sheets, pageAgents],
  );

  const previewRosterTitle = useMemo(
    () => defaultDirectorySheetTitle(sheetTitle.trim() || selectedTemplate?.name || 'New Sheet'),
    [sheetTitle, selectedTemplate],
  );

  const createBlockedAgentIds = useMemo(
    () => getLinkedGoogleSheetsAgentIds(pageIntegrations),
    [pageIntegrations],
  );

  const assignBlockedAgentIds = useMemo(
    () => getLinkedGoogleSheetsAgentIds(pageIntegrations, { excludeSheetId: assignSheet?.id }),
    [pageIntegrations, assignSheet?.id],
  );

  const updateRosterColumnHeader = (field: string, header: string) => {
    setRosterColumnsDraft(prev =>
      prev.map(col => (col.field === field ? { ...col, header } : col)),
    );
  };

  // ── Assign handlers ──
  const handleAssign = (sheet: Sheet) => {
    setAssignSheet(sheet);
    setAssignSuccess(false);
    setAssignError('');
    setCredentialId(pageCredentialId);
    const existing = getSheetAssignment(sheet.id);
    setSelectedAgentId(existing?.agentId ?? '');
    setExistingIntegrationId(existing?.integrationId ?? '');
  };

  const handleAssignSave = async () => {
    if (!assignSheet || !selectedAgentId) return;
    if (assignBlockedAgentIds.has(selectedAgentId)) {
      setAssignError('This AI employee is already linked to another sheet.');
      return;
    }
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
            timezone: DEFAULT_INTEGRATION_TIMEZONE,
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
  const openCreate = () => {
    setCreateOpen(true);
    setSelectedTemplate(null);
    setSheetTitle('');
    setTabName('');
    setCreateAgentId('');
    setEnableAutoAssign(false);
    setCreateError('');
    setDraftColumns([]);
    setRosterColumnsDraft(cloneColumns(DEFAULT_DIRECTORY_COLUMNS));
  };

  const handleSelectTemplate = (tpl: Template) => {
    setSelectedTemplate(tpl);
    if (!sheetTitle) setSheetTitle(tpl.name);
    setTabName(tpl.tab_name);
    setEnableAutoAssign(Boolean(tpl.auto_assign));
    setDraftColumns(applyAiFillDefaults(cloneColumns(tpl.columns)));
  };

  const openColumnsModal = (sheet: Sheet) => {
    const assignment = getSheetAssignment(sheet.id);
    const integration = getSheetIntegration(sheet.id);
    const gs = integration?.config?.google_sheets as GoogleSheetsIntegrationConfig | undefined;
    if (!assignment?.integrationId) return;
    setColumnsModalTarget({
      mode: 'integration',
      sheetId: sheet.id,
      sheetName: sheet.name,
      tabName: gs?.tab_name,
      integrationId: assignment.integrationId,
      credentialId: pageCredentialId || undefined,
      columns: gs?.columns ?? assignment.dataSheetColumns,
      config: gs,
      timezone: integration?.config?.timezone,
    });
  };

  const openCreateColumnsModal = () => {
    setColumnsModalTarget({
      mode: 'draft',
      sheetName: sheetTitle.trim() || selectedTemplate?.name || 'New sheet',
      tabName: tabName.trim() || selectedTemplate?.tab_name,
      columns: draftColumns,
    });
  };

  const handleDraftColumnsApply = (columns: SheetColumn[]) => {
    setDraftColumns(columns);
  };

  const handleColumnsSaved = (
    integrationId: string,
    _columns: SheetColumn[],
    fullConfig: ReturnType<typeof buildFullIntegrationConfig>,
  ) => {
    setPageIntegrations(prev =>
      prev.map((i: any) => {
        const id = i._id ?? i.id ?? '';
        if (id !== integrationId) return i;
        return { ...i, config: fullConfig };
      }),
    );
  };

  const openDeleteModal = (sheet: Sheet) => {
    const assignment = getSheetAssignment(sheet.id);
    if (!assignment?.integrationId || assignment.integrationId.startsWith('tmp-')) return;
    setDeleteError('');
    setDeleteTarget({
      sheet,
      integrationId: assignment.integrationId,
      hasLinkedRoster: Boolean(getStaffRosterForDataSheet(sheet.id)),
    });
  };

  const handleDeleteIntegration = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await authAPI.deleteIntegration(deleteTarget.integrationId);
      const deletedSheetId = deleteTarget.sheet.id;
      setPageIntegrations(prev =>
        prev.filter((i: any) => (i._id ?? i.id) !== deleteTarget.integrationId),
      );
      setSheets(prev => prev.filter(s => s.id !== deletedSheetId));
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setDeleteError(msg ?? 'Failed to delete integration. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCreate = async () => {
    if (!sheetTitle.trim() || !createAgentId) return;
    if (createBlockedAgentIds.has(createAgentId)) {
      setCreateError('This AI employee is already linked to another sheet.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const tab = tabName.trim() || selectedTemplate?.tab_name || 'Sheet1';
      const columns = normalizeColumnsForApi(draftColumns);
      const columnsPayload = columns.length > 0 ? columns : undefined;

      const result = await authAPI.createGoogleSheet({
        agent_id: createAgentId,
        title: sheetTitle.trim(),
        tab_name: tab,
        columns: columnsPayload,
        credential_id: pageCredentialId || undefined,
      });

      const integrationColumns = columnsPayload ?? result.columns;
      let assignmentConfig: ReturnType<typeof buildAssignmentConfig> | undefined;
      let directorySheet: Sheet | null = null;

      if (enableAutoAssign) {
        const rosterTitle = defaultDirectorySheetTitle(sheetTitle.trim());
        const dirResult = await authAPI.createStandaloneSheet({
          title: rosterTitle,
          tab_name: DEFAULT_DIRECTORY_TAB_NAME,
          columns: normalizeColumnsForApi(rosterColumnsDraft),
          credential_id: pageCredentialId || undefined,
        });
        directorySheet = { id: dirResult.sheet_id, name: dirResult.sheet_name };
        assignmentConfig = buildAssignmentConfig({
          directorySheetId: dirResult.sheet_id,
          directorySheetName: dirResult.sheet_name,
          directoryTabName: DEFAULT_DIRECTORY_TAB_NAME,
          dataSheetColumns: resolveDataSheetColumns(integrationColumns),
        });
      }

      const integration = await authAPI.createIntegration({
        agent_id: createAgentId,
        service_name: 'google_sheets',
        label: sheetTitle.trim(),
        credential_id: pageCredentialId || undefined,
        config: buildFullIntegrationConfig({
          sheetId: result.sheet_id,
          sheetName: result.sheet_name,
          tabName: tab,
          columns: integrationColumns,
          assignment: assignmentConfig,
        }),
      });

      const newSheet = { id: result.sheet_id, name: result.sheet_name };
      markGoogleSheetRecent(result.sheet_id);
      if (directorySheet) {
        markGoogleSheetRecent(directorySheet.id);
      }
      setSheets(prev => [
        newSheet,
        ...(directorySheet ? [directorySheet] : []),
        ...prev.filter(s => s.id !== newSheet.id && s.id !== directorySheet?.id),
      ]);
      setPageIntegrations(prev => [...prev, {
        _id: integration?._id ?? integration?.id ?? `tmp-${Date.now()}`,
        agent_id: createAgentId,
        label: sheetTitle.trim(),
        config: buildFullIntegrationConfig({
          sheetId: result.sheet_id,
          sheetName: result.sheet_name,
          tabName: tab,
          columns: integrationColumns,
          assignment: assignmentConfig,
        }),
      }]);
      if (directorySheet) {
        setSheetsTab('roster');
      }
      setCreateOpen(false);
      navigate(sheetViewPath(result.sheet_id, {
        name: result.sheet_name,
        new: true,
        gid: result.tab_gid ?? result.gid,
        tab: tab,
      }));
    } catch (err: any) {
      setCreateError(err?.response?.data?.message ?? 'Failed to create sheet. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const openStaffRosterModal = async (sheet: Sheet) => {
    const assignment = getSheetAssignment(sheet.id);
    if (!assignment?.agentId) return;
    const existing = getStaffRosterForDataSheet(sheet.id);
    setStaffSheet(sheet);
    setLinkedRosterForModal(existing);
    setRosterSourceMode('pick');
    setSelectedRosterSheetId('');
    setStaffRosterTitle(defaultDirectorySheetTitle(sheet.name));
    setRosterColumnsDraft(cloneColumns(DEFAULT_DIRECTORY_COLUMNS));
    setStaffRosterError('');
    setStaffRosterSuccess(false);
    setDiscoverLoading(true);
    setDiscoveredSheets([]);
    try {
      const data = await authAPI.discoverGoogleSheets({
        credentialId: pageCredentialId || undefined,
        ownedOnly: true,
      });
      setDiscoveredSheets(data.sheets.filter(s => s.sheet_id !== sheet.id));
    } catch {
      setStaffRosterError('Could not load sheets from Google Drive. You can still create a new roster.');
      setRosterSourceMode('create');
    } finally {
      setDiscoverLoading(false);
    }
  };

  const mergeAssignmentIntoIntegrations = (
    parentSheetId: string,
    assignment: GoogleSheetsIntegrationConfig['assignment'] | null | undefined,
  ) => {
    setPageIntegrations(prev =>
      prev.map((i: any) => {
        const sid = i.config?.google_sheets?.sheet_id ?? i.sheet_id;
        if (sid !== parentSheetId) return i;
        const gs = { ...(i.config?.google_sheets ?? {}) };
        if (assignment === null) {
          delete gs.assignment;
        } else if (assignment) {
          gs.assignment = assignment;
        }
        return {
          ...i,
          config: {
            ...i.config,
            google_sheets: gs,
          },
        };
      }),
    );
  };

  const linkDirectoryToParent = async (
    parentSheet: Sheet,
    directorySheetId: string,
    directorySheetName: string,
    directoryTabName: string,
    options?: { gid?: number | string; openSheet?: boolean; isRosterUpdate?: boolean },
  ) => {
    const sheetAssignment = getSheetAssignment(parentSheet.id);
    if (!sheetAssignment?.agentId) return;

    const parentIntegration = getSheetIntegration(parentSheet.id);
    const parentGs = parentIntegration?.config?.google_sheets as GoogleSheetsIntegrationConfig | undefined;
    const dataColumns = resolveDataSheetColumns(sheetAssignment.dataSheetColumns ?? parentGs?.columns);
    const assignmentConfig = buildAssignmentConfig({
      directorySheetId,
      directorySheetName,
      directoryTabName,
      dataSheetColumns: dataColumns,
    });

    const fullConfig = buildFullIntegrationConfig({
      sheetId: parentSheet.id,
      sheetName: parentGs?.sheet_name ?? parentSheet.name,
      tabName: parentGs?.tab_name,
      columns: dataColumns,
      assignment: assignmentConfig,
      timezone: parentIntegration?.config?.timezone,
    });

    const shouldPatch =
      options?.isRosterUpdate &&
      sheetAssignment.integrationId &&
      !sheetAssignment.integrationId.startsWith('tmp-');

    if (shouldPatch) {
      await authAPI.patchIntegration(sheetAssignment.integrationId, {
        config: {
          google_sheets: {
            assignment: assignmentConfig,
          },
        },
      });
    } else {
      const integration = await authAPI.createIntegration({
        agent_id: sheetAssignment.agentId,
        service_name: 'google_sheets',
        label: parentGs?.sheet_name ?? parentSheet.name,
        credential_id: pageCredentialId || undefined,
        config: fullConfig,
      });
      const integrationId = integration?._id ?? integration?.id;
      if (integrationId) {
        setPageIntegrations(prev => {
          const withoutParent = prev.filter((i: any) => {
            const sid = i.config?.google_sheets?.sheet_id ?? i.sheet_id;
            return sid !== parentSheet.id;
          });
          return [
            ...withoutParent,
            {
              _id: integrationId,
              agent_id: sheetAssignment.agentId,
              label: parentGs?.sheet_name ?? parentSheet.name,
              config: fullConfig,
            },
          ];
        });
      }
    }

    mergeAssignmentIntoIntegrations(parentSheet.id, assignmentConfig);

    setSheets(prev => {
      const exists = prev.some(s => s.id === directorySheetId);
      if (exists) return prev;
      return [...prev, { id: directorySheetId, name: directorySheetName }];
    });
    if (options?.openSheet) {
      markGoogleSheetRecent(directorySheetId);
    }
    setStaffRosterSuccess(true);
    setLinkedRosterForModal({ sheetId: directorySheetId, sheetName: directorySheetName });
    setSheetsTab('roster');
    setTimeout(() => {
      setStaffSheet(null);
      setStaffRosterSuccess(false);
      setLinkedRosterForModal(null);
      if (options?.openSheet) {
        navigate(sheetViewPath(directorySheetId, {
          name: directorySheetName,
          new: true,
          role: 'directory',
          tab: directoryTabName,
          gid: options.gid,
        }));
      }
    }, 1200);
  };

  const handleUnlinkStaffRoster = async () => {
    const parentSheet = staffSheet;
    if (!parentSheet || !linkedRosterForModal) return;

    const sheetAssignment = getSheetAssignment(parentSheet.id);
    if (!sheetAssignment?.integrationId || sheetAssignment.integrationId.startsWith('tmp-')) return;

    setCreatingStaffRoster(true);
    setStaffRosterError('');
    try {
      await authAPI.patchIntegration(sheetAssignment.integrationId, {
        config: {
          google_sheets: {
            assignment: null,
          },
        },
      });
      mergeAssignmentIntoIntegrations(parentSheet.id, null);
      setStaffRosterSuccess(true);
      setTimeout(() => {
        setStaffSheet(null);
        setStaffRosterSuccess(false);
        setLinkedRosterForModal(null);
      }, 900);
    } catch (err: any) {
      setStaffRosterError(err?.response?.data?.message ?? 'Failed to unlink staff roster.');
    } finally {
      setCreatingStaffRoster(false);
    }
  };

  const handleLinkStaffRoster = async () => {
    const parentSheet = staffSheet;
    if (!parentSheet) return;

    const isRosterUpdate = Boolean(getStaffRosterForDataSheet(parentSheet.id));

    setCreatingStaffRoster(true);
    setStaffRosterError('');
    try {
      const directoryTabName = DEFAULT_DIRECTORY_TAB_NAME;

      if (rosterSourceMode === 'pick') {
        const picked = discoveredSheets.find(s => s.sheet_id === selectedRosterSheetId);
        if (!picked) {
          setStaffRosterError('Please select a roster sheet from your Drive.');
          return;
        }
        await linkDirectoryToParent(
          parentSheet,
          picked.sheet_id,
          picked.sheet_name,
          directoryTabName,
          { isRosterUpdate },
        );
      } else {
        if (!staffRosterTitle.trim()) {
          setStaffRosterError('Please enter a name for the new roster sheet.');
          return;
        }
        const result = await authAPI.createStandaloneSheet({
          title: staffRosterTitle.trim(),
          tab_name: directoryTabName,
          columns: normalizeColumnsForApi(rosterColumnsDraft),
          credential_id: pageCredentialId || undefined,
        });
        await linkDirectoryToParent(
          parentSheet,
          result.sheet_id,
          result.sheet_name,
          directoryTabName,
          { gid: result.tab_gid ?? result.gid, openSheet: true, isRosterUpdate },
        );
      }
    } catch (err: any) {
      setStaffRosterError(err?.response?.data?.message ?? 'Failed to link staff roster. Please try again.');
    } finally {
      setCreatingStaffRoster(false);
    }
  };

  const rosterSheetOptions = useMemo(() => {
    return rosterSheetsForPicker(discoveredSheets, linkedRosterForModal?.sheetId).map(s => ({
      value: s.sheet_id,
      label: s.sheet_name,
    }));
  }, [discoveredSheets, linkedRosterForModal?.sheetId]);

  const selectedDiscoveredSheet = useMemo(
    () => discoveredSheets.find(s => s.sheet_id === selectedRosterSheetId),
    [discoveredSheets, selectedRosterSheetId],
  );

  const pendingRosterName =
    rosterSourceMode === 'create'
      ? staffRosterTitle.trim() || null
      : selectedDiscoveredSheet?.sheet_name ?? null;

  const rosterSelectionChanged =
    rosterSourceMode === 'create'
      ? Boolean(staffRosterTitle.trim())
      : Boolean(selectedRosterSheetId) &&
        selectedRosterSheetId !== linkedRosterForModal?.sheetId;

  const canLinkRoster = rosterSelectionChanged;

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
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 p-1 gap-1 mb-4">
            <button
              type="button"
              onClick={() => setSheetsTab('main')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                sheetsTab === 'main'
                  ? 'common-button-bg'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Main Sheets
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                sheetsTab === 'main' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'
              }`}>
                {dataSheets.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSheetsTab('roster')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                sheetsTab === 'roster'
                  ? 'common-button-bg'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <UserCog className="w-3.5 h-3.5" />
              Roster Sheets
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                sheetsTab === 'roster' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'
              }`}>
                {rosterSheets.length}
              </span>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="text-sm text-slate-500 dark:text-slate-400">Loading your spreadsheets…</span>
            </div>
          ) : sheetsTab === 'main' ? (
            dataSheets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <FileSpreadsheet className="w-7 h-7 text-green-500" />
              </div>
              <div className="text-center">
                <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">No main sheets found</p>
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
              {dataSheets.map(sheet => {
                const assignment = getSheetAssignment(sheet.id);
                const staffRoster = getStaffRosterForDataSheet(sheet.id);
                return (
                <div
                  key={sheet.id}
                  className="common-bg-icons rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                        <SheetIcon />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Main sheet</p>
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

                    {staffRoster ? (
                      <button
                        type="button"
                        onClick={() => setSheetsTab('roster')}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors text-left"
                      >
                        <UserCog className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          Roster: <span className="font-medium">{staffRoster.sheetName}</span>
                        </span>
                      </button>
                    ) : assignment?.agentId ? (
                      <button
                        onClick={() => openStaffRosterModal(sheet)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-dashed border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                      >
                        <UserCog className="w-3.5 h-3.5" />
                        Add staff roster
                      </button>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
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
                        onClick={() => openColumnsModal(sheet)}
                        disabled={!assignment?.integrationId}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium common-button-bg2 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Columns3 className="w-3.5 h-3.5" />
                        Manage cols
                      </button>
                      <button
                        onClick={() => handleAssign(sheet)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium common-button-bg transition-all active:scale-[0.98]"
                      >
                        <Users className="w-3.5 h-3.5 flex-shrink-0" />
                        {assignment ? 'Update Agent' : 'Assign AI'}
                      </button>
                      <button
                        onClick={() => openDeleteModal(sheet)}
                        disabled={!assignment?.integrationId}
                        title="Delete integration"
                        className="flex items-center justify-center p-2 rounded-lg text-xs font-medium border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )
          ) : rosterSheets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                <UserCog className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">No roster sheets linked</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                  Link a staff directory from a main sheet to enable auto-assignment
                </p>
              </div>
              {dataSheets.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSheetsTab('main')}
                  className="common-button-bg2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Go to Main Sheets
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rosterSheets.map(roster => (
                <div
                  key={roster.id}
                  className="common-bg-icons rounded-xl border border-emerald-200/80 dark:border-emerald-800/50 overflow-hidden hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                >
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center flex-shrink-0">
                        <UserCog className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Roster sheet</p>
                        <p className="font-semibold text-slate-800 dark:text-white text-sm leading-snug line-clamp-2">{roster.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{DEFAULT_DIRECTORY_TAB_NAME} tab · auto-assign</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/google-sheets/${roster.parentDataSheetId}/view?name=${encodeURIComponent(roster.parentDataSheetName)}`,
                        )
                      }
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <SheetIcon />
                      <span className="truncate">
                        Main sheet: <span className="font-medium">{roster.parentDataSheetName}</span>
                      </span>
                    </button>

                    {roster.agentName && (
                      <div className="flex items-center gap-1 px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{roster.agentName}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <button
                        onClick={() =>
                          navigate(
                            sheetViewPath(roster.id, {
                              name: roster.name,
                              role: 'directory',
                              tab: DEFAULT_DIRECTORY_TAB_NAME,
                            }),
                          )
                        }
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium common-button-bg2 flex-shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View
                      </button>
                      <button
                        onClick={() => roster.agentId && navigate(`/agents/${roster.agentId}`)}
                        disabled={!roster.agentId}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium common-button-bg2 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Test AI
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>

      {/* ── Create Sheet modal ── */}
      <ModalOverlay open={createOpen} onClose={() => setCreateOpen(false)} panelClassName="max-w-3xl">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full border border-slate-200 dark:border-slate-700">

            {/* Header */}
            <div className="flex items-center justify-between px-6 lg:px-8 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  <SheetIcon />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-800 dark:text-white">Create New Sheet</h2>
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

            <div className="p-6 lg:p-8 space-y-5">

              {/* Template + columns */}
              <div className="grid grid-cols-1 md:grid-cols-[11rem_1fr] gap-2 md:gap-5 md:items-start">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 md:pt-2.5 md:text-right shrink-0">
                  Choose a Template
                  <span className="block text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="min-w-0 space-y-2.5">
                  <div className="relative">
                    <select
                      value={selectedTemplate?.id ?? ''}
                      onChange={e => {
                        const tpl = TEMPLATES.find(t => t.id === e.target.value) ?? null;
                        if (tpl) handleSelectTemplate(tpl);
                        else {
                          setSelectedTemplate(null);
                          setDraftColumns([]);
                        }
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

                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                        Columns
                      </p>
                      {draftColumns.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {draftColumns.slice(0, 8).map(col => (
                            <span
                              key={col.field}
                              className={`text-[10px] px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-600 ${roleBadgeClass(col.role)}`}
                            >
                              {col.header}
                            </span>
                          ))}
                          {draftColumns.length > 8 && (
                            <span className="text-[10px] px-1.5 py-0.5 text-slate-400">
                              +{draftColumns.length - 8} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400">Pick a template or manage columns</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={openCreateColumnsModal}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium common-button-bg2 flex-shrink-0"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      Manage
                    </button>
                  </div>
                </div>
              </div>

              {/* Sheet title + tab — side by side on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-[11rem_1fr] gap-2 md:gap-5 md:items-start">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 md:pt-2.5 md:text-right shrink-0">
                  Sheet details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
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
                </div>
              </div>

              {/* Roster sheet (optional) */}
              <div className="grid grid-cols-1 md:grid-cols-[11rem_1fr] gap-2 md:gap-5 md:items-start">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 md:pt-3 md:text-right shrink-0">
                  Roster
                  <span className="block text-slate-400 font-normal">(optional)</span>
                </span>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden min-w-0">
                <label className="flex items-start gap-3 p-3.5 cursor-pointer common-bg-icons">
                  <input
                    type="checkbox"
                    checked={enableAutoAssign}
                    onChange={e => setEnableAutoAssign(e.target.checked)}
                    className="mt-1 rounded border-slate-300 dark:border-slate-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <UserCog className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-slate-800 dark:text-white">
                        Create roster sheet
                      </span>
                      {selectedTemplate?.auto_assign && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Auto-assignment engine — matches records to staff by category and availability, then fills Assigned To and email on each row.
                    </p>
                  </div>
                </label>
                {enableAutoAssign && (
                  <div className="px-3.5 pb-3.5 pt-0 border-t border-slate-100 dark:border-slate-800/80">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3">
                      Roster sheet:{' '}
                      <span className="font-medium text-slate-700 dark:text-slate-300">{previewRosterTitle}</span>
                      {' · '}tab{' '}
                      <span className="font-medium text-slate-700 dark:text-slate-300">{DEFAULT_DIRECTORY_TAB_NAME}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2 mb-1.5">Edit roster column names</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {rosterColumnsDraft.map(col => (
                        <label key={col.field} className="text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="uppercase tracking-wide">{col.field.replace(/_/g, ' ')}</span>
                          <input
                            type="text"
                            value={col.header}
                            onChange={e => updateRosterColumnHeader(col.field, e.target.value)}
                            className="mt-1 w-full px-2 py-1.5 rounded-lg text-xs common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-700 dark:text-slate-200"
                          />
                        </label>
                      ))}
                    </div>
                    {selectedTemplate?.auto_assign ? (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-2">
                        Category-based matching is pre-configured for this template.
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-2">
                        Add Category and Assigned To columns on the main sheet for best auto-assignment results.
                      </p>
                    )}
                  </div>
                )}
                </div>
              </div>

              <AgentPickerField
                value={createAgentId}
                onChange={setCreateAgentId}
                blockedAgentIds={createBlockedAgentIds}
                required
                active={createOpen}
                layout="horizontal"
              />

              {/* Error */}
              {createError && (
                <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 md:ml-[calc(11rem+1.25rem)]">
                  {createError}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-1 sm:justify-end md:pl-[calc(11rem+1.25rem)]">
                <button
                  onClick={() => setCreateOpen(false)}
                  className="sm:min-w-[7.5rem] py-2.5 rounded-xl text-sm font-medium common-bg-icons border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!sheetTitle.trim() || !createAgentId || creating}
                  className="sm:min-w-[11rem] py-2.5 rounded-xl text-sm font-medium common-button-bg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                  ) : enableAutoAssign ? (
                    <><Plus className="w-4 h-4" /> Create Sheet + Roster</>
                  ) : (
                    <><Plus className="w-4 h-4" /> Create Sheet</>
                  )}
                </button>
              </div>
            </div>
          </div>
      </ModalOverlay>

      {/* ── Assign modal ── */}
      {assignSheet && (
      <ModalOverlay
        open
        onClose={() => setAssignSheet(null)}
        panelClassName="max-w-sm"
      >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full p-6 space-y-5 border border-slate-200 dark:border-slate-700">
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
            <AgentPickerField
              value={selectedAgentId}
              onChange={setSelectedAgentId}
              blockedAgentIds={assignBlockedAgentIds}
              label="Select AI Employee"
              required
              active={Boolean(assignSheet)}
            />
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
      </ModalOverlay>
      )}

      {/* ── Staff Roster modal ── */}
      {staffSheet && (
      <ModalOverlay
        open
        onClose={() => setStaffSheet(null)}
        panelClassName="max-w-lg"
      >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                  <UserCog className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
                    {linkedRosterForModal ? 'Manage staff roster' : 'Staff & Officers Roster'}
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[240px]">For: {staffSheet.name}</p>
                </div>
              </div>
              <button
                onClick={() => setStaffSheet(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Selected / pending roster */}
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-700/80">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Selected roster
                  </p>
                </div>
                <div className="p-3">
                  {linkedRosterForModal ? (
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 flex items-center justify-center flex-shrink-0">
                        <UserCog className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate" title={linkedRosterForModal.sheetName}>
                          {linkedRosterForModal.sheetName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Current · {DEFAULT_DIRECTORY_TAB_NAME} tab
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            sheetViewPath(linkedRosterForModal.sheetId, {
                              name: linkedRosterForModal.sheetName,
                              role: 'directory',
                              tab: DEFAULT_DIRECTORY_TAB_NAME,
                            }),
                          )
                        }
                        className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline flex-shrink-0"
                      >
                        View
                      </button>
                    </div>
                  ) : pendingRosterName && rosterSourceMode === 'pick' ? (
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/50 flex items-center justify-center flex-shrink-0">
                        <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate" title={pendingRosterName}>
                          {pendingRosterName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Selected · not linked yet
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">No roster linked yet — pick or create one below.</p>
                  )}

                  {rosterSelectionChanged &&
                    pendingRosterName &&
                    linkedRosterForModal &&
                    rosterSourceMode === 'pick' && (
                    <div className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1.5">
                        Will switch to
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/50 flex items-center justify-center flex-shrink-0">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate" title={pendingRosterName}>
                          {pendingRosterName}
                        </p>
                      </div>
                    </div>
                  )}

                  {rosterSelectionChanged && pendingRosterName && rosterSourceMode === 'create' && (
                    <div className={linkedRosterForModal ? 'mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700' : ''}>
                      {!linkedRosterForModal && (
                        <p className="text-[10px] font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1.5">
                          New roster
                        </p>
                      )}
                      {linkedRosterForModal && (
                        <p className="text-[10px] font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1.5">
                          Will create
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/50 flex items-center justify-center flex-shrink-0">
                          <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate" title={pendingRosterName}>
                          {pendingRosterName}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Choose a different sheet from Drive or create a new roster, then click{' '}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {linkedRosterForModal ? 'Update roster' : 'Link roster'}
                </span>
                .
              </p>

              {/* Source mode toggle */}
              <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setRosterSourceMode('pick')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                    rosterSourceMode === 'pick'
                      ? 'common-button-bg'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Link existing
                </button>
                <button
                  type="button"
                  onClick={() => setRosterSourceMode('create')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                    rosterSourceMode === 'create'
                      ? 'common-button-bg'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Create new
                </button>
              </div>

              {rosterSourceMode === 'pick' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Choose roster sheet from Drive
                  </label>
                  {discoverLoading ? (
                    <div className="flex items-center gap-2 py-3 text-xs text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading your Google Sheets…
                    </div>
                  ) : (
                    <SearchableSelect
                      options={rosterSheetOptions}
                      value={selectedRosterSheetId}
                      onChange={setSelectedRosterSheetId}
                      placeholder={linkedRosterForModal ? 'Search for a different sheet…' : 'Search or select a sheet…'}
                      disabled={creatingStaffRoster}
                    />
                  )}
                  {!discoverLoading && rosterSheetOptions.length === 0 && (
                    <p className="mt-2 text-xs text-slate-400">No sheets found in Drive. Switch to Create new.</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    New roster sheet name
                  </label>
                  <input
                    type="text"
                    value={staffRosterTitle}
                    onChange={e => setStaffRosterTitle(e.target.value)}
                    placeholder="e.g. Help Desk Tickets — Staff"
                    className="w-full px-3 py-2.5 rounded-xl text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/40 text-slate-800 dark:text-white"
                  />
                  {staffRosterTitle.trim() && (
                    <p className="mt-2 text-[11px] text-blue-600 dark:text-blue-400">
                      A new roster sheet will be created and linked on update.
                    </p>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Roster columns (editable)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {rosterColumnsDraft.map(col => (
                    <label key={col.field} className="text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="uppercase tracking-wide">{col.field.replace(/_/g, ' ')}</span>
                      <input
                        type="text"
                        value={col.header}
                        onChange={e => updateRosterColumnHeader(col.field, e.target.value)}
                        className="mt-1 w-full px-2 py-1.5 rounded-lg text-xs common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-700 dark:text-slate-200"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {staffRosterError && (
                <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                  {staffRosterError}
                </p>
              )}

              <div className="flex flex-col gap-2.5">
                <div className="flex gap-2.5">
                  <button
                    onClick={() => {
                      setStaffSheet(null);
                      setLinkedRosterForModal(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium common-bg-icons border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLinkStaffRoster}
                    disabled={!canLinkRoster || creatingStaffRoster || staffRosterSuccess || discoverLoading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium common-button-bg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {creatingStaffRoster ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    ) : staffRosterSuccess ? (
                      <><Check className="w-4 h-4" /> Saved!</>
                    ) : (
                      <><UserCog className="w-4 h-4" /> {linkedRosterForModal ? 'Update roster' : 'Link roster'}</>
                    )}
                  </button>
                </div>
                {linkedRosterForModal && (
                  <button
                    type="button"
                    onClick={handleUnlinkStaffRoster}
                    disabled={creatingStaffRoster || staffRosterSuccess}
                    className="w-full py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-50 transition-colors"
                  >
                    Unlink roster (remove auto-assignment)
                  </button>
                )}
              </div>
            </div>
          </div>
      </ModalOverlay>
      )}
      <SheetColumnsModal
        target={columnsModalTarget}
        onClose={() => setColumnsModalTarget(null)}
        onSaved={handleColumnsSaved}
        onDraftApply={handleDraftColumnsApply}
      />
      <DeleteIntegrationModal
        open={Boolean(deleteTarget)}
        sheetName={deleteTarget?.sheet.name ?? ''}
        integrationId={deleteTarget?.integrationId}
        hasLinkedRoster={deleteTarget?.hasLinkedRoster}
        deleting={deleting}
        error={deleteError}
        onClose={() => {
          if (!deleting) {
            setDeleteTarget(null);
            setDeleteError('');
          }
        }}
        onConfirm={handleDeleteIntegration}
      />
    </div>
  );
};

export default GoogleSheetsManager;
