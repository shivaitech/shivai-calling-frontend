// Command Center — human-employee workspace data façade.
//
// Calls + Leads are backed by the real APIs that already exist (contactsAPI:
// call-history + contacts). Follow-ups and the employee activity feed have no
// backend yet, so they use a localStorage-backed mock store (same pattern as
// mockAgentStore) with a clear TODO to swap for real endpoints.

import {
  listCallHistory,
  getCallHistoryStats,
  listContacts,
  type CallHistoryItem,
  type CallHistoryListResult,
  type ListCallHistoryParams,
  type TenantContact,
  type ListContactsParams,
} from "./contactsAPI";

export type { CallHistoryItem, TenantContact };

// Command Center rows may carry extra context the base call type doesn't model
// (which sub-tenant it belongs to, the outcome disposition).
export type CommandCenterCall = CallHistoryItem & {
  tenant_id?: string;
  tenant_name?: string;
  outcome?: string;
};

// ─── Mock data (temporary) ───────────────────────────────────────────────────
// Calls & Leads use the real APIs, but fall back to this sample data when the
// backend errors or returns nothing, so the module is demoable now.
// TODO(command-center): remove the fallback once real data flows.

const MOCK_AGENTS = ['Aria (Inbound)', 'Max (Outbound)', 'Nova (Web)'];
const MOCK_STATUSES = ['completed', 'completed', 'completed', 'no-answer', 'failed', 'busy'];
const MOCK_NAMES = [
  'Rahul Verma', 'Sofia Alvarez', 'James Carter', 'Mei Chen', 'Omar Haddad',
  'Priya Nair', 'Liam O’Brien', 'Ana Costa', 'Yuki Tanaka', 'Grace Miller',
  'Diego Torres', 'Fatima Khan', 'Noah Wilson', 'Elena Petrova', 'Arjun Mehta',
];
// Sub-tenants (celebrities) the calls belong to.
const MOCK_TENANTS = [
  { id: 'tn-goal', name: 'Goal' },
  { id: 'tn-newworth', name: 'New Worth' },
  { id: 'tn-stellar', name: 'Stellar Talent' },
  { id: 'tn-nova', name: 'Nova Media' },
];
const MOCK_OUTCOMES = ['Interested', 'Callback requested', 'Not interested', 'Voicemail', 'Booked meeting', 'Wrong number'];

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const pick = <T>(arr: T[], i: number): T => arr[i % arr.length];

const MOCK_CALLS: CommandCenterCall[] = Array.from({ length: 24 }, (_, i) => {
  const direction = i % 3 === 2 ? 'web' : i % 2 === 0 ? 'inbound' : 'outbound';
  const start = hoursAgo(i * 5 + 1);
  const dur = [45, 90, 132, 0, 210, 15, 320, 60][i % 8];
  const tenant = pick(MOCK_TENANTS, i);
  return {
    id: `mock-call-${i}`,
    call_id: `mock-call-${i}`,
    session_id: `sess-${i}`,
    direction,
    status: pick(MOCK_STATUSES, i),
    outcome: pick(MOCK_OUTCOMES, i),
    agent_name: pick(MOCK_AGENTS, i),
    contact_name: pick(MOCK_NAMES, i),
    phone_number: `+1 (555) ${String(1000 + i * 7).slice(0, 3)}-${String(2000 + i * 13).slice(0, 4)}`,
    language: i % 4 === 0 ? 'Spanish' : 'English',
    tenant_id: tenant.id,
    tenant_name: tenant.name,
    start_time: start,
    end_time: new Date(new Date(start).getTime() + dur * 1000).toISOString(),
    duration_seconds: dur,
  };
});

const MOCK_LEADS: TenantContact[] = MOCK_NAMES.map((name, i) => ({
  id: `mock-lead-${i}`,
  name,
  phone_number: `+1 (555) ${String(1000 + i * 7).slice(0, 3)}-${String(2000 + i * 13).slice(0, 4)}`,
  email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
  direction: i % 3 === 0 ? 'inbound' : i % 3 === 1 ? 'outbound' : 'both',
  is_active: true,
  created_at: hoursAgo(i * 9 + 2),
}));

const paginate = <T>(rows: T[], page = 1, limit = 20) => {
  const start = (page - 1) * limit;
  return {
    slice: rows.slice(start, start + limit),
    total: rows.length,
    total_pages: Math.max(1, Math.ceil(rows.length / limit)),
    page,
    limit,
  };
};

