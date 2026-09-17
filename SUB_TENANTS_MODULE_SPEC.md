# Sub Tenants Module — Full Architecture & Feature Specification

Status: Planning draft v1
Owner: ShivAI platform team
Scope: Frontend (`shivai-calling-frontend`) + required backend contracts

---

## 1. What this module is

Today ShivAI is single-tenant per account: one business signs up, creates AI employees (agents), runs campaigns, views analytics — all scoped implicitly to their own JWT. There is **no concept of tenant, organization, role, or permission anywhere in the codebase** (confirmed: `User` has no `companyId`/`role`; `Agent` has no `tenantId`; the "Team" and "API permissions" UI in Settings today is fully mock/static with zero backend enforcement).

**Sub Tenants** introduces a two-level reseller/white-label hierarchy on top of this:

```
ShivAI (platform)
 └─ Main Business (Parent Tenant)              e.g. "Acme Corp"
     ├─ owns/pays for the ShivAI subscription
     ├─ has its own agents, campaigns, analytics (as today)
     ├─ manages N Sub Tenants (Acme's own clients)
     └─ customizes branding (logo + theme) for itself and its sub-tenants
         ├─ Sub Tenant 1 ("Client A")           logs into the same ShivAI panel
         ├─ Sub Tenant 2 ("Client B")               → sees Acme's branding, not ShivAI's
         └─ Sub Tenant N (...)                      → restricted to whatever Acme allows
```

A Main Business is effectively running **their own private instance of the ShivAI panel** for their clients, without ShivAI needing to stand up separate infrastructure per client. Sub-tenant users log in through the normal ShivAI site (or an invite link the Main Business shares) — there is no separate URL/subdomain requirement, tenant context is resolved from the logged-in account.

Non-negotiable brand rule: **however a Main Business re-themes/re-logos the panel, a small non-removable "Powered by ShivAI" mark is always present** below their logo.

---

## 2. Core decisions locked in for this design

These were decided up front because they shape every layer below — recorded here so later contributors don't relitigate them without cause.

| Decision | Choice | Why |
|---|---|---|
| Data isolation | Shared DB, `tenant_id` scoping on every table | Fastest to build on the current backend; Main Business needs cross-sub-tenant aggregation for monitoring, which is far harder with physically isolated stores |
| Billing | Main Business is billed by ShivAI centrally; Main Business **can optionally enable per-sub-tenant billing** (pass-through/reseller pricing) | Supports both "sub-tenants are just internal clients" and "I resell ShivAI at markup" use cases without forcing either |
| Hierarchy depth | Strictly 2 levels: Main Business → Sub Tenant. Sub-tenants cannot create their own sub-tenants | Matches the stated use case (a business with ~10 clients); avoids unbounded recursive permission inheritance |
| Auth / login path | Sub-tenants log in via the normal ShivAI site using their own credentials; tenant context resolved from their account record. Main Business can additionally generate/share an **invite link** to onboard a sub-tenant user directly | No subdomain infra required; still gives Main Business a controlled onboarding flow |
| Branding application | Resolved **post-login from the account's tenant record**, not from URL | Works with the login model above; no DNS/subdomain provisioning needed for v1 |
| Permission granularity | **Module + Page + individual button/action level** | Matches "restrict any feature any button" literally; built as a declarative permission-key system (see §5) so this is data-driven, not hardcoded per-button `if` statements |
| Monitoring | **Full drill-down** — Main Business can open a sub-tenant's actual agents, transcripts, leads, campaigns, not just aggregate stats | Matches "view monitor etc" requirement; implemented as a scoped "enter tenant" context switch with full audit logging |

---

## 3. Roles & identity model

### 3.1 New role concept (doesn't exist today — must be added everywhere)

```
PlatformRole:
  SHIVAI_ADMIN        (internal ShivAI staff — out of scope for this doc, exists already informally)

TenantRole (per account, new):
  MAIN_OWNER           Main Business's primary account. Full control of the tenant + all sub-tenants.
  MAIN_ADMIN           Main Business staff with delegated admin rights (configurable via same permission system).
  MAIN_MEMBER          Main Business staff, normal user, no sub-tenant management rights.
  SUBTENANT_OWNER      Sub-tenant's primary account. Full control within their own sub-tenant, bounded by
                        whatever Main Business allowed.
  SUBTENANT_MEMBER     Sub-tenant staff, normal user within that sub-tenant.
```

