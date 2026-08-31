# ShivAI — Boss Admin Panel: Tenant Activity Spec

**Goal:** Build a separate Admin Panel where the Boss (super-admin) picks any tenant on the ShivAI platform and sees **everything** about that tenant — every agent, every call, every campaign, analytics, billing, installed apps, integrations, team, all of it. This is a single reference document, written for a separate project/team to build against, covering every module a tenant has and exactly what the admin view of it should contain.

**Source of truth:** `shivai-calling-frontend` (the tenant-facing dashboard). API base: one shared REST host, `VITE_API_BASE_URL`. Auth: JWT access + refresh token, `Authorization: Bearer <accessToken>`.

For each module below: what the Boss should see, the real tenant-side API contract where one already exists, and — for modules with no backend yet — the proposed data shape to build, so nothing is left undefined.

---

## 0. Foundation: Tenant Scoping (read this first — blocks everything else)

Today, the tenant-facing app never tells the backend "which tenant" explicitly — the backend reads it off the logged-in user's JWT. There is no tenant switcher, no `tenant_id` request param, no admin role concept anywhere in the current frontend.

For the admin panel to show **any** tenant's data on demand, the backend needs one of:

1. **Admin-scoped endpoints** — a parallel `/admin/*` API family, authorized by an admin role (not tenant membership), where every call takes an explicit `tenantId`/`organizationId`:
   `GET /admin/tenants`, `GET /admin/tenants/:tenantId/agents`, `GET /admin/tenants/:tenantId/campaigns`, `GET /admin/tenants/:tenantId/billing`, etc.
2. **Impersonation tokens** — an endpoint that, given admin credentials + a target tenant id, mints a scoped access token so the admin panel can call the *exact same* endpoints documented below, unmodified.

**Recommendation: build the admin-scoped endpoint family (option 1).** It's safer (no risk of an admin action being misattributed to a real tenant session), it's auditable (every admin request is explicitly logged as an admin action against tenant X), and it maps cleanly 1:1 onto every module below — each tenant-facing endpoint gets an admin twin with a `tenantId` path/query param and admin-role auth instead of tenant-JWT auth.

Every module section below assumes this pattern: **`{tenant endpoint}` → admin equivalent is the same shape, scoped by an explicit `tenantId`.**

The Boss Admin Panel needs, at minimum, these top-level screens:
- **Tenant List** — every tenant on the platform, searchable/filterable, with a summary card (plan, agent count, call volume, last active, status).
- **Tenant Detail** — a single tenant's full activity, organized as the module tabs below (Overview, Agents, Calls, Campaigns, Contacts, Analytics, Billing, Integrations, Installed Apps, Team, Settings).

---

## 1. Tenant Overview (new — the admin panel's home screen for a tenant)

**What the Boss sees:** A single summary screen when they click into a tenant — the "at a glance" view before drilling into any module.

**Proposed fields (assembled from the modules below, one rollup call or a composed dashboard):**
```ts
TenantOverview = {
  tenant: {
    id, companyName, industry, companySize, website, primaryRegion,
    ownerName, ownerEmail, createdAt, onboardingCompletedAt,
    accountStatus: 'active' | 'trial' | 'suspended' | 'churned',
  },
  plan: { name, price, billingCycle, status },              // see Section 10 Billing
  usage: {
    totalAgents, publishedAgents,
    totalCallsThisMonth, inboundCallsThisMonth, outboundCallsThisMonth,
    totalMinutesThisMonth,
    activeCampaigns,
    lastActivityAt,
  },
  installedApps: string[],                                   // app ids, see Section 12
  integrations: { google: boolean, googleSheets: boolean, zoho: boolean },
  alerts?: string[],                                          // e.g. "payment failed", "campaign blocked"
}
```
This is intentionally a rollup of data already defined in the sections below — the backend should compose it from the same sources, not invent a separate model.

---

## 2. Tenant Identity & Account (Auth)

**What the Boss sees:** Who this tenant is, their company profile, account status, and login/session activity.

**Tenant-side API (real):** `src/services/authAPI.ts`, `src/contexts/AuthContext.tsx`

| Purpose | Method + Path |
|---|---|
| Login | `POST /auth/login` |
| Register | `POST /auth/register` |
| Get current user | `GET /auth/me` |
| Get / update profile | `GET /users/profile`, `PUT /users/profile` |
| Onboarding record (company profile) | `POST /onboarding`, `GET /onboarding/:id/status`, `PUT /onboarding/:id`, `GET /onboarding/history` |

