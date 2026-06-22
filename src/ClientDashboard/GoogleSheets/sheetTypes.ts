import { SheetColumn } from '../../services/authAPI';

export type SheetColumnRole = 'caller' | 'system' | 'internal' | 'tracking';

export interface GoogleSheetsAssignmentMatch {
  record_field: string;
  directory_column: string;
}

export interface GoogleSheetsAssignmentOutput {
  directory_column: string;
  record_column: string;
}

export interface GoogleSheetsAssignmentAvailability {
  from_column: string;
  to_column: string;
  days_column: string;
}

export interface GoogleSheetsAssignmentConfig {
  enabled: boolean;
  directory_sheet_id: string;
  directory_sheet_name?: string;
  directory_tab_name: string;
  match: GoogleSheetsAssignmentMatch[];
  output: GoogleSheetsAssignmentOutput[];
  availability?: GoogleSheetsAssignmentAvailability;
  fallback?: Record<string, string>;
}

export interface GoogleSheetsIntegrationConfig {
  sheet_id: string;
  sheet_name: string;
  tab_name?: string;
  columns?: SheetColumn[];
  assignment?: GoogleSheetsAssignmentConfig;
}

export interface GoogleSheetsIntegrationPayload {
  google_sheets: GoogleSheetsIntegrationConfig;
  timezone?: string;
}

export interface DiscoveredGoogleSheet {
  sheet_id: string;
  sheet_name: string;
  web_view_link: string;
  modified_time?: string;
  owned_by_me?: boolean;
  is_connected: boolean;
  connections?: { agent_id?: string; agent_name?: string; label?: string }[];
}

export interface DiscoverGoogleSheetsResult {
  credential_id?: string;
  email?: string;
  sheets: DiscoveredGoogleSheet[];
}

/** Sheets eligible for roster picker — excludes current roster and sheets linked elsewhere. */
export function rosterSheetsForPicker(
  discovered: DiscoveredGoogleSheet[],
  currentRosterId?: string,
): DiscoveredGoogleSheet[] {
  return discovered.filter(s => {
    if (currentRosterId && s.sheet_id === currentRosterId) return false;
    if (isRosterLinkedToAnotherAgent(s, currentRosterId)) return false;
    return true;
  });
}

/** True when sheet is linked to a different integration (not the roster already on this data sheet). */
export function isRosterLinkedToAnotherAgent(
  sheet: DiscoveredGoogleSheet,
  currentRosterId?: string,
): boolean {
  if (!sheet.is_connected) return false;
  if (currentRosterId && sheet.sheet_id === currentRosterId) return false;
  return true;
}

export interface StandaloneSheetResult {
  sheet_id: string;
  sheet_name: string;
  tab_name?: string;
  web_view_link: string;
  tab_gid?: number | string;
  gid?: number | string;
}

export const DEFAULT_INTEGRATION_TIMEZONE = 'Asia/Kolkata';

/** Suggested directory columns — clients can customise in the sheet after creation. */
export const DEFAULT_DIRECTORY_COLUMNS: SheetColumn[] = [
  { header: 'Name', field: 'name', required: true },
  { header: 'Email', field: 'email', required: false },
  { header: 'Department', field: 'department', required: false },
  { header: 'Phone', field: 'phone', required: false },
  { header: 'Role', field: 'role', required: false },
  { header: 'Available From', field: 'available_from', required: false },
  { header: 'Available To', field: 'available_to', required: false },
  { header: 'Working Days', field: 'working_days', required: false },
];

export const DEFAULT_DIRECTORY_TAB_NAME = 'Staff';

/** Fallback data-sheet columns when integration was created without a template schema. */
export const DEFAULT_ASSIGNMENT_DATA_COLUMNS: SheetColumn[] = [
  { header: 'Ticket ID', field: 'ticket_id', required: true, role: 'system', prefix: 'TKT' },
  { header: 'Name', field: 'caller_name', required: true, ask_as: 'your full name', role: 'caller', auto_classify: true },
  { header: 'Phone', field: 'caller_phone', required: true, ask_as: 'your mobile number', role: 'caller', auto_classify: true },
  { header: 'Category', field: 'category', required: true, ask_as: 'type of issue', role: 'caller', auto_classify: true },
  { header: 'Description', field: 'description', required: true, ask_as: 'describe the problem', role: 'caller', auto_classify: true },
  { header: 'Registered At', field: 'registered_at', required: false, role: 'system' },
  { header: 'Assigned To', field: 'assigned_to', required: false, role: 'internal' },
  { header: 'Assigned Email', field: 'assigned_email', required: false, role: 'internal' },
  { header: 'Status', field: 'status', required: false, role: 'tracking' },
];