### 3.2 Tenant record (new entity)

```ts
interface Tenant {
  id: string;
  type: 'MAIN' | 'SUBTENANT';
  parentTenantId: string | null;      // null for MAIN, required for SUBTENANT
  name: string;                        // "Acme Corp"
  slug: string;                        // url-safe, used for invite links: /invite/acme-corp/xxxx
  status: 'active' | 'suspended' | 'pending_invite';
  createdAt: string;
  createdBy: string;                   // userId of the Main Business admin who created it
  billing: TenantBillingConfig;        // see §7
  branding: TenantBranding;            // see §6
  limits: TenantResourceLimits;        // see §5.4
}
```

### 3.3 User record changes

`src/contexts/AuthContext.tsx`'s `User` interface must gain:

```ts
interface User {
  // ...existing fields (id, email, fullName, profilePicture, emailVerified, company)
  tenantId: string;                    // which Tenant this user belongs to (MAIN or SUBTENANT)
  tenantRole: TenantRole;
  // 'company' free-text field is superseded by tenant.name for tenant-scoped accounts,
  // kept for backward compat / non-tenant legacy accounts
}
```

JWT payload gains `tenantId` + `tenantRole` claims so every API call is server-side scoped without relying on client-sent params.

---

## 4. Information architecture — where this lives in the app

### 4.1 New top-level module: "Sub Tenants" (Main Business panel only)

Added as a new `src/ClientDashboard/SubTenants/` module, visible in `Sidebar.tsx` **only when `user.tenantRole` is `MAIN_OWNER` or `MAIN_ADMIN`** (first real role-gated nav item in this codebase — currently sidebar has no such gating at all, so this also introduces the gating primitive itself).

```
src/ClientDashboard/SubTenants/
  SubTenantsList.tsx          Grid/table of all sub-tenants: name, status, plan/limits, active agents,
                               last activity, quick actions (view, suspend, edit permissions)
  SubTenantDetail.tsx          Single sub-tenant deep view:
                                 - Overview tab (usage stats, billing if enabled, activity log)
                                 - Permissions tab (module/page/button matrix — see §5)
                                 - Members tab (sub-tenant's users, roles, invite management)
                                 - Drill-down tab → launches "Enter Tenant View" (see §8)
  CreateSubTenantModal.tsx     Name, slug, initial plan/limits, initial permission template,
                               generates invite link or sends invite email
  SubTenantBrandingEditor.tsx  Per-sub-tenant branding override (if Main Business allows
                               sub-tenants to have their OWN sub-branding on top of Main's —
                               see §6.3 for whether this is allowed)
  PermissionMatrixEditor.tsx   Reusable component: renders the full module→page→action tree
                               as toggles (see §5.2), used both for default templates and
                               per-sub-tenant overrides
  components/
    TenantUsageCard.tsx
    TenantStatusBadge.tsx
    ActivityLogTable.tsx
    InviteLinkModal.tsx
```

### 4.2 New Settings surface: "Panel Branding" (Main Business panel only)

Added inside existing `src/ClientDashboard/Settings/Settings.tsx` as a new tab `branding` (alongside `profile, notifications, security, api, team, accounts`):

- Logo upload (replaces ShivAI logo in Sidebar/TopBar for this tenant and all its sub-tenants)
- Theme customization: primary color, accent color, light/dark default — extends `ThemeContext.tsx`, which today only toggles light/dark, into a tenant-scoped theme token provider
- Live preview pane
- Non-removable "Powered by ShivAI" strip preview (shown exactly as it will render — not editable, not toggle-able)

### 4.3 Sub-tenant's own experience

A sub-tenant user (`SUBTENANT_OWNER`/`SUBTENANT_MEMBER`) logs into the exact same app shell (`ProtectedRoute` → `Sidebar` + `TopBar` + routes) they already know, with three differences:

