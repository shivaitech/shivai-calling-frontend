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
  UserCog,
  AlertTriangle,
} from 'lucide-react';
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
  getLinkedDirectoryForDataSheet,
  isDirectoryOnlySheet,
  buildDataSheetCards,
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
      { header: 'Ticket ID', field: 'ticket_id', required: false, role: 'system', prefix: 'TKT' },
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
  const [enableAutoAssign, setEnableAutoAssign] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // ── Staff roster modal (per agent / data sheet) ──
  const [staffSheet, setStaffSheet] = useState<Sheet | null>(null);
  const [rosterSourceMode, setRosterSourceMode] = useState<'pick' | 'create'>('pick');
  const [discoveredSheets, setDiscoveredSheets] = useState<DiscoveredGoogleSheet[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [selectedRosterSheetId, setSelectedRosterSheetId] = useState('');
  const [staffRosterTitle, setStaffRosterTitle] = useState('');
  const [creatingStaffRoster, setCreatingStaffRoster] = useState(false);
  const [staffRosterError, setStaffRosterError] = useState('');
  const [staffRosterSuccess, setStaffRosterSuccess] = useState(false);

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

  /** Primary data sheets only — linked roster sheets nest inside their parent card. */
  const dataSheets = buildDataSheetCards(pageIntegrations, sheets);

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
  const openCreate = async () => {
    setCreateOpen(true);
    setSelectedTemplate(null);
    setSheetTitle('');
    setTabName('');
    setCreateAgentId('');
    setEnableAutoAssign(true);
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
    setEnableAutoAssign(Boolean(tpl.auto_assign));
  };

  const handleCreate = async () => {
    if (!sheetTitle.trim() || !createAgentId) return;
    setCreating(true);
    setCreateError('');
    try {
      const columns = selectedTemplate?.columns;
      const tab = tabName.trim() || selectedTemplate?.tab_name || 'Sheet1';

      const result = await authAPI.createGoogleSheet({
        agent_id: createAgentId,
        title: sheetTitle.trim(),
        tab_name: tab,
        columns,
        credential_id: pageCredentialId || undefined,
      });

      const integrationColumns = columns ?? result.columns;
      let assignmentConfig: ReturnType<typeof buildAssignmentConfig> | undefined;
      let directorySheet: Sheet | null = null;

      if (selectedTemplate?.auto_assign && enableAutoAssign && integrationColumns?.length) {
        const dirResult = await authAPI.createStandaloneSheet({
          title: `${sheetTitle.trim()} — Staff`,
          tab_name: DEFAULT_DIRECTORY_TAB_NAME,
          columns: DEFAULT_DIRECTORY_COLUMNS,
          credential_id: pageCredentialId || undefined,
        });
        directorySheet = { id: dirResult.sheet_id, name: dirResult.sheet_name };
        assignmentConfig = buildAssignmentConfig({
          directorySheetId: dirResult.sheet_id,
          directorySheetName: dirResult.sheet_name,
          directoryTabName: DEFAULT_DIRECTORY_TAB_NAME,
          dataSheetColumns: integrationColumns,
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
    if (existing) {
      navigate(sheetViewPath(existing.sheetId, {
        name: existing.sheetName,
        role: 'directory',
        tab: DEFAULT_DIRECTORY_TAB_NAME,
        new: isGoogleSheetRecent(existing.sheetId),
      }));
      return;
    }
    setStaffSheet(sheet);
    setRosterSourceMode('pick');
    setSelectedRosterSheetId('');
    setStaffRosterTitle(defaultDirectorySheetTitle(sheet.name));
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

  const linkDirectoryToParent = async (
    parentSheet: Sheet,
    directorySheetId: string,
    directorySheetName: string,
    directoryTabName: string,
    options?: { gid?: number | string; openSheet?: boolean },
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

    if (sheetAssignment.integrationId && !sheetAssignment.integrationId.startsWith('tmp-')) {
      await authAPI.updateIntegration(sheetAssignment.integrationId, { config: fullConfig });
    } else {
      await authAPI.createIntegration({
        agent_id: sheetAssignment.agentId,
        service_name: 'google_sheets',
        label: parentGs?.sheet_name ?? parentSheet.name,
        credential_id: pageCredentialId || undefined,
        config: fullConfig,
      });
    }

    setPageIntegrations(prev => {
      const withoutParent = prev.filter((i: any) => {
        const sid = i.config?.google_sheets?.sheet_id ?? i.sheet_id;
        return sid !== parentSheet.id;
      });
      return [
        ...withoutParent,
        {
          _id: sheetAssignment.integrationId.startsWith('tmp-')
            ? `tmp-${Date.now()}`
            : sheetAssignment.integrationId,
          agent_id: sheetAssignment.agentId,
          label: parentGs?.sheet_name ?? parentSheet.name,
          config: fullConfig,
        },
      ];
    });

    setSheets(prev => {
      const exists = prev.some(s => s.id === directorySheetId);
      if (exists) return prev;
      return [...prev, { id: directorySheetId, name: directorySheetName }];
    });
    if (options?.openSheet) {
      markGoogleSheetRecent(directorySheetId);
    }
    setStaffRosterSuccess(true);
    setTimeout(() => {
      setStaffSheet(null);
      setStaffRosterSuccess(false);
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

  const handleLinkStaffRoster = async () => {
    const parentSheet = staffSheet;
    if (!parentSheet) return;

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
        );
      } else {
        if (!staffRosterTitle.trim()) {
          setStaffRosterError('Please enter a name for the new roster sheet.');
          return;
        }
        const result = await authAPI.createStandaloneSheet({
          title: staffRosterTitle.trim(),
          tab_name: directoryTabName,
          columns: DEFAULT_DIRECTORY_COLUMNS,
          credential_id: pageCredentialId || undefined,
        });
        await linkDirectoryToParent(
          parentSheet,
          result.sheet_id,
          result.sheet_name,
          directoryTabName,
          { gid: result.tab_gid ?? result.gid, openSheet: true },
        );
      }
    } catch (err: any) {
      setStaffRosterError(err?.response?.data?.message ?? 'Failed to link staff roster. Please try again.');
    } finally {
      setCreatingStaffRoster(false);
    }
  };

  const selectedDiscoveredSheet = discoveredSheets.find(s => s.sheet_id === selectedRosterSheetId);
  const canLinkRoster = rosterSourceMode === 'pick'
    ? Boolean(selectedRosterSheetId)
    : Boolean(staffRosterTitle.trim());

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
          ) : dataSheets.length === 0 ? (
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
              {dataSheets.map(sheet => {
                const assignment = getSheetAssignment(sheet.id);
                const staffRoster = getStaffRosterForDataSheet(sheet.id);
                return (
                <div
                  key={sheet.id}
                  className="common-bg-icons rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  {/* Main data sheet */}
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                        <SheetIcon />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Data sheet</p>
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

                    {/* Linked roster — nested inside same card */}
                    {staffRoster ? (
                      <div className="rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-900/10 p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center flex-shrink-0">
                            <UserCog className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Linked roster</p>
                            <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{staffRoster.sheetName}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{DEFAULT_DIRECTORY_TAB_NAME} tab · auto-assign</p>
                          </div>
                          <button
                            onClick={() => navigate(sheetViewPath(staffRoster.sheetId, {
                              name: staffRoster.sheetName,
                              role: 'directory',
                              tab: DEFAULT_DIRECTORY_TAB_NAME,
                            }))}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium common-button-bg2 flex-shrink-0"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View
                          </button>
                        </div>
                      </div>
                    ) : assignment?.agentId ? (
                      <button
                        onClick={() => openStaffRosterModal(sheet)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-dashed border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                      >
                        <UserCog className="w-3.5 h-3.5" />
                        Add linked staff roster
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
                      {staffRoster && (
                        <button
                          onClick={() => openStaffRosterModal(sheet)}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium common-button-bg2 flex-shrink-0"
                        >
                          <UserCog className="w-3.5 h-3.5" />
                          Manage roster
                        </button>
                      )}
                      <button
                        onClick={() => handleAssign(sheet)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium common-button-bg transition-all active:scale-[0.98] ml-auto"
                      >
                        <Users className="w-3.5 h-3.5 flex-shrink-0" />
                        {assignment ? 'Update Agent' : 'Assign AI'}
                      </button>
                    </div>
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
                    {selectedTemplate.auto_assign && (
                      <label className="flex items-start gap-2.5 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableAutoAssign}
                          onChange={e => setEnableAutoAssign(e.target.checked)}
                          className="mt-0.5 rounded border-slate-300 dark:border-slate-600"
                        />
                        <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          Create staff directory &amp; enable auto-assignment (matches category → department, assigns officer by availability)
                        </span>
                      </label>
                    )}
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

      {/* ── Staff Roster modal ── */}
      {staffSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 my-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                  <UserCog className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Staff & Officers Roster</h2>
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
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Link a staff directory to <span className="font-medium text-slate-700 dark:text-slate-300">{staffSheet.name}</span> for auto-assignment. Pick an existing sheet from Drive or create a new roster — the directory is nested under this data sheet&apos;s integration config.
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
                  Link existing sheet
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
                  Create new roster
                </button>
              </div>

              {rosterSourceMode === 'pick' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Select roster sheet from Drive
                  </label>
                  {discoverLoading ? (
                    <div className="flex items-center gap-2 py-3 text-xs text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading your Google Sheets…
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedRosterSheetId}
                        onChange={e => setSelectedRosterSheetId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/40 text-slate-800 dark:text-white appearance-none pr-8"
                      >
                        <option value="">Choose a sheet…</option>
                        {discoveredSheets.map(s => (
                          <option key={s.sheet_id} value={s.sheet_id}>
                            {s.sheet_name}{s.is_connected ? ' ⚠ already linked' : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  )}
                  {selectedDiscoveredSheet?.is_connected && (
                    <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                        This sheet is already linked to another agent
                        {selectedDiscoveredSheet.connections?.[0]?.agent_name
                          ? ` (${selectedDiscoveredSheet.connections[0].agent_name})`
                          : ''}.
                        Using it here may affect that connection.
                      </p>
                    </div>
                  )}
                  {!discoverLoading && discoveredSheets.length === 0 && (
                    <p className="mt-2 text-xs text-slate-400">No other sheets found in Drive. Switch to &quot;Create new roster&quot;.</p>
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
                </div>
              )}

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Suggested roster columns</p>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_DIRECTORY_COLUMNS.map(col => (
                    <span
                      key={col.field}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                    >
                      {col.header}
                    </span>
                  ))}
                </div>
              </div>

              {staffRosterError && (
                <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                  {staffRosterError}
                </p>
              )}

              <div className="flex gap-2.5">
                <button
                  onClick={() => setStaffSheet(null)}
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
                    <><Loader2 className="w-4 h-4 animate-spin" /> Linking…</>
                  ) : staffRosterSuccess ? (
                    <><Check className="w-4 h-4" /> Linked!</>
                  ) : (
                    <><UserCog className="w-4 h-4" /> Link Roster</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleSheetsManager;