export function resolveDataSheetColumns(columns?: SheetColumn[]): SheetColumn[] {
  return columns?.length ? columns : DEFAULT_ASSIGNMENT_DATA_COLUMNS;
}

export function buildFullIntegrationConfig(params: {
  sheetId: string;
  sheetName: string;
  tabName?: string;
  columns?: SheetColumn[];
  assignment?: GoogleSheetsAssignmentConfig;
  timezone?: string;
}): GoogleSheetsIntegrationPayload {
  const columns = params.columns?.length ? params.columns : undefined;
  return {
    google_sheets: {
      sheet_id: params.sheetId,
      sheet_name: params.sheetName,
      tab_name: params.tabName,
      ...(columns ? { columns } : {}),
      ...(params.assignment ? { assignment: params.assignment } : {}),
    },
    timezone: params.timezone ?? DEFAULT_INTEGRATION_TIMEZONE,
  };
}

export function defaultDirectorySheetTitle(parentSheetName: string): string {
  const base = parentSheetName.replace(/\s*—\s*Staff(?:\s*&\s*Officers)?.*$/i, '').trim();
  return `${base} — Staff`;
}

/** @deprecated Use DEFAULT_DIRECTORY_COLUMNS */
export const STAFF_ROSTER_COLUMNS = DEFAULT_DIRECTORY_COLUMNS;

/** @deprecated Use DEFAULT_DIRECTORY_TAB_NAME */
export const STAFF_ROSTER_TAB_NAME = DEFAULT_DIRECTORY_TAB_NAME;

export function getDirectorySheetId(config?: GoogleSheetsIntegrationConfig | null): string {
  const legacy = config as GoogleSheetsIntegrationConfig & { staff_roster_sheet_id?: string };
  return config?.assignment?.directory_sheet_id ?? legacy?.staff_roster_sheet_id ?? '';
}

export function hasAutoAssignment(config?: GoogleSheetsIntegrationConfig | null): boolean {
  if (config?.assignment?.enabled && config.assignment.directory_sheet_id) return true;
  const legacy = config as GoogleSheetsIntegrationConfig & { staff_roster_sheet_id?: string };
  return Boolean(legacy?.staff_roster_sheet_id);
}

export function isDirectorySheet(sheetId: string, integrations: { config?: { google_sheets?: GoogleSheetsIntegrationConfig } }[]): boolean {
  if (integrations.some(i => getDirectorySheetId(i.config?.google_sheets) === sheetId)) return true;
  return integrations.some(i => {
    const gs = i.config?.google_sheets as GoogleSheetsIntegrationConfig & { sheet_role?: string; sheet_id?: string; linked_data_sheet_id?: string };
    if (gs?.sheet_role === 'staff_roster' && gs?.sheet_id === sheetId) return true;
    return false;
  });
}

type IntegrationLike = {
  config?: { google_sheets?: GoogleSheetsIntegrationConfig & {
    sheet_role?: string;
    linked_data_sheet_id?: string;
    linked_data_sheet_name?: string;
  } };
  label?: string;
  sheet_id?: string;
};

/** Parent data sheet id when this sheet is a roster/directory child. */
export function getParentDataSheetId(directorySheetId: string, integrations: IntegrationLike[]): string | null {
  for (const i of integrations) {
    const gs = i.config?.google_sheets;
    if (!gs) continue;
    if (getDirectorySheetId(gs) === directorySheetId) {
      return gs.sheet_id ?? i.sheet_id ?? null;
    }
    if (gs.sheet_role === 'staff_roster' && gs.sheet_id === directorySheetId && gs.linked_data_sheet_id) {
      return gs.linked_data_sheet_id;
    }
  }
  return null;
}