1. **Branding**: Main Business's logo/theme applied, ShivAI mark shown small underneath (§6).
2. **Sidebar**: nav items filtered by the permission matrix the Main Business configured for them (§5) — modules/pages/buttons not granted simply don't render (not just disabled, to avoid leaking feature existence — configurable per Main Business preference, default hidden).
3. **No "Sub Tenants" module**: strictly 2-level hierarchy means sub-tenants never see this module themselves.

Everything else (Employees/Agents, Workflows, Analytics, Zoho, Calendar, Marketplace) is the **same code**, just permission-gated and tenant-scoped — this is intentionally not a fork of the UI.

---

## 5. Permission system (the core mechanism)

This is the piece that doesn't exist at all today and everything else depends on it.

### 5.1 Permission key taxonomy

Every gate-able thing in the app gets a stable, hierarchical string key:

```
module:<moduleName>                              e.g. module:workflows
module:<moduleName>.page:<pageName>               e.g. module:workflows.page:call-setup
module:<moduleName>.page:<pageName>.action:<name>  e.g. module:employees.page:edit-agent.action:regenerate-template
                                                    e.g. module:employees.page:edit-agent.action:delete
                                                    e.g. module:workflows.page:call-setup.action:launch-campaign
```

- **Module-level deny** cascades: denying `module:zoho` hides the whole Zoho nav item and blocks its routes/API calls, no need to also deny its pages.
- **Page-level deny** hides that page/route but leaves the rest of the module.
- **Action-level deny** leaves the page visible but hides/disables the specific button and rejects the underlying API call server-side too (client-side hiding is UX only, never the security boundary).

### 5.2 Where keys get registered

A single source-of-truth registry file, generated from the actual app structure (not maintained by hand per sub-tenant):

```ts
// src/permissions/registry.ts
export const PERMISSION_REGISTRY: PermissionModule[] = [
  {
    key: 'module:employees',
    label: 'AI Employees',
    pages: [
      {
        key: 'module:employees.page:list',
        label: 'Employee List',
        actions: [
          { key: '...action:create', label: 'Create New Employee' },
          { key: '...action:delete', label: 'Delete Employee' },
        ],
      },
      {
        key: 'module:employees.page:edit-agent',
        label: 'Edit Employee',
        actions: [
          { key: '...action:regenerate-template', label: 'Regenerate Template' },
          { key: '...action:improve-with-ai', label: 'Improve with AI' },
          { key: '...action:delete', label: 'Delete Employee' },
        ],
      },
    ],
  },
  // ...Workflows, Analytics, Zoho, Marketplace, Settings, etc.
];
```

This registry is the contract between frontend and backend permission storage — both reference the same keys.

### 5.3 Enforcement points (must exist in 3 places, not just UI)

1. **Sidebar / navigation** — nav items filtered by `module:*` and `module:*.page:*` grants.
2. **Route guard** — a `<PermissionRoute requires="module:workflows.page:call-setup">` wrapper (new, sits alongside existing `ProtectedRoute`) redirects/404s if the tenant lacks the page grant, so direct-URL access can't bypass sidebar hiding.
3. **Component/button level** — a `usePermission('module:employees.page:edit-agent.action:delete')` hook (new) returns a boolean; used to conditionally render/disable buttons.
4. **Backend API** — every mutating endpoint must independently check the caller's tenant's permission grant server-side. **Client-side gating is UX convenience only; it is never the actual security boundary.** This must be called out explicitly to backend engineers implementing this.

### 5.4 Permission storage & inheritance

```ts
interface TenantPermissionGrant {
  tenantId: string;
  grants: Record<string /* permission key */, boolean>;
  // Unset keys inherit from parent's DEFAULT template for new sub-tenants,
  // then default to `false` (deny-by-default) for anything not explicitly granted.
}

interface TenantResourceLimits {
  maxAgents?: number;
  maxCampaignsPerMonth?: number;
  maxCallMinutesPerMonth?: number;
  maxUsers?: number;
  // Main Business can cap resource usage per sub-tenant independent of feature permissions
}
```

