import { fullAccessGrants } from '../permissions/registry';
import type {
  PermissionGrantMap,
  PermissionTemplate,
  Tenant,
  TenantAgentSummary,
  TenantAuditLogEntry,
  TenantBranding,
  TenantContactInfo,
  TenantInvite,
  TenantMember,
  TenantMemberRole,
} from '../permissions/types';

/**
 * Sub Tenants API — NO backend endpoint exists yet (see
 * SUB_TENANTS_MODULE_SPEC.md §9 for the intended real contract:
 * GET/POST /tenants/:id/sub-tenants, /permissions, /branding, /invites, etc).
 *
 * This service operates on an in-memory mock store shaped exactly like the
 * real API responses so swapping in real HTTP calls later only touches the
 * method bodies below, not any calling code. Same pattern as
 * ZohoCrmDashboard's MOCK_LEADS/MOCK_DEALS.
 */

const MOCK_LATENCY_MS = 350;
const delay = (ms = MOCK_LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms));

/** Branding persistence — no backend yet, so it's kept in localStorage
 * (keyed per tenantId) instead of only living in the in-memory mock store,
 * which would otherwise reset on every page reload. */
const BRANDING_STORAGE_PREFIX = 'shivai:tenant-branding:';

function loadStoredBranding(tenantId: string): TenantBranding | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(BRANDING_STORAGE_PREFIX + tenantId);
    return raw ? (JSON.parse(raw) as TenantBranding) : null;
  } catch {
    return null;
  }
}

function saveStoredBranding(tenantId: string, branding: TenantBranding): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BRANDING_STORAGE_PREFIX + tenantId, JSON.stringify(branding));
  } catch {
    // Storage full/unavailable — branding still applies for this session via the in-memory store.
  }
}

const MOCK_TEMPLATES: PermissionTemplate[] = [
  { id: 'tpl-full', name: 'Full Access', grants: fullAccessGrants(true) },
  {
    id: 'tpl-standard',
    name: 'Standard Client Package',
    grants: {
      'module:employees': true,
      'module:employees.page:list': true,
      'module:employees.page:list.action:create': false,
      'module:employees.page:list.action:delete': false,
      'module:employees.page:edit-agent': true,
      'module:employees.page:edit-agent.action:regenerate-template': false,
      'module:employees.page:edit-agent.action:improve-with-ai': true,
      'module:employees.page:edit-agent.action:delete': false,
      'module:employees.page:training': false,
      'module:workflows': true,
      'module:workflows.page:call-setup': true,
      'module:workflows.page:call-setup.action:launch-campaign': true,
      'module:workflows.page:canvas': false,
      'module:workflows.page:documents': false,
      'module:analytics': true,
      'module:analytics.page:overview': true,
      'module:monitoring': false,
      'module:zoho': false,
      'module:google-calendar': false,
      'module:marketplace': false,
      'module:billing': false,
      'module:settings': true,
      'module:settings.page:profile': true,
      'module:settings.page:security': true,
      'module:settings.page:team': false,
      'module:settings.page:api': false,
      'module:settings.page:accounts': false,
    },
  },
  {
    id: 'tpl-analytics-only',
    name: 'Analytics Only',
    grants: {
      'module:analytics': true,
      'module:analytics.page:overview': true,
      'module:settings': true,
      'module:settings.page:profile': true,
    },
  },
];

function makeMockTenant(overrides: Partial<Tenant> & Pick<Tenant, 'id' | 'name'>): Tenant {
  return {
    type: 'SUBTENANT',
    parentTenantId: 'tenant-main-demo',
    slug: overrides.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: 'user-main-owner',
    billing: { mode: 'CENTRAL' },
    branding: { logoUrl: null, faviconUrl: null, primaryColor: '#7c3aed', accentColor: '#4f46e5' },
    limits: { maxAgents: 5, maxUsers: 10 },
    usage: {
      activeAgents: 0,
      callsThisMonth: 0,
      callMinutesThisMonth: 0,
      successRate: 0,
      activeUsers: 1,
    },
    contact: { ownerName: '', email: '', phone: '', location: '' },
    ...overrides,
  };
}