/** True if this sheet should only appear nested under a parent card — never as its own card. */
export function isDirectoryOnlySheet(sheetId: string, integrations: IntegrationLike[]): boolean {
  if (isDirectorySheet(sheetId, integrations)) return true;
  if (getParentDataSheetId(sheetId, integrations)) return true;

  const self = integrations.find(i => (i.config?.google_sheets?.sheet_id ?? i.sheet_id) === sheetId);
  const gs = self?.config?.google_sheets;
  if (!gs) return false;

  if (gs.sheet_role === 'staff_roster') return true;
  if (gs.linked_data_sheet_id) return true;

  const name = gs.sheet_name ?? self?.label ?? '';
  const agentId = (self as { agent_id?: string; agentId?: string }).agent_id
    ?? (self as { agent_id?: string; agentId?: string }).agentId;

  if (/—\s*Staff\b/i.test(name)) {
    const baseName = name.replace(/\s*—\s*Staff.*$/i, '').trim().toLowerCase();
    const hasParent = integrations.some(i => {
      const pid = i.config?.google_sheets?.sheet_id ?? i.sheet_id;
      if (!pid || pid === sheetId) return false;
      const pname = (i.config?.google_sheets?.sheet_name ?? i.label ?? '').trim().toLowerCase();
      return pname === baseName;
    });
    if (hasParent) return true;

    if (agentId) {
      const hasSiblingDataSheet = integrations.some(i => {
        const pid = i.config?.google_sheets?.sheet_id ?? i.sheet_id;
        if (!pid || pid === sheetId) return false;
        if ((i.agent_id ?? i.agentId) !== agentId) return false;
        const pname = i.config?.google_sheets?.sheet_name ?? i.label ?? '';
        return !/—\s*Staff\b/i.test(pname);
      });
      if (hasSiblingDataSheet) return true;
    }
  }

  // roster referenced by any parent's linked-directory detection
  for (const i of integrations) {
    const pid = i.config?.google_sheets?.sheet_id ?? i.sheet_id;
    if (!pid || pid === sheetId) continue;
    const linked = getLinkedDirectoryForDataSheet(pid, integrations);
    if (linked?.sheetId === sheetId) return true;
  }

  return false;
}

/** Linked roster/directory sheet for a data sheet — only explicit API links, no name guessing. */
export function getLinkedDirectoryForDataSheet(
  dataSheetId: string,
  integrations: IntegrationLike[],
  resolveName?: (sheetId: string) => string | undefined,
): { sheetId: string; sheetName: string } | null {
  const parentInt = integrations.find(i => (i.config?.google_sheets?.sheet_id ?? i.sheet_id) === dataSheetId);
  const gs = parentInt?.config?.google_sheets;
  if (!gs) return null;

  const dirId = getDirectorySheetId(gs);
  if (dirId) {
    return {
      sheetId: dirId,
      sheetName: gs.assignment?.directory_sheet_name ?? resolveName?.(dirId) ?? 'Staff Directory',
    };
  }

  const legacyRoster = integrations.find(i => {
    const rgs = i.config?.google_sheets;
    return rgs?.sheet_role === 'staff_roster' && rgs.linked_data_sheet_id === dataSheetId;
  });
  if (legacyRoster) {
    const rgs = legacyRoster.config!.google_sheets!;
    return {
      sheetId: rgs.sheet_id,
      sheetName: rgs.sheet_name ?? legacyRoster.label ?? 'Staff Directory',
    };
  }

  return null;
}

export function buildDataSheetCards(
  integrations: IntegrationLike[],
  sheets: { id: string; name: string }[],
): { id: string; name: string }[] {
  const cards: { id: string; name: string }[] = [];
  const seen = new Set<string>();

  for (const i of integrations) {
    const sheetId = i.config?.google_sheets?.sheet_id ?? i.sheet_id;
    if (!sheetId || seen.has(sheetId)) continue;
    if (isDirectoryOnlySheet(sheetId, integrations)) continue;

    seen.add(sheetId);
    cards.push({
      id: sheetId,
      name: i.config?.google_sheets?.sheet_name ?? i.label ?? sheets.find(s => s.id === sheetId)?.name ?? 'Sheet',
    });
  }

  return cards;
}

export interface RosterSheetCard {
  id: string;
  name: string;
  parentDataSheetId: string;
  parentDataSheetName: string;
  agentId?: string;
  agentName?: string;
  parentIntegrationId?: string;
}

export function buildRosterSheetCards(
  integrations: IntegrationLike[],
  sheets: { id: string; name: string }[],
  resolveAgentName?: (agentId: string) => string | undefined,
): RosterSheetCard[] {
  const cards: RosterSheetCard[] = [];
  const seen = new Set<string>();

  for (const dataSheet of buildDataSheetCards(integrations, sheets)) {
    const linked = getLinkedDirectoryForDataSheet(
      dataSheet.id,
      integrations,
      id => sheets.find(s => s.id === id)?.name,
    );
    if (!linked || seen.has(linked.sheetId)) continue;
    seen.add(linked.sheetId);

    const parentInt = integrations.find(
      i => (i.config?.google_sheets?.sheet_id ?? i.sheet_id) === dataSheet.id,
    );
    const agentId =
      (parentInt as { agent_id?: string; agentId?: string } | undefined)?.agent_id
      ?? (parentInt as { agent_id?: string; agentId?: string } | undefined)?.agentId;

    cards.push({
      id: linked.sheetId,
      name: linked.sheetName,
      parentDataSheetId: dataSheet.id,
      parentDataSheetName: dataSheet.name,
      agentId,
      agentName: agentId ? resolveAgentName?.(agentId) : undefined,
      parentIntegrationId:
        (parentInt as { _id?: string; id?: string } | undefined)?._id
        ?? (parentInt as { _id?: string; id?: string } | undefined)?.id,
    });
  }

  return cards;
}

