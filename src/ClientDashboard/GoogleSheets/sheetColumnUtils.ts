import { SheetColumn } from '../../services/authAPI';
import type { SheetColumnRole } from './sheetTypes';

export const COLUMN_ROLE_OPTIONS: { value: SheetColumnRole; label: string }[] = [
  { value: 'caller', label: 'Caller' },
  { value: 'system', label: 'System' },
  { value: 'internal', label: 'Internal' },
  { value: 'tracking', label: 'Tracking' },
];

export const COLUMN_ROLE_GUIDE: {
  role: SheetColumnRole;
  label: string;
  filledBy: string;
  description: string;
  examples: string;
}[] = [
  {
    role: 'caller',
    label: 'Caller',
    filledBy: 'Asked on the call',
    description: 'Data the AI collects from the person on the phone.',
    examples: 'Name, phone, email, issue details',
  },
  {
    role: 'system',
    label: 'System',
    filledBy: 'Filled automatically',
    description: 'Timestamps, IDs, and call metadata — the agent does not ask for these.',
    examples: 'Ticket ID, complaint ID, registered at, call duration',
  },
  {
    role: 'internal',
    label: 'Internal',
    filledBy: 'Assigned by the system',
    description: 'Staff or owner fields, often matched from a directory sheet.',
    examples: 'Assigned to, assignee email',
  },
  {
    role: 'tracking',
    label: 'Tracking',
    filledBy: 'Updated over time',
    description: 'Workflow status fields that change as records progress.',
    examples: 'Status, stage, outcome',
  },
];

export function resolveColumnRole(role?: SheetColumn['role']): SheetColumnRole {
  if (role && COLUMN_ROLE_OPTIONS.some(o => o.value === role)) return role;
  return 'caller';
}

const RECORD_ID_FIELDS = new Set([
  'record_id',
  'ticket_id',
  'complaint_id',
  'call_id',
  'lead_id',
  'appointment_id',
  'product_id',
  'case_id',
  'request_id',
]);

const ID_PREFIX_BY_FIELD: Record<string, string> = {
  record_id: 'REC',
  ticket_id: 'TKT',
  complaint_id: 'CMP',
  call_id: 'CL',
  lead_id: 'LD',
  appointment_id: 'APT',
  product_id: 'PRD',
  case_id: 'CASE',
  request_id: 'REQ',
};

export const DEFAULT_RECORD_ID_COLUMN: SheetColumn = {
  header: 'Record ID',
  field: 'record_id',
  required: true,
  role: 'system',
  prefix: 'REC',
};

export function isRecordIdColumn(col: SheetColumn): boolean {
  const field = (col.field ?? '').trim().toLowerCase();
  if (RECORD_ID_FIELDS.has(field)) return true;
  const header = (col.header ?? '').trim().toLowerCase();
  return (
    header === 'id' ||
    header.endsWith(' id') ||
    header.includes('ticket id') ||
    header.includes('complaint id') ||
    header.includes('case id')
  );
}

function inferIdPrefix(field: string): string {
  const key = field.trim().toLowerCase();
  return ID_PREFIX_BY_FIELD[key] ?? 'REC';
}

/** Default prefix for a record ID column — used as placeholder when none is set. */
export function getRecordIdPrefixDefault(col: SheetColumn): string {
  return col.prefix?.trim() || inferIdPrefix(col.field);
}

/** Every sheet must have a required system ID column — prepend or upgrade if missing. */
export function ensureRecordIdColumn(columns: SheetColumn[]): SheetColumn[] {
  const next = columns.map(cloneColumn);
  const idx = next.findIndex(isRecordIdColumn);

  if (idx >= 0) {
    const upgraded: SheetColumn = {
      ...next[idx],
      required: true,
      role: 'system',
      prefix: next[idx].prefix?.trim() || inferIdPrefix(next[idx].field),
    };
    next.splice(idx, 1);
    return [upgraded, ...next];
  }

  return [cloneColumn(DEFAULT_RECORD_ID_COLUMN), ...next];
}

export function fieldFromHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '') || 'column';
}

export function cloneColumn(col: SheetColumn): SheetColumn {
  return { ...col };
}

export function cloneColumns(cols: SheetColumn[]): SheetColumn[] {
  return cols.map(cloneColumn);
}

export function createEmptyColumn(header = ''): SheetColumn {
  const h = header.trim();
  return {
    header: h,
    field: h ? fieldFromHeader(h) : '',
    required: false,
    role: 'caller',
    auto_classify: true,
  };
}