const MOCK_MAIN_TENANT: Tenant = {
  id: 'tenant-main-demo',
  type: 'MAIN',
  parentTenantId: null,
  name: 'Your Business',
  slug: 'your-business',
  status: 'active',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString(),
  createdBy: 'user-main-owner',
  billing: { mode: 'CENTRAL' },
  branding: { logoUrl: null, faviconUrl: null, primaryColor: '#7c3aed', accentColor: '#4f46e5' },
  limits: {},
  usage: { activeAgents: 0, callsThisMonth: 0, callMinutesThisMonth: 0, successRate: 0, activeUsers: 1 },
  contact: { ownerName: '', email: '', phone: '', location: '' },
};

let MOCK_TENANTS: Tenant[] = [
  makeMockTenant({
    id: 'tenant-sub-1',
    name: 'Northwind Dental Clinic',
    status: 'active',
    usage: {
      activeAgents: 3,
      callsThisMonth: 842,
      callMinutesThisMonth: 3120,
      successRate: 91,
      activeUsers: 4,
    },
    contact: {
      ownerName: 'Dr. Alicia Ferns',
      email: 'alicia@northwinddental.com',
      phone: '+1 (415) 555-0142',
      location: 'San Francisco, CA',
      industry: 'Healthcare — Dental',
      website: 'northwinddental.com',
    },
  }),
  makeMockTenant({
    id: 'tenant-sub-2',
    name: 'Bluewave Realty Group',
    status: 'active',
    limits: { maxAgents: 3, maxUsers: 5 },
    usage: {
      activeAgents: 2,
      callsThisMonth: 310,
      callMinutesThisMonth: 980,
      successRate: 87,
      activeUsers: 2,
    },
    contact: {
      ownerName: 'Owen Tran',
      email: 'owen@bluewaverealty.com',
      phone: '+1 (512) 555-0187',
      location: 'Austin, TX',
      industry: 'Real Estate',
      website: 'bluewaverealty.com',
    },
  }),
  makeMockTenant({
    id: 'tenant-sub-3',
    name: 'Crestline Auto Service',
    status: 'suspended',
    usage: {
      activeAgents: 1,
      callsThisMonth: 12,
      callMinutesThisMonth: 40,
      successRate: 76,
      activeUsers: 1,
    },
    contact: {
      ownerName: 'Sam Alvarez',
      email: 'sam@crestlineauto.com',
      phone: '+1 (303) 555-0119',
      location: 'Denver, CO',
      industry: 'Automotive Services',
    },
  }),
  makeMockTenant({
    id: 'tenant-sub-4',
    name: 'Harborview Legal Associates',
    status: 'pending_invite',
    usage: {
      activeAgents: 0,
      callsThisMonth: 0,
      callMinutesThisMonth: 0,
      successRate: 0,
      activeUsers: 0,
    },
    contact: {
      ownerName: 'Nadia Whitfield',
      email: 'nadia@harborviewlegal.com',
      phone: '+1 (206) 555-0173',
      location: 'Seattle, WA',
      industry: 'Legal Services',
    },
  }),
];

// Hydrate branding from localStorage so it survives page reloads (the rest
// of the mock store is in-memory only and intentionally resets).
{
  const storedMain = loadStoredBranding(MOCK_MAIN_TENANT.id);
  if (storedMain) MOCK_MAIN_TENANT.branding = storedMain;
  MOCK_TENANTS.forEach((tenant) => {
    const stored = loadStoredBranding(tenant.id);
    if (stored) tenant.branding = stored;
  });
}

const MOCK_GRANTS: Record<string, PermissionGrantMap> = {
  'tenant-sub-1': { ...MOCK_TEMPLATES[1].grants },
  'tenant-sub-2': { ...MOCK_TEMPLATES[2].grants },
  'tenant-sub-3': { ...MOCK_TEMPLATES[1].grants },
  'tenant-sub-4': { ...MOCK_TEMPLATES[1].grants },
};

const MOCK_AUDIT_LOG: Record<string, TenantAuditLogEntry[]> = {
  'tenant-sub-1': [
    {
      id: 'audit-1',
      tenantId: 'tenant-sub-1',
      actorUserId: 'user-main-owner',
      actorName: 'You',
      action: 'Viewed panel',
      detail: 'Opened "Enter Tenant View" for 6 minutes',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    },
  ],
};