const mockCallResult = (params: ListCallHistoryParams): CallHistoryListResult => {
  const { page = 1, limit = 20, direction, status, phone_number } = params;
  const subTenantId = (params as any).sub_tenant_id as string | undefined;
  let rows = MOCK_CALLS;
  if (subTenantId) rows = rows.filter((c) => c.tenant_id === subTenantId);
  if (direction && direction !== 'all') rows = rows.filter((c) => c.direction === direction);
  if (status && status !== 'all') rows = rows.filter((c) => c.status === status);
  if (phone_number) rows = rows.filter((c) => (c.phone_number || '').includes(phone_number));
  const p = paginate(rows, page, limit);
  return {
    calls: p.slice,
    pagination: { page: p.page, limit: p.limit, total: p.total, total_pages: p.total_pages, has_next: p.page < p.total_pages, has_prev: p.page > 1 },
  };
};

const MOCK_STATS = {
  total: MOCK_CALLS.length,
  inbound: MOCK_CALLS.filter((c) => c.direction === 'inbound').length,
  outbound: MOCK_CALLS.filter((c) => c.direction === 'outbound').length,
  avg_duration_seconds: Math.round(MOCK_CALLS.reduce((s, c) => s + (c.duration_seconds || 0), 0) / MOCK_CALLS.length),
};

// ─── Calls (real API with mock fallback) ─────────────────────────────────────

export const listCalls = async (params: ListCallHistoryParams = {}): Promise<CallHistoryListResult> => {
  try {
    const res = await listCallHistory(params);
    return res.calls.length > 0 ? res : mockCallResult(params);
  } catch {
    return mockCallResult(params);
  }
};

export const getCallStats = async (params: Parameters<typeof getCallHistoryStats>[0] = {}) => {
  try {
    const s = await getCallHistoryStats(params);
    return s && (s.total ?? s.total_calls ?? s.count) ? s : MOCK_STATS;
  } catch {
    return MOCK_STATS;
  }
};

// ─── Leads (real API with mock fallback) ─────────────────────────────────────

export const listLeads = async (params: ListContactsParams = {}) => {
  try {
    const res = await listContacts(params);
    if (res.data.length > 0) return res;
  } catch {
    /* fall through to mock */
  }
  const { page = 1, limit = 20, search } = params;
  let rows = MOCK_LEADS;
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter((l) => `${l.name} ${l.phone_number}`.toLowerCase().includes(q));
  }
  const p = paginate(rows, page, limit);
  return { data: p.slice, total: p.total, page: p.page, limit: p.limit };
};

// ─── Follow-ups (mock store) ─────────────────────────────────────────────────
// TODO(command-center backend): replace with GET/POST/PATCH /follow-ups.

export type FollowUpPriority = "low" | "medium" | "high";
export type FollowUpStatus = "open" | "done";

export interface FollowUp {
  id: string;
  tenantId: string; // sub-tenant this follow-up belongs to
  title: string;
  contactName?: string;
  phoneNumber?: string;
  dueAt: string; // ISO
  priority: FollowUpPriority;
  status: FollowUpStatus;
  assigneeId?: string; // human-employee id
  assigneeName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Employee activity (mock store) ──────────────────────────────────────────
// TODO(command-center backend): replace with GET /activity (audit feed).

export type ActivityKind =
  | "call_handled"
  | "lead_created"
  | "lead_updated"
  | "follow_up_created"
  | "follow_up_completed"
  | "note_added";

export interface ActivityEntry {
  id: string;
  tenantId: string;
  actorId: string;
  actorName: string;
  kind: ActivityKind;
  summary: string;
  target?: string; // e.g. contact name / phone
  at: string; // ISO
}

const FOLLOW_UPS_KEY = "cc_follow_ups_v1";
const ACTIVITY_KEY = "cc_activity_v1";

const read = <T>(key: string): T[] => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const write = <T>(key: string, rows: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(rows));
  } catch {
    /* storage unavailable — no-op */
  }
};

const uid = () => Math.random().toString(36).slice(2, 10);

export const followUpStore = {
  list(tenantId?: string): FollowUp[] {
    const all = read<FollowUp>(FOLLOW_UPS_KEY);
    return tenantId ? all.filter((f) => f.tenantId === tenantId) : all;
  },
  upsert(row: Partial<FollowUp> & { id?: string; tenantId: string; title: string; dueAt: string }): FollowUp {
    const all = read<FollowUp>(FOLLOW_UPS_KEY);
    const now = new Date().toISOString();
    if (row.id) {
      const idx = all.findIndex((f) => f.id === row.id);
      if (idx >= 0) {
        all[idx] = { ...all[idx], ...row, updatedAt: now } as FollowUp;
        write(FOLLOW_UPS_KEY, all);
        return all[idx];
      }
    }
    const created: FollowUp = {
      id: uid(),
      priority: "medium",
      status: "open",
      createdAt: now,
      updatedAt: now,
      ...row,
    } as FollowUp;
    all.unshift(created);
    write(FOLLOW_UPS_KEY, all);
    return created;
  },
  setStatus(id: string, status: FollowUpStatus): void {
    const all = read<FollowUp>(FOLLOW_UPS_KEY);
    const idx = all.findIndex((f) => f.id === id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], status, updatedAt: new Date().toISOString() };
      write(FOLLOW_UPS_KEY, all);
    }
  },
  remove(id: string): void {
    write(
      FOLLOW_UPS_KEY,
      read<FollowUp>(FOLLOW_UPS_KEY).filter((f) => f.id !== id)
    );
  },
};