**Key data (`AuthResponse.user`):** `{id, email, fullName, profilePicture?, emailVerified, isOnboarded}`

**Onboarding record — the richest "who is this tenant" data:**
```ts
company_basics: { name, phone, company_size, website, industry[], business_regions, primary_region }
plan_details: { type, ai_employee_limit, monthly_price, billing_contact, billing_address }
ai_employees: [...]        // what agents they said they'd need at signup
knowledge_sources: [...]
instructions: [...]
targets: [...]
deployment_targets: [...]
consent_options: [...]
```

**Admin view should show:** company name/industry/size/region, account owner contact, signup date, onboarding answers (what they said they wanted vs. what they actually built — useful churn/upsell signal), email verification status.

**Admin-only additions needed (net-new):** account status (active/trial/suspended/churned) and the ability to suspend/reactivate a tenant — this doesn't exist in the tenant-facing app (a tenant can't suspend itself) and must be a new admin-only action + field.

---

## 3. Agents ("AI Employees")

**What the Boss sees:** Every AI agent this tenant has created — its channel (inbound/outbound/web), voice, publish status, and configuration.

**Tenant-side API (real):** `src/services/agentAPI.ts`

| Purpose | Method + Path |
|---|---|
| List agents | `GET /agents?gender&sort&search&page&limit&industry&business_process` |
| Get one agent | `GET /agents/:id` |
| Get agent config | `GET /agent-configs/:id` |
| Publish / unpublish status | via `POST /publications/publish` (tenant action; admin should be **read-only** here, see note below) |
| Agent's call sessions | `GET /agent-sessions/agent/:agentId?<filters>` |
| Session transcript | `GET /agent-sessions/:sessionId/transcripts` |
| Call/lead summary | `GET /leads/agent/:agentId` |
| TTS voice catalog (reference) | `GET /voice/catalog?provider=` |

**Key data — `ApiAgent`:**
```ts
ApiAgent = {
  id, name, status: 'Pending' | 'Published',
  personality, language?, voice,
  createdAt, updatedAt?,
  gender?, business_process?, industry?, sub_industry?,
  custom_instructions?, guardrails_level?, response_style?,
  max_response_length?, context_window?, temperature?,
  agent_type?: 'webrtc' | 'inbound' | 'outbound',   // the calling channel
  tts?: { provider: 'google_chirp'|'cartesia'|'openai', model, voice_id, language, speed, emotion_enabled, emotion_profile },
  greeting_message?: { [languageCode]: string },
  template?: { name, description, systemPrompt?, firstMessage?, closingScript?, ... },
  stats?: { conversations, successRate, avgResponseTime, activeUsers }
}
```

**Admin view should show:** full agent list per tenant with channel badges (inbound/outbound/web), publish status, voice/TTS provider, creation date, and — critically — a drill-in to that agent's call sessions and transcripts (see Section 4). `agent_type` is the field to filter/segment by when the Boss wants "show me all this tenant's outbound agents."

**Admin action needed (net-new):** the Boss likely needs the *ability* to force-unpublish a problem agent platform-wide, even though today only the tenant can publish/unpublish itself — flag as an admin-only write action if required.

---

## 4. Calls — Inbound, Outbound & All Call Activity

**What the Boss sees:** Every call this tenant has ever made or received, filterable by direction (inbound/outbound), agent, date range, status, with drill-in to full transcripts and recordings. This is likely the single most important screen in the whole admin panel.

**Tenant-side API (real) — two overlapping sources, both needed:**

**(a) Unified call history** — `src/services/contactsAPI.ts`
| Purpose | Method + Path |
|---|---|
| List call history | `GET /call-history?direction&agent_id&contact_id&phone_number&status&from&to&page&limit` |
| Call history by phone number | `GET /call-history/by-number/:phone` |
| Call history stats (rollup) | `GET /call-history/stats` |
| Get one call | `GET /call-history/:callId` |

```ts
CallHistoryItem = {
  id, call_id?, session_id?, agent_session_id?, room_name?, room_id?,
  direction: 'inbound' | 'outbound',   // <-- the field the admin filters on
  status,
  agent_id?, agent_name?, contact_id?, contact_name?,
  phone_number?, source_number?, language?,
  start_time?, end_time?, duration_seconds?
}
```