const MOCK_MEMBERS: Record<string, TenantMember[]> = {
  'tenant-sub-1': [
    {
      id: 'member-1',
      tenantId: 'tenant-sub-1',
      name: 'Dr. Alicia Ferns',
      email: 'alicia@northwinddental.com',
      role: 'SUBTENANT_OWNER',
      status: 'active',
      lastActive: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      invitedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    },
    {
      id: 'member-2',
      tenantId: 'tenant-sub-1',
      name: 'Marcus Webb',
      email: 'marcus@northwinddental.com',
      role: 'SUBTENANT_MEMBER',
      status: 'active',
      lastActive: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      invitedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    },
    {
      id: 'member-3',
      tenantId: 'tenant-sub-1',
      name: 'Priya Nair',
      email: 'priya@northwinddental.com',
      role: 'SUBTENANT_MEMBER',
      status: 'invited',
      lastActive: null,
      invitedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
  ],
  'tenant-sub-2': [
    {
      id: 'member-4',
      tenantId: 'tenant-sub-2',
      name: 'Owen Tran',
      email: 'owen@bluewaverealty.com',
      role: 'SUBTENANT_OWNER',
      status: 'active',
      lastActive: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      invitedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    },
  ],
  'tenant-sub-3': [
    {
      id: 'member-5',
      tenantId: 'tenant-sub-3',
      name: 'Sam Alvarez',
      email: 'sam@crestlineauto.com',
      role: 'SUBTENANT_OWNER',
      status: 'active',
      lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      invitedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
    },
  ],
  'tenant-sub-4': [],
};

const MOCK_AGENTS: Record<string, TenantAgentSummary[]> = {
  'tenant-sub-1': [
    {
      id: 'agent-1a', tenantId: 'tenant-sub-1', name: 'Nora — Appointment Concierge', status: 'Published',
      agentType: 'inbound', voice: 'Aria', callsThisMonth: 512, successRate: 93,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 150).toISOString(),
    },
    {
      id: 'agent-1b', tenantId: 'tenant-sub-1', name: 'Reminder Caller', status: 'Published',
      agentType: 'outbound', voice: 'Kore', callsThisMonth: 280, successRate: 89,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    },
    {
      id: 'agent-1c', tenantId: 'tenant-sub-1', name: 'After-Hours Triage', status: 'Pending',
      agentType: 'inbound', voice: 'Charon', callsThisMonth: 50, successRate: 88,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    },
  ],
  'tenant-sub-2': [
    {
      id: 'agent-2a', tenantId: 'tenant-sub-2', name: 'Listing Assistant', status: 'Published',
      agentType: 'inbound', voice: 'Puck', callsThisMonth: 210, successRate: 85,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    },
    {
      id: 'agent-2b', tenantId: 'tenant-sub-2', name: 'Lead Follow-up', status: 'Published',
      agentType: 'outbound', voice: 'Aria', callsThisMonth: 100, successRate: 90,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
    },
  ],
  'tenant-sub-3': [
    {
      id: 'agent-3a', tenantId: 'tenant-sub-3', name: 'Service Booking Line', status: 'Published',
      agentType: 'inbound', voice: 'Fenrir', callsThisMonth: 12, successRate: 76,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100).toISOString(),
    },
  ],
  'tenant-sub-4': [],
};

/** Keyed by `${slug}/${token}` — matches the inviteUrl path shape. */
const MOCK_INVITES: Record<string, TenantInvite> = {};

class TenantAPI {
  async listSubTenants(): Promise<Tenant[]> {
    await delay();
    return [...MOCK_TENANTS];
  }

  async getTenant(tenantId: string): Promise<Tenant> {
    await delay(150);
    const tenant = tenantId === MOCK_MAIN_TENANT.id
      ? MOCK_MAIN_TENANT
      : MOCK_TENANTS.find((t) => t.id === tenantId);
    if (!tenant) throw new Error('Tenant not found');
    return tenant;
  }

  /**
   * A sub-tenant uses its OWN branding when the Main Business has explicitly
   * set one for it (via the "Only update sub-tenant panel" scope in
   * BrandingTab), otherwise it inherits the Main Business's shared branding.
   * Falls back to null (default ShivAI branding) if nothing is set anywhere.
   */
  async getBranding(tenantId: string): Promise<TenantBranding | null> {
    await delay(150);
    const isCustomized = (b: TenantBranding) =>
      Boolean(
        b.logoUrl || b.faviconUrl || b.primaryColor !== '#7c3aed' || b.accentColor !== '#4f46e5' ||
        b.backgroundColor || (b.backgroundTexture && b.backgroundTexture !== 'none') || b.headingColor ||
        b.textColor || b.cardSurfaceColor
      );

    const tenant = tenantId === MOCK_MAIN_TENANT.id
      ? MOCK_MAIN_TENANT
      : MOCK_TENANTS.find((t) => t.id === tenantId);
    if (!tenant) return null;

    if (tenant.type === 'SUBTENANT' && isCustomized(tenant.branding)) return tenant.branding;

    const source = tenant.type === 'SUBTENANT' ? MOCK_MAIN_TENANT : tenant;
    return isCustomized(source.branding) ? source.branding : null;
  }