- **Deny-by-default**: a newly created sub-tenant starts with nothing granted; Main Business applies a starting template (e.g. "Full Access", "Analytics Only", "Agents + Calls Only") then fine-tunes.
- **Main Business can save custom templates** (e.g. "Standard Client Package") to apply to new sub-tenants without rebuilding the matrix each time.
- A Main Business's own permissions are never less than what they grant sub-tenants (can't grant what you don't have — enforced server-side against the Main Business's own ShivAI subscription plan).

### 5.5 UI for editing permissions — `PermissionMatrixEditor.tsx`

- Left column: collapsible tree (Module → Page → Action), each row a toggle.
- Toggling a Module off greys out (and force-collapses) its Pages/Actions.
- "Apply Template" dropdown at top to bulk-set from a saved template.
- Diff indicator: rows changed from the tenant's current saved state are highlighted before saving (reuses the diff-highlight pattern already built for the "Improve with AI" prompt preview — same visual language, blue-bold for additions).
- Search/filter box (permission trees get long — Employees alone has ~10+ action rows once Edit Agent's buttons are all enumerated).

---

## 6. Branding / white-label system

### 6.1 `TenantBranding` shape

```ts
interface TenantBranding {
  tenantId: string;
  logoUrl: string | null;              // null = falls back to inherited/default ShivAI logo
  faviconUrl: string | null;
  theme: {
    primaryColor: string;              // hex, drives Tailwind CSS var overrides
    accentColor: string;
    // deliberately small surface for v1 — not a full design-token override system
  };
  // No "hide ShivAI branding" field exists anywhere in this schema, intentionally —
  // see 6.2.
}
```

### 6.2 Non-removable ShivAI mark

- Rendered as a fixed, small "Powered by ShivAI ⚡" element anchored directly beneath the tenant logo slot in `Sidebar.tsx` / `TopBar.tsx`.
- This is a **hardcoded UI element in the shared shell component itself**, not a themeable/configurable field — there is no API field, no admin toggle, no CSS override hook exposed for it. This is a product/legal requirement, enforced by not building the escape hatch rather than by a permission check that could be misconfigured.

### 6.3 Inheritance: can sub-tenants have their own sub-branding?

Recommendation for v1: **No** — a sub-tenant always shows the Main Business's branding (which itself shows "Powered by ShivAI" underneath). Allowing sub-tenants to further re-brand on top would need a 3-level branding stack (ShivAI mark → Main Business logo → Sub-tenant logo) and mostly serves the "reseller of a reseller" case explicitly ruled out in §2 (strict 2-level hierarchy). Flagged here as an open question rather than decided outright — see §11.

### 6.4 Theme delivery mechanism

- `ThemeContext.tsx` extended: on login, after resolving `user.tenantId`, fetch that tenant's (or its parent's, if the user is a sub-tenant) `TenantBranding` and inject CSS custom properties (`--brand-primary`, `--brand-accent`) at the root, alongside the existing light/dark class toggle.
- Logo/favicon swapped via the same context, consumed by `Sidebar.tsx`, `TopBar.tsx`, and `index.html`'s favicon link (favicon needs a small runtime `<link>` swap since it can't be server-rendered per-tenant with a static `index.html`).

---

## 7. Billing (optional pass-through)

Kept intentionally minimal for v1 since it's opt-in:

```ts
interface TenantBillingConfig {
  mode: 'CENTRAL' | 'PASSTHROUGH';   // CENTRAL: Main Business pays ShivAI for everything, no sub-tenant billing UI
                                       // PASSTHROUGH: sub-tenant sees their own usage/invoice inside their panel
  passthroughPricing?: {
    markupPercent?: number;           // Main Business's resale markup over ShivAI's base cost
    perMinuteRate?: number;
    perAgentRate?: number;
  };
}
```

- When `mode: 'PASSTHROUGH'`, a sub-tenant's Settings gains a **Billing** tab (mirrors the Main Business's own existing `src/ClientDashboard/Billing/` module, tenant-scoped) showing their usage-based invoice.
- Main Business's own `SubTenantDetail.tsx` Overview tab shows a running usage/cost figure per sub-tenant either way (for their own internal accounting), independent of whether pass-through billing is turned on.
- Actual payment collection (Stripe/etc.) from sub-tenants is a **separate, larger integration** — this doc only specifies the data model and UI surface; payment processor integration is out of scope for v1 and should be scoped separately when this is prioritized.