**(b) Raw telephony event feed** — `src/services/phoneNumbersAPI.ts`
| Purpose | Method + Path |
|---|---|
| Raw call log / webhook events | `GET /webhook/voicelink/call-logs?did_number&agent_id&event&page&limit` |

```ts
CallLogEntry = {
  _id, voicelink_unique_id,
  event: 'Initiated' | 'Ringing' | 'Connected' | 'Hangup' | 'Failed',
  call_type, did_number, caller_number,
  phone_number_id, agent_id, tenant_id,     // <-- has tenant_id natively
  duration_seconds, created_at
}
```

**(c) Full conversation transcripts** — `src/services/agentAPI.ts`
| Purpose | Method + Path |
|---|---|
| Session transcript (what was actually said) | `GET /agent-sessions/:sessionId/transcripts` |

**Admin view should show:**
- A call log table: direction (inbound/outbound), agent, contact, phone number, start/end time, duration, status/outcome — filterable by date range and direction, exactly like the tenant's own Analytics page but scoped by admin to any tenant.
- Click into any call → full transcript.
- `GET /call-history/stats` should back a summary widget (total calls, inbound vs outbound split, answered/no-answer/failed breakdown) without the admin panel needing to compute it client-side.
- Phone number inventory context (which DID took/made the call) — see Section 5.

---

## 5. Phone Numbers

**What the Boss sees:** Every phone number (DID) this tenant owns, which agent it's assigned to, and whether inbound/outbound is enabled on it.

**Tenant-side API (real):** `src/services/phoneNumbersAPI.ts`

| Purpose | Method + Path |
|---|---|
| List tenant's numbers | `GET /phone-numbers?page&limit&agent_id` |
| Get one number | `GET /phone-numbers/:id` |
| DID catalog (reference/pricing) | `GET /phone-numbers/did-types`, `GET /phone-numbers/catalog?type=` |

```ts
ProvisionedNumber = {
  _id, phone_number, display_name, provider,
  agent_id, outbound_agent_id?, tenant_id,          // <-- has tenant_id natively
  language, inbound_enabled, outbound_enabled?, recording_enabled,
  is_active, provisioned_at,
  livekit_trunk_id?, livekit_dispatch_rule_id?,
  voicelink_client_id?, voicelink_trunk_id?, voicelink_did_id?
}
```

**Admin view should show:** number inventory list — phone number, assigned agent, inbound/outbound enabled flags, recording enabled, active/inactive, date provisioned. Useful for both support ("why isn't this tenant receiving calls") and revenue tracking (numbers = a billable resource).

---

## 6. Campaigns (Outbound Calling)

**What the Boss sees:** Every outbound calling campaign — status, progress, contact list size, call results — across this tenant's history, not just currently running ones.

**Tenant-side API (real):** also `src/services/phoneNumbersAPI.ts`

| Purpose | Method + Path |
|---|---|
| List campaigns | `GET /campaigns` |
| Get one campaign | `GET /campaigns/:id` |
| Live status/dialer stats | `GET /campaigns/:id/status` |
| List campaign's contacts + outcomes | `GET /campaigns/:id/contacts?status&page&limit` |

```ts
Campaign = {
  _id, agent_id, name, caller_number, language, max_concurrent,
  status: 'draft' | 'running' | 'paused' | 'completed' | 'stopped' | 'archived' | 'scheduled',
  objective?, goal?,
  scheduled_at?, end_date?, timezone?,
  recurrence?: 'none' | 'daily' | 'weekly',
  calls_per_minute?, daily_limit?, priority?,
  tenant_id?,                                          // <-- has tenant_id natively (optional field)
  created_at?, updated_at?, started_at?, completed_at?, archived_at?,
  preflight_status?: 'passed' | 'blocked' | 'pending',
  preflight_blockers?, last_preflight_at?,
  stats?: { total, pending, dialing, answered?, completed, failed?, no_answer, voicemail? }
}
```

**Admin view should show:** campaign list with status and live stats (total/completed/failed/no-answer), a progress bar for running campaigns, and — importantly — `preflight_status`/`preflight_blockers`, since that tells the Boss *why* a tenant's campaign can't start (e.g. no number assigned, no contacts uploaded) without needing to ask the tenant.

---

## 7. Contacts