  /**
   * scope 'all' (default) writes the Main Business's shared branding, which
   * every sub-tenant without its own override inherits. scope 'tenant-only'
   * writes directly onto that one sub-tenant's record instead, overriding
   * the shared branding just for them.
   */
  async setBranding(tenantId: string, branding: TenantBranding, scope: 'all' | 'tenant-only' = 'all'): Promise<void> {
    await delay(250);
    if (scope === 'tenant-only' && tenantId !== MOCK_MAIN_TENANT.id) {
      const tenant = MOCK_TENANTS.find((t) => t.id === tenantId);
      if (tenant) tenant.branding = branding;
      saveStoredBranding(tenantId, branding);
      return;
    }
    if (tenantId === MOCK_MAIN_TENANT.id) {
      MOCK_MAIN_TENANT.branding = branding;
      saveStoredBranding(tenantId, branding);
      return;
    }
    const tenant = MOCK_TENANTS.find((t) => t.id === tenantId);
    if (tenant) tenant.branding = branding;
    saveStoredBranding(tenantId, branding);
  }

  async createSubTenant(params: {
    name: string;
    sendInvite: boolean;
    email?: string;
    /** Sign-in credential for the sub-tenant's owner account — passed
     * through to the (future) real signup endpoint only, never persisted
     * on the Tenant record itself since that's fetched/displayed broadly. */
    password?: string;
    templateId?: string;
    contact: TenantContactInfo;
    maxAgents?: number;
    maxUsers?: number;
  }): Promise<Tenant> {
    await delay();
    const id = `tenant-sub-${Math.random().toString(36).slice(2, 8)}`;
    const tenant = makeMockTenant({
      id,
      name: params.name,
      status: params.sendInvite ? 'pending_invite' : 'active',
      contact: params.contact,
      limits: {
        maxAgents: params.maxAgents ?? 5,
        maxUsers: params.maxUsers ?? 10,
      },
    });
    MOCK_TENANTS = [tenant, ...MOCK_TENANTS];
    const template = MOCK_TEMPLATES.find((t) => t.id === params.templateId) || MOCK_TEMPLATES[1];
    MOCK_GRANTS[id] = { ...template.grants };
    return tenant;
  }

  async updateTenantStatus(tenantId: string, status: Tenant['status']): Promise<Tenant> {
    await delay(200);
    const tenant = MOCK_TENANTS.find((t) => t.id === tenantId);
    if (!tenant) throw new Error('Tenant not found');
    tenant.status = status;
    return tenant;
  }

  async getPermissions(tenantId: string): Promise<{ grants: PermissionGrantMap }> {
    await delay(150);
    return { grants: MOCK_GRANTS[tenantId] || {} };
  }

  async setPermissions(tenantId: string, grants: PermissionGrantMap): Promise<void> {
    await delay(250);
    MOCK_GRANTS[tenantId] = { ...grants };
  }

  async listTemplates(): Promise<PermissionTemplate[]> {
    await delay(100);
    return MOCK_TEMPLATES;
  }