const NON_AI_ROLES = new Set<SheetColumnRole>(['system', 'internal', 'tracking']);

/** Columns the AI collects on the call (Caller role or has ask_as). */
export function isAiFilledColumn(col: SheetColumn): boolean {
  if (isRecordIdColumn(col)) return false;
  if (col.role && NON_AI_ROLES.has(col.role)) return false;
  if (col.role === 'caller') return true;
  if (col.ask_as?.trim()) return true;
  return false;
}

/** Template setup: Caller / ask_as columns get auto-classify enabled. */
export function applyAiFillDefaults(columns: SheetColumn[]): SheetColumn[] {
  return columns.map(col => {
    if (!isAiFilledColumn(col)) return col;
    return { ...col, role: 'caller', auto_classify: true };
  });
}

function applyCallerAutoClassifyFlag(col: SheetColumn): SheetColumn {
  if (isRecordIdColumn(col) || resolveColumnRole(col.role) !== 'caller') return col;
  return { ...col, auto_classify: col.auto_classify !== false };
}

/** Strip empty rows and ensure every column has header + field before API calls. */
export function normalizeColumnsForApi(columns: SheetColumn[]): SheetColumn[] {
  const normalized = columns
    .map(col => {
      const header = col.header?.trim() ?? '';
      const field = (col.field?.trim() || fieldFromHeader(header)).trim();
      if (!header || !field) return null;
      const row: SheetColumn = {
        header,
        field,
        required: Boolean(col.required),
        role: resolveColumnRole(col.role),
      };
      if (col.ask_as?.trim()) row.ask_as = col.ask_as.trim();
      if (col.prefix?.trim()) row.prefix = col.prefix.trim();
      return applyCallerAutoClassifyFlag(row);
    })
    .filter((c): c is SheetColumn => c !== null);
  return applyAiFillDefaults(ensureRecordIdColumn(normalized));
}

export function normalizeFetchedColumns(raw: unknown): SheetColumn[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(item => {
      if (typeof item === 'string') {
        const header = item.trim();
        if (!header) return null;
        return { header, field: fieldFromHeader(header), required: false, role: 'caller' };
      }
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>;
        const header = String(o.header ?? o.name ?? '').trim();
        if (!header) return null;
        const field = String(o.field ?? fieldFromHeader(header)).trim();
        const col: SheetColumn = {
          header,
          field,
          required: Boolean(o.required),
          role: resolveColumnRole(o.role as SheetColumn['role']),
        };
        if (typeof o.ask_as === 'string' && o.ask_as.trim()) col.ask_as = o.ask_as.trim();
        if (typeof o.prefix === 'string' && o.prefix.trim()) col.prefix = o.prefix.trim();
        if (o.auto_classify) col.auto_classify = true;
        return applyCallerAutoClassifyFlag(col);
      }
      return null;
    })
    .filter((c): c is SheetColumn => c !== null);
}

/** Preserve roles/settings when sheet headers change in Google Sheets. */
export function mergeColumnsFromSheet(
  fetched: SheetColumn[],
  existing: SheetColumn[],
): SheetColumn[] {
  const byHeader = new Map(
    existing.map(c => [c.header.trim().toLowerCase(), c]),
  );
  const byField = new Map(existing.map(c => [c.field, c]));

  return applyAiFillDefaults(
    ensureRecordIdColumn(
      fetched.map(f => {
      const key = f.header.trim().toLowerCase();
      const match = byHeader.get(key) ?? byField.get(f.field);
      if (match) {
        return { ...cloneColumn(match), header: f.header };
      }
      return {
        header: f.header,
        field: f.field || fieldFromHeader(f.header),
        required: f.required ?? false,
        ...(f.role ? { role: f.role } : { role: 'caller' as const }),
        ...(f.ask_as ? { ask_as: f.ask_as } : {}),
        ...(f.auto_classify ? { auto_classify: true } : {}),
        ...(f.prefix ? { prefix: f.prefix } : {}),
      };
    }),
    ),
  );
}

export function roleBadgeClass(role?: string): string {
  switch (role) {
    case 'caller':
      return 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50';
    case 'system':
      return 'bg-slate-100 text-slate-600 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    case 'internal':
      return 'bg-violet-50 text-violet-700 border-violet-200/80 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/50';
    case 'tracking':
      return 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50';
    default:
      return 'bg-slate-50 text-slate-500 border-slate-200/80 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700';
  }
}
