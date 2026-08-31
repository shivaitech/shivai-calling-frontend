// Shared types for the Sub Tenants permission system. See
// SUB_TENANTS_MODULE_SPEC.md §5 for the full design rationale.

export interface PermissionAction {
  key: string; // e.g. "module:employees.page:edit-agent.action:delete"
  label: string;
}

export interface PermissionPage {
  key: string; // e.g. "module:employees.page:edit-agent"
  label: string;
  actions?: PermissionAction[];
}

export interface PermissionModule {
  key: string; // e.g. "module:employees"
  label: string;
  pages: PermissionPage[];
}

/** tenantId -> permission key -> granted */
export type PermissionGrantMap = Record<string, boolean>;

export type TenantType = 'MAIN' | 'SUBTENANT';
export type TenantStatus = 'active' | 'suspended' | 'pending_invite';
export type TenantBillingMode = 'CENTRAL' | 'PASSTHROUGH';

export interface TenantResourceLimits {
  maxAgents?: number;
  maxCampaignsPerMonth?: number;
  maxCallMinutesPerMonth?: number;
  maxUsers?: number;
}

export interface TenantBillingConfig {
  mode: TenantBillingMode;
  markupPercent?: number;
  perMinuteRate?: number;
  perAgentRate?: number;
}

export type TenantBackgroundTexture = 'none' | 'dots' | 'lines' | 'grid';

export interface TenantBranding {
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  accentColor: string;
  /** Panel shell background — falls back to the default ShivAI gradient when unset. */
  backgroundColor?: string;
  /** Subtle repeating CSS pattern layered over backgroundColor. */
  backgroundTexture?: TenantBackgroundTexture;
  /** Page/section heading color (Sidebar/TopBar titles). */
  headingColor?: string;
  /** Body/secondary text color (Sidebar/TopBar subtext, nav labels). */
  textColor?: string;
  /** Card/panel surface color — GlassCard and other content surfaces
   * (stat tiles, list rows, sub-tenant/agent cards). Falls back to the
   * default translucent white/slate-800 look when unset. */
  cardSurfaceColor?: string;
}

export interface TenantUsageStats {
  activeAgents: number;
  callsThisMonth: number;
  callMinutesThisMonth: number;
  successRate: number; // 0-100
  activeUsers: number;
}

export interface TenantContactInfo {
  ownerName: string;
  email: string;
  phone: string;
  /** Free-text — city/region is enough for a client directory, not a full
   * structured address (no billing/shipping use case yet). */
  location: string;
  industry?: string;
  website?: string;
  notes?: string;
}

export interface Tenant {
  id: string;
  type: TenantType;
  parentTenantId: string | null;
  name: string;
  slug: string;
  status: TenantStatus;
  createdAt: string;
  createdBy: string;
  billing: TenantBillingConfig;
  branding: TenantBranding;
  limits: TenantResourceLimits;
  usage: TenantUsageStats;
  contact: TenantContactInfo;
}

export interface TenantInvite {
  id: string;
  tenantId: string;
  email: string;
  inviteUrl: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export type TenantMemberRole = 'SUBTENANT_OWNER' | 'SUBTENANT_MEMBER';
export type TenantMemberStatus = 'active' | 'invited';

export interface TenantMember {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: TenantMemberRole;
  status: TenantMemberStatus;
  lastActive: string | null; // null when never logged in (still invited)
  invitedAt: string;
}

export type TenantAgentStatus = 'Pending' | 'Published';
export type TenantAgentChannel = 'webrtc' | 'inbound' | 'outbound';

/** Slim summary of a sub-tenant's AI employee for the SubTenantDetail "AI
 * Employees" tab — not the full agent-editing shape (see agentAPI.ApiAgent),
 * since this view is read-only drill-down, not an editor. */
export interface TenantAgentSummary {
  id: string;
  tenantId: string;
  name: string;
  status: TenantAgentStatus;
  agentType: TenantAgentChannel;
  voice: string;
  callsThisMonth: number;
  successRate: number;
  createdAt: string;
}

export interface TenantAuditLogEntry {
  id: string;
  tenantId: string;
  actorUserId: string;
  actorName: string;
  action: string;
  detail: string;
  timestamp: string;
}

export interface PermissionTemplate {
  id: string;
  name: string;
  grants: PermissionGrantMap;
}