export function buildAssignmentConfig(params: {
  directorySheetId: string;
  directorySheetName?: string;
  directoryTabName?: string;
  dataSheetColumns?: SheetColumn[];
}): GoogleSheetsAssignmentConfig {
  const cols = params.dataSheetColumns ?? [];

  const categoryCol =
    cols.find(c => c.field === 'category') ??
    cols.find(c => c.role === 'caller' && c.auto_classify) ??
    cols.find(c => c.header.toLowerCase().includes('category'));

  const assignCol =
    cols.find(c => c.field === 'assigned_to') ??
    cols.find(c => c.role === 'internal' && !c.field.includes('email')) ??
    cols.find(c => c.field === 'assignee') ??
    cols.find(c => c.header.toLowerCase().includes('assign'));

  const emailCol =
    cols.find(c => c.field === 'assigned_email') ??
    cols.find(c => c.field === 'email' && c.role === 'internal');

  const assignField = assignCol?.field ?? 'assigned_to';
  const emailField = emailCol?.field ?? 'assigned_email';

  const output: GoogleSheetsAssignmentOutput[] = [
    { directory_column: 'Name', record_column: assignField },
    { directory_column: 'Email', record_column: emailField },
  ];

  const fallback: Record<string, string> = {
    [assignField]: 'Unassigned',
    [emailField]: '',
  };

  return {
    enabled: true,
    directory_sheet_id: params.directorySheetId,
    directory_sheet_name: params.directorySheetName,
    directory_tab_name: params.directoryTabName ?? DEFAULT_DIRECTORY_TAB_NAME,
    match: categoryCol
      ? [{ record_field: categoryCol.field, directory_column: 'Department' }]
      : [],
    output,
    availability: {
      from_column: 'Available From',
      to_column: 'Available To',
      days_column: 'Working Days',
    },
    fallback,
  };
}

export const NEW_SHEET_WARM_MS = 4500;
export const IFRAME_READY_DELAY_MS = 1000;
export const IFRAME_LOAD_FALLBACK_MS = 20000;

const RECENT_SHEETS_KEY = 'gs_recent_sheet_ids';
const RECENT_SHEET_TTL_MS = 10 * 60 * 1000;

interface RecentSheetEntry {
  id: string;
  at: number;
}

export function markGoogleSheetRecent(sheetId: string): void {
  try {
    const existing: RecentSheetEntry[] = JSON.parse(sessionStorage.getItem(RECENT_SHEETS_KEY) || '[]');
    const next = [{ id: sheetId, at: Date.now() }, ...existing.filter(entry => entry.id !== sheetId)].slice(0, 12);
    sessionStorage.setItem(RECENT_SHEETS_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

export function isGoogleSheetRecent(sheetId: string): boolean {
  try {
    const existing: RecentSheetEntry[] = JSON.parse(sessionStorage.getItem(RECENT_SHEETS_KEY) || '[]');
    const hit = existing.find(entry => entry.id === sheetId);
    return Boolean(hit && Date.now() - hit.at < RECENT_SHEET_TTL_MS);
  } catch {
    return false;
  }
}

export function buildSheetIframeUrl(sheetId: string, options?: { gid?: string | number; webViewLink?: string }) {
  if (options?.webViewLink?.includes('/spreadsheets/d/')) {
    const url = new URL(options.webViewLink);
    url.pathname = url.pathname.replace(/\/view$/, '/edit').replace(/\/edit\/.*$/, '/edit');
    if (!url.pathname.endsWith('/edit')) url.pathname = url.pathname.replace(/\/?$/, '/edit');
    if (options.gid != null) url.searchParams.set('gid', String(options.gid));
    return url.toString();
  }
  const url = new URL(`https://docs.google.com/spreadsheets/d/${sheetId}/edit`);
  url.searchParams.set('usp', 'sharing');
  if (options?.gid != null) url.searchParams.set('gid', String(options.gid));
  return url.toString();
}

export function sheetViewPath(
  sheetId: string,
  params: { name: string; new?: boolean; role?: 'directory' | 'data'; gid?: string | number; tab?: string }
): string {
  const qs = new URLSearchParams({ name: params.name });
  if (params.new) qs.set('new', 'true');
  if (params.role) qs.set('role', params.role);
  if (params.gid != null) qs.set('gid', String(params.gid));
  if (params.tab) qs.set('tab', params.tab);
  return `/google-sheets/${sheetId}/view?${qs.toString()}`;
}