**What the Boss sees:** This tenant's contact/address book — independent of any single campaign.

**Tenant-side API (real):** `src/services/contactsAPI.ts`

| Purpose | Method + Path |
|---|---|
| List contacts | `GET /contacts?page&limit&search&phone_number&direction&agent_id&include_inactive` |
| Get one contact | `GET /contacts/:id` |

```ts
TenantContact = {
  id, _id?, name, phone_number, email?,
  direction?: 'inbound' | 'outbound' | 'both',
  agent_id?, phone_number_id?, language?, custom_fields?,
  is_active?, created_at?, updated_at?
}
```

**Admin view should show:** contact count and list, with a link from each contact to their full call history (reuses Section 4's `contact_id` filter on `/call-history`).

---

## 8. Analytics

**What the Boss sees:** The same call/session analytics a tenant sees about themselves, available for any tenant — call volume trends, agent performance, transcripts.

**Tenant-side API (real):** built on Agents + Contacts endpoints, no separate analytics service:
- `GET /agent-sessions/agent/:agentId` — sessions per agent
- `GET /agent-sessions/:sessionId/transcripts` — full transcript
- `GET /call-history/stats` — call volume/outcome rollup (Section 4)

**Admin view should show:** per-tenant dashboards for call volume over time, inbound vs outbound split, per-agent performance (success rate, avg response time, from `ApiAgent.stats`), and a searchable transcript archive. This is effectively "give the Boss the tenant's own Analytics + Training screens, for any tenant."

---

## 9. Monitoring (real-time / live calls)

**Current tenant-side status:** UI shell only — `Monitoring.tsx` has no backend wired up (hardcoded mock recording URL). **This needs to be built**, both for the tenant app and the admin panel, since "see a tenant's live/in-progress calls right now" is a natural Boss requirement.

**Proposed data shape (net-new, to design with backend):**
```ts
LiveCallSnapshot = {
  callId, tenantId, agentId, agentName,
  direction: 'inbound' | 'outbound',
  phoneNumber, contactName?,
  status: 'ringing' | 'connected' | 'wrapping-up',
  startedAt, durationSeconds,
  roomName,                          // LiveKit room, for potential live listen-in
}
```

**Admin view should show:** a live table of all currently-active calls across the platform (or filtered to one tenant), ideally with a "listen in" capability if the underlying LiveKit room supports admin join — flag this as requiring backend/LiveKit design work, not something to copy from existing code.

---

## 10. Billing / Subscription

**Current tenant-side status:** UI shell only — `Billing.tsx` is 100% hardcoded mock data, no backend. **This is one of the most important gaps to close**, since "how much is this tenant paying, what's their usage against their plan" is a core Boss requirement. Design fresh, for both tenant and admin use.

**Proposed data shape (net-new, to design with backend):**
```ts
TenantBilling = {
  plan: { id, name, monthlyPrice, billingCycle: 'monthly' | 'yearly', aiEmployeeLimit, minutesIncluded },
  subscriptionStatus: 'active' | 'trial' | 'past_due' | 'cancelled',
  currentPeriod: { start, end },
  usage: {
    agentsUsed, agentsLimit,
    minutesUsed, minutesIncluded, overageMinutes,
    callsThisPeriod,
  },
  paymentMethod?: { brand, last4, expiryMonth, expiryYear },
  invoices: [{ id, date, amount, status: 'paid' | 'failed' | 'pending', pdfUrl? }],
  mrr: number,          // admin-only rollup field, not shown to tenant
}
```

**Admin view should show:** current plan, usage-against-limits (agents, minutes, calls), payment method on file, invoice history with status, and MRR contribution — the last field (`mrr`) only makes sense in the admin panel, useful for a platform-wide revenue dashboard aggregating across all tenants.

---

## 11. Integrations (Google, Google Sheets, Zoho CRM, Google Calendar)

**What the Boss sees:** Which third-party integrations this tenant has connected, and their status.

**Tenant-side API (real):** `src/services/authAPI.ts`

| Purpose | Method + Path |
|---|---|
| OAuth connection status (Google/Gmail/Sheets) | `GET /oauth/status` → `{provider, email?, status, credential_id?}[]` |
| Google Sheets discovery | `GET /integrations/service/google_sheets/discover?ownedOnly=` |
| Zoho CRM status | `GET /auth/zoho/status` → `ZohoConnection` |
| Google Calendar status | `GET /auth/gc/status` → `GoogleCalendarConnection` |

```ts
ZohoConnection = {
  connected: boolean,
  status: 'active' | 'expired' | 'revoked' | null,
  apiDomain: string | null,
  scopes: string[],
  expiresAt: string | null, createdAt: string | null, updatedAt: string | null,
}

GoogleCalendarConnection = {
  connected: boolean,
  status: 'active' | 'expired' | 'revoked' | null,
  email: string | null,
  googleAccountId: string | null,
  scopes: string[],
  expiresAt: string | null, createdAt: string | null, updatedAt: string | null,
}
```

Google Calendar OAuth (own `/auth/gc/*` namespace, mirrors the Zoho pattern): connect is a full-page redirect (`GET /auth/gc/connect?token=`), status/disconnect (`DELETE /auth/gc/disconnect`) use Bearer auth. **Auth-only today — no calendar event/sync/webhook APIs exist yet**, same scope caveat as Zoho CRM. The backend's authorized Google redirect URI is actually the Gmail callback path (`/gmail-auth/callback`) — it disambiguates Calendar vs. Gmail OAuth via the `state` param — a backend implementation detail with no admin-panel impact since the frontend never touches that path either way.

**Admin view should show:** an integrations checklist per tenant — Google: connected/not, Google Sheets: connected + sheet count, Zoho CRM: connected/not + status + scopes, Google Calendar: connected/not + status + connected email + scopes. Useful for support ("tenant says their CRM/calendar sync isn't working — is it even connected?"). Since Appointment CRM (Section 14) is the module most likely to want calendar sync once event APIs exist, cross-reference the two when Boss is investigating a tenant using both.

---

## 12. Installed Apps (Marketplace)

**Current tenant-side status:** app catalog is a static file; "installed" state is **stored only in the tenant's browser localStorage** (`shivai_installed_apps_<userId>`), not on the server at all. **This must move server-side** for the admin panel to see it — there is currently no way for any backend or admin view to know what apps a tenant has installed, since it never left the browser.

**Existing app catalog** (`src/marketplace/apps.ts`) — reference for what "apps" exist:
`website-builder`, `google-sheets`, `support-crm`, `lead-crm`, `appointment-crm`, `campaign-crm`, `healthcare-crm`, `ai-receptionist`, `feedback-reviews` — each with `{id, name, category, status: 'live'|'coming-soon', pricing: 'Free'|'Included'|'Premium'}`.

**Proposed data shape (net-new — a real backend record):**
```ts
TenantInstalledApp = {
  tenantId, appId, appName,
  installedAt, installedBy,
  status: 'active' | 'uninstalled',
  pricingTier: 'Free' | 'Included' | 'Premium',
}
```

**Admin view should show:** which apps each tenant has installed, when, and their pricing tier — directly answers "what is this tenant actually using on the platform."

---

## 13. Support CRM (if a tenant has it installed)

**Current tenant-side status:** 100% mock/demo data, no backend at all (`mockData.ts`). Models departments, agents-as-employees, a customer 360 view, and tickets/inquiries with SLA. **Needs a real backend before any admin visibility is possible.**

**Proposed data shape (net-new, matching the existing mock's shape so the eventual real build doesn't require a UI rewrite):**
```ts
SupportTicket = {
  id, tenantId, customerId, customerName,
  subject, status: 'open' | 'pending' | 'resolved' | 'closed',
  priority: 'low' | 'medium' | 'high' | 'urgent',
  assignedAgentId?, departmentId?,
  slaDeadline?, createdAt, updatedAt, resolvedAt?,
}
```

**Admin view should show (once backend exists):** ticket volume and SLA compliance per tenant — flag as lower priority than the live modules above.

---

## 14. Appointment CRM / Doctor Calendar (if a tenant has it installed)

**Current tenant-side status:** fully live, the most mature module on the platform — good template for how a "module admin view" should look.

**Tenant-side API (real):** `src/ClientDashboard/apps/AppointmentCRM/api/index.ts`, full contract also documented in-repo at `src/ClientDashboard/apps/AppointmentCRM/APPOINTMENT_CRM_API_SPEC.md`.

| Purpose | Method + Path |
|---|---|
| Bootstrap (everything in one call) | `GET /org/bootstrap` |
| Branches | `GET/POST /branches`, `GET/PATCH/DELETE /branches/:id` |
| Staff | `GET/POST /staff`, `GET/PATCH/DELETE /staff/:id` |
| Bookings | `GET/POST /bookings`, `GET/PATCH/DELETE /bookings/:id` |
| Customers | `GET/POST /customers`, `GET/PATCH /customers/:id`, `GET /customers/:id/bookings` |
| Analytics overview (ready-made rollup) | `GET /analytics/overview?branchId` |

```ts
ApiAnalyticsOverview = {
  bookings: { total, today, confirmed, pending, completed, cancelled, noShow },
  staff: { total }, customers: { total }
}
ApiBooking = {
  id, branchId?, staffId?, customer, phone?, email?, serviceId?, date, time,
  status: 'confirmed' | 'pending' | 'checked-in' | 'completed' | 'cancelled' | 'no-show',
  channel?: 'voice' | 'web' | 'whatsapp' | 'walk-in',
}
```

**Admin view should show:** for tenants using this app — branch/staff counts, booking volume and status breakdown (straight from `GET /analytics/overview`), customer count. This endpoint is already a near-perfect admin summary card, ready to reuse as-is with tenant scoping added.

---

## 15. Team & Access (who has access to this tenant's account)

**Current tenant-side status:** UI exists (`Settings.tsx` "Team" tab) but is 100% hardcoded mock data — `{id, name, email, role, status, lastActive}` — no backend API. **Needs to be built.**

**Proposed data shape (net-new):**
```ts
TeamMember = {
  id, tenantId, name, email,
  role: 'Admin' | 'Editor' | 'Viewer',
  status: 'Active' | 'Invited' | 'Suspended',
  lastActiveAt, invitedAt,
}
```

**Admin view should show:** who has login access to each tenant's account and their role — important for support/security investigations (e.g. "who at this tenant made this change").

---

## 16. API Keys

**Current tenant-side status:** UI exists but mock only — `{id, name, key, created, lastUsed, permissions[]}` — no backend.

**Admin view should show:** API key names, creation/last-used dates, and permissions **without ever displaying the actual key value** (same principle as Zoho tokens — the admin panel should never surface raw secrets, only metadata). Flag key-value display as an explicit non-requirement/anti-requirement when this is built.

---

## Full Route Table (tenant-facing app, for reference only — admin panel will have its own routes)

**Protected app routes:** `/dashboard`, `/agents`, `/agents/create`, `/agents/:id`, `/agents/:id/edit`, `/agents/:id/train`, `/training`, `/call-setup`, `/workflows`, `/campaigns/:campaignId`, `/contacts/:contactId/call-history`, `/marketplace`, `/marketplace/:appId`, `/analytics`, `/monitoring`, `/billing`, `/settings`, `/google-sheets`, `/google-sheets/:id/view`, `/zoho`, `/app/:appId`

---

## Build Priority (what to wire up first, and why)

| # | Module | Backend Status | Why this priority |
|---|---|---|---|
| 1 | Tenant Scoping (Section 0) | Net-new | Nothing else works without this |
| 2 | Tenant Identity/Account | ✅ Live | Needed for the tenant list/picker itself |
| 3 | Agents | ✅ Live | Core entity, everything else references it |
| 4 | Calls (inbound/outbound/transcripts) | ✅ Live | The Boss's #1 ask — richest existing data |
| 5 | Phone Numbers | ✅ Live | Small, supports the Calls view |
| 6 | Campaigns | ✅ Live | High visibility, live status already exists |
| 7 | Contacts | ✅ Live | Supports Calls drill-in |
| 8 | Analytics | ✅ Live (composed) | Mostly a UI layer over #4 |
| 9 | Appointment CRM | ✅ Live | Best-documented module, easy win if tenants use it |
| 10 | Integrations | ✅ Live | Small, quick to add |
| 11 | Billing | ❌ Net-new | High business value, needs backend design |
| 12 | Installed Apps | ❌ Net-new (move off localStorage) | Needed for "what does this tenant use" |
| 13 | Monitoring (live calls) | ❌ Net-new | Nice-to-have, real-time is more complex to build |
| 14 | Team & Access | ❌ Net-new | Support/security value |
| 15 | Support CRM | ❌ Net-new | Only matters for tenants who adopt this app |
| 16 | API Keys | ❌ Net-new | Lowest priority, metadata-only |