export const activityStore = {
  list(tenantId?: string): ActivityEntry[] {
    const all = read<ActivityEntry>(ACTIVITY_KEY);
    const rows = tenantId ? all.filter((a) => a.tenantId === tenantId) : all;
    return rows.sort((a, b) => (a.at < b.at ? 1 : -1));
  },
  log(entry: Omit<ActivityEntry, "id" | "at"> & { at?: string }): ActivityEntry {
    const all = read<ActivityEntry>(ACTIVITY_KEY);
    const created: ActivityEntry = { id: uid(), at: new Date().toISOString(), ...entry };
    all.unshift(created);
    write(ACTIVITY_KEY, all.slice(0, 500));
    return created;
  },
};

// ─── Seed mock follow-ups & activity (temporary) ─────────────────────────────
// Populates the stores once per tenant so the Follow-ups and Activity tabs are
// demoable now. Guarded by a per-tenant flag so it never clobbers real rows the
// user creates. TODO(command-center): remove when backend feeds these.

const SEED_FLAG = 'cc_seeded_v1';

const MOCK_STAFF = ['Priya Sharma', 'Daniel Cruz', 'Aisha Khan', 'Tom Becker'];

export const seedMockData = (tenantId: string): void => {
  try {
    const seeded: string[] = JSON.parse(localStorage.getItem(SEED_FLAG) || '[]');
    if (seeded.includes(tenantId)) return;

    const now = Date.now();
    const iso = (offsetH: number) => new Date(now + offsetH * 3600_000).toISOString();

    const followUps: FollowUp[] = [
      { title: 'Call back about brand collaboration', contactName: 'Sofia Alvarez', phoneNumber: '+1 (555) 100-2013', dueAt: iso(-20), priority: 'high', status: 'open', assigneeName: 'Priya Sharma' },
      { title: 'Send pricing to inbound lead', contactName: 'James Carter', phoneNumber: '+1 (555) 101-2026', dueAt: iso(4), priority: 'medium', status: 'open', assigneeName: 'Daniel Cruz' },
      { title: 'Confirm event date', contactName: 'Mei Chen', phoneNumber: '+1 (555) 102-2039', dueAt: iso(28), priority: 'medium', status: 'open', assigneeName: 'Aisha Khan' },
      { title: 'Follow up on unanswered call', contactName: 'Omar Haddad', phoneNumber: '+1 (555) 103-2052', dueAt: iso(-2), priority: 'high', status: 'open', assigneeName: 'Priya Sharma' },
      { title: 'Thank-you note after signed deal', contactName: 'Grace Miller', phoneNumber: '+1 (555) 104-2065', dueAt: iso(-48), priority: 'low', status: 'done', assigneeName: 'Tom Becker' },
    ].map((f) => ({
      id: uid(),
      tenantId,
      createdAt: iso(-50),
      updatedAt: iso(-50),
      ...f,
    })) as FollowUp[];

    const existingFU = read<FollowUp>(FOLLOW_UPS_KEY);
    write(FOLLOW_UPS_KEY, [...followUps, ...existingFU]);

    const activityKinds: ActivityEntry['kind'][] = ['call_handled', 'lead_created', 'follow_up_completed', 'note_added', 'lead_updated'];
    const activity: ActivityEntry[] = Array.from({ length: 14 }, (_, i) => ({
      id: uid(),
      tenantId,
      actorId: `staff-${i % MOCK_STAFF.length}`,
      actorName: MOCK_STAFF[i % MOCK_STAFF.length],
      kind: activityKinds[i % activityKinds.length],
      summary: [
        'Handled an inbound call',
        'Created a new lead',
        'Completed a follow-up',
        'Added a note',
        'Updated lead details',
      ][i % 5],
      target: MOCK_NAMES[i % MOCK_NAMES.length],
      at: iso(-(i * 6 + 1)),
    }));
    const existingAct = read<ActivityEntry>(ACTIVITY_KEY);
    write(ACTIVITY_KEY, [...activity, ...existingAct]);

    localStorage.setItem(SEED_FLAG, JSON.stringify([...seeded, tenantId]));
  } catch {
    /* storage unavailable — skip seeding */
  }
};

export default {
  listCalls,
  getCallStats,
  listLeads,
  followUpStore,
  activityStore,
  seedMockData,
};