  async createInvite(tenantId: string, email: string): Promise<TenantInvite> {
    await delay();
    const slug = MOCK_TENANTS.find((t) => t.id === tenantId)?.slug || 'tenant';
    const token = Math.random().toString(36).slice(2, 10);
    const invite: TenantInvite = {
      id: `invite-${Math.random().toString(36).slice(2, 8)}`,
      tenantId,
      email,
      inviteUrl: `${window.location.origin}/invite/${slug}/${token}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    };
    MOCK_INVITES[`${slug}/${token}`] = invite;
    // Reflect the invite as a pending member right away so the Members list
    // shows it without a separate refetch race.
    const list = MOCK_MEMBERS[tenantId] || (MOCK_MEMBERS[tenantId] = []);
    list.push({
      id: `member-${Math.random().toString(36).slice(2, 8)}`,
      tenantId,
      name: email.split('@')[0],
      email,
      role: 'SUBTENANT_MEMBER',
      status: 'invited',
      lastActive: null,
      invitedAt: invite.createdAt,
    });
    return invite;
  }

  /** Resolves an invite link (public, pre-auth — spec §9 GET /invites/:token). */
  async resolveInvite(slug: string, token: string): Promise<{ invite: TenantInvite; tenantName: string }> {
    await delay(300);
    const invite = MOCK_INVITES[`${slug}/${token}`];
    if (!invite) throw new Error('This invite link is invalid or has expired.');
    if (invite.status !== 'pending') throw new Error('This invite has already been used.');
    if (new Date(invite.expiresAt).getTime() < Date.now()) throw new Error('This invite link has expired.');
    const tenant = MOCK_TENANTS.find((t) => t.id === invite.tenantId);
    return { invite, tenantName: tenant?.name || 'this business' };
  }

  /** Accepts an invite and creates the SUBTENANT_* account (spec §9 POST
   * /invites/:token/accept). Mocked entirely client-side — no real account
   * is created since there's no backend endpoint for it yet. */
  async acceptInvite(slug: string, token: string, _params: { fullName: string; password: string }): Promise<void> {
    await delay(400);
    const key = `${slug}/${token}`;
    const invite = MOCK_INVITES[key];
    if (!invite) throw new Error('This invite link is invalid or has expired.');
    invite.status = 'accepted';
    const member = (MOCK_MEMBERS[invite.tenantId] || []).find((m) => m.email === invite.email);
    if (member) {
      member.status = 'active';
      member.lastActive = new Date().toISOString();
    }
    const tenant = MOCK_TENANTS.find((t) => t.id === invite.tenantId);
    if (tenant?.status === 'pending_invite') tenant.status = 'active';
  }

  async listMembers(tenantId: string): Promise<TenantMember[]> {
    await delay(200);
    return [...(MOCK_MEMBERS[tenantId] || [])];
  }

  /** The sub-tenant's AI employees — read-only drill-down (spec §8 full
   * drill-down monitoring). Mock only: there's no per-tenant agent scoping
   * on the backend yet, so this can't be backed by the real agentAPI
   * without showing the Main Business's own agents mislabeled as the
   * sub-tenant's. */
  async listAgents(tenantId: string): Promise<TenantAgentSummary[]> {
    await delay(200);
    return [...(MOCK_AGENTS[tenantId] || [])];
  }

  async updateMemberRole(tenantId: string, memberId: string, role: TenantMemberRole): Promise<TenantMember> {
    await delay(200);
    const member = (MOCK_MEMBERS[tenantId] || []).find((m) => m.id === memberId);
    if (!member) throw new Error('Member not found');
    member.role = role;
    return member;
  }

  async removeMember(tenantId: string, memberId: string): Promise<void> {
    await delay(200);
    MOCK_MEMBERS[tenantId] = (MOCK_MEMBERS[tenantId] || []).filter((m) => m.id !== memberId);
  }

  async resendInvite(tenantId: string, memberId: string): Promise<void> {
    await delay(200);
    const member = (MOCK_MEMBERS[tenantId] || []).find((m) => m.id === memberId);
    if (member) member.invitedAt = new Date().toISOString();
  }

  async getAuditLog(tenantId: string): Promise<TenantAuditLogEntry[]> {
    await delay(150);
    return MOCK_AUDIT_LOG[tenantId] || [];
  }

  /**
   * Writes an "Enter Tenant View" enter/exit event to the audit log (spec
   * §8.2 — required, visible to the sub-tenant too, not just the Main
   * Business). No real view-token/session id yet since there's no backend
   * for it — this only records the event for the mock audit trail.
   */
  async recordViewSession(tenantId: string, event: 'enter' | 'exit'): Promise<void> {
    await delay(100);
    const list = MOCK_AUDIT_LOG[tenantId] || (MOCK_AUDIT_LOG[tenantId] = []);
    list.unshift({
      id: `audit-${Math.random().toString(36).slice(2, 8)}`,
      tenantId,
      actorUserId: 'user-main-owner',
      actorName: 'You',
      action: event === 'enter' ? 'Entered tenant view' : 'Exited tenant view',
      detail: event === 'enter' ? 'Opened "Enter Tenant View" as an observer' : 'Closed the tenant view session',
      timestamp: new Date().toISOString(),
    });
  }
}

export const tenantAPI = new TenantAPI();