---

## 8. Monitoring & full drill-down

Main Business needs to genuinely inspect a sub-tenant's real data — agents, transcripts, leads, campaigns — not just aggregate charts.

### 8.1 "Enter Tenant View" mechanism

- From `SubTenantDetail.tsx`, a Main Business admin clicks **"View as [Sub Tenant Name]"**.
- This issues a short-lived, scoped **view token** (backend-issued, NOT a full login — the admin is never actually authenticated as the sub-tenant user, they get a token scoped to `tenantId: <subtenant>, mode: 'observer', actingAs: <main-admin-userId>`).
- The app shell re-renders in a distinct **"Viewing as" banner mode** (persistent colored bar at the top: *"You are viewing [Client A]'s panel as an observer. [Exit]"*) — reuses the visual pattern already established for the standalone `AppWorkspace.tsx` context-switch shell.
- All existing pages (Employees, Workflows, Analytics, etc.) render normally against the sub-tenant's real data via the scoped token — no separate "read-only clone" UI to build and maintain.
- **Read vs. write while in this mode** is itself a decision point — see §11 (should the Main Business be able to *act* on a sub-tenant's data while viewing, e.g. edit their agent, or strictly observe?).

### 8.2 Audit logging (required, not optional)

Every "Enter Tenant View" session is logged:

```ts
interface TenantViewAuditLog {
  id: string;
  mainAdminUserId: string;
  subTenantId: string;
  enteredAt: string;
  exitedAt: string | null;
  actionsTaken: Array<{ timestamp: string; action: string; details: string }>; // if writes are allowed
}
```

Visible to the sub-tenant themselves too (transparency: "Acme Corp viewed your panel on Aug 20, 2026") in their own activity log — this matters for trust in a reseller relationship and should not be treated as optional/hidden.

### 8.3 Aggregate monitoring (the non-drill-down layer)

`SubTenantsList.tsx` and a rollup dashboard show, without entering any single tenant:
- Active agents count, calls this month, success rate, active users — per sub-tenant, sortable/filterable table
- Status flags: sub-tenants nearing their `TenantResourceLimits`, sub-tenants with failed KB training (reuses existing failure-state work from `AgentManagement.tsx`), inactive sub-tenants

---

## 9. API surface (new, backend-owned but frontend-contract-defined here)

Following this codebase's existing service-layer convention (axios instance, singleton class export, typed interfaces, shared auth-retry interceptor — see `src/services/agentAPI.ts` / `authAPI.ts` pattern):

```
src/services/tenantAPI.ts

GET    /tenants/mine                          → current user's own tenant (+ parent if sub-tenant)
GET    /tenants/:tenantId/sub-tenants          → list (Main Business only)
POST   /tenants/:tenantId/sub-tenants          → create sub-tenant (+ optional invite email)
GET    /tenants/:tenantId                      → single tenant detail
PATCH  /tenants/:tenantId                      → update name/status/limits
DELETE /tenants/:tenantId                      → suspend/delete (soft-delete, never hard-delete client data)

GET    /tenants/:tenantId/permissions          → current grant map
PUT    /tenants/:tenantId/permissions          → replace grant map (full matrix save)
GET    /permission-templates                   → saved templates (Main Business scoped)
POST   /permission-templates                   → save current matrix as a new template

GET    /tenants/:tenantId/branding             → branding config (falls back to parent's if unset)
PUT    /tenants/:tenantId/branding              → update logo/theme (Main Business only, applies to self + all sub-tenants)

POST   /tenants/:tenantId/invites               → generate invite link/email for a sub-tenant user
GET    /invites/:inviteToken                     → resolve invite (public, pre-auth)
POST   /invites/:inviteToken/accept              → accept invite, creates SUBTENANT_* user

POST   /tenants/:tenantId/view-session          → issue scoped "Enter Tenant View" token (Main Business only)
DELETE /tenants/:tenantId/view-session          → exit / end audit log entry

GET    /tenants/:tenantId/usage                 → usage stats for monitoring dashboard
GET    /tenants/:tenantId/audit-logs             → view-session audit history
```

All existing resource endpoints (agents, campaigns, calls, leads) implicitly gain tenant scoping server-side via the JWT's `tenantId` claim — **no client-side change needed to those existing services** beyond the permission-gating described in §5.

---

## 10. Build sequencing (recommended phases)

This is large enough that shipping it as one PR is not realistic. Recommended slicing:

**Phase 1 — Foundation (no user-visible sub-tenant features yet)**
- `Tenant` entity, `tenantId`/`tenantRole` on `User`, JWT claims
- Permission registry (`§5.2`) + `usePermission` hook + `<PermissionRoute>` — wired up but with everyone granted everything by default, so behavior is unchanged
- `ThemeContext` extended for tenant-scoped branding tokens (still just ShivAI defaults for everyone)

**Phase 2 — Main Business sub-tenant management**
- `SubTenantsList`, `CreateSubTenantModal`, invite flow
- `PermissionMatrixEditor` + templates
- Basic aggregate monitoring (§8.3)

**Phase 3 — Branding**
- Settings → Branding tab, logo/theme upload + live preview
- Non-removable ShivAI mark placement finalized in Sidebar/TopBar
- Favicon runtime swap

**Phase 4 — Full drill-down & audit**
- "Enter Tenant View" scoped token flow + banner mode
- Audit logging, sub-tenant-visible activity log

**Phase 5 — Billing pass-through (optional, only if/when needed)**
- `TenantBillingConfig` UI, sub-tenant Billing tab, pricing/markup config
- Payment processor integration scoped separately

---

## 11. Open questions (need a decision before or during build, not blocking this doc)

1. **Sub-tenant sub-branding** (§6.3) — does a sub-tenant ever get to layer their own logo on top of the Main Business's, or is Main Business branding always final? Leaning "always final" for v1 simplicity.
2. **Write access during "Enter Tenant View"** (§8.1) — can a Main Business admin edit a sub-tenant's agent while viewing, or strictly observe? Affects whether this is a support tool or a management tool.
3. **Hidden vs. disabled for denied permissions** — when a module/page/action is denied, does it disappear entirely from the sidebar/UI, or show greyed-out with an upsell/contact-admin message? Affects whether sub-tenants can even discover features exist to ask for them.
4. **Can a sub-tenant have sub-tenant-level "Team" members with their own roles** (`SUBTENANT_OWNER` inviting more `SUBTENANT_MEMBER`s), and does the Main Business's permission matrix apply uniformly to all of a sub-tenant's users, or can the sub-tenant further restrict its own members? (Likely yes to the latter, reusing the same permission-key system recursively — worth confirming.)
5. **Resource limit enforcement UX** — when a sub-tenant hits `maxAgents`/`maxCallMinutesPerMonth`, what's the in-product experience? Hard block with upgrade-request-to-Main-Business flow, or soft warning only?

---

## 12. Summary of new/changed files (frontend)

```
NEW:
  src/permissions/registry.ts
  src/permissions/usePermission.ts
  src/components/PermissionRoute.tsx
  src/services/tenantAPI.ts
  src/ClientDashboard/SubTenants/**  (module described in §4.1)
  src/ClientDashboard/Settings/BrandingTab.tsx  (or inline new tab in Settings.tsx)

CHANGED:
  src/contexts/AuthContext.tsx        + tenantId, tenantRole on User
  src/contexts/ThemeContext.tsx       + tenant branding token injection
  src/components/Sidebar.tsx          + permission-based nav filtering, tenant logo + ShivAI mark,
                                        "Sub Tenants" nav item (Main Business only)
  src/components/TopBar.tsx           + tenant logo, "Viewing as" banner mode
  src/App.tsx                         + <PermissionRoute> wraps around existing routes,
                                        invite-accept public route
  src/ClientDashboard/Settings/Settings.tsx   + new "branding" tab
  src/ClientDashboard/Billing/*        + pass-through billing view (Phase 5, conditional)
```
