# ShivAI — Permission Modules (frontend source of truth)

The frontend gates every surface on **fine-grained permission keys** shaped as:

```
module:<module>
module:<module>.page:<page>
module:<module>.page:<page>.action:<action>
```

- A user's granted permissions are a **flat array of these keys**.
- The array is stored on the user's `Permission` record and MUST be returned on **`GET /auth/me`** at login (under `permission.permissions` / `permissions.permissions`).
- Deny-by-default: if a key is not present, the frontend hides that surface. Granting a page/action implies its module is on.
- **`module:dashboard`** (and all its keys) is **always granted / locked on** — everyone has it; it cannot be toggled off.
- These are the SAME keys used for both **sub-tenants** (create body `permissions[]`, update `permissions[]`) and **staff** members.

Source of truth: `src/permissions/registry.ts`.

---

## Full key list

### module:dashboard — Dashboard  *(always-on / locked)*
- `module:dashboard`
- `module:dashboard.page:overview`

### module:employees — AI Employees
- `module:employees`
- `module:employees.page:list`
  - `module:employees.page:list.action:create`
  - `module:employees.page:list.action:delete`
- `module:employees.page:edit-agent`
  - `module:employees.page:edit-agent.action:regenerate-template`
  - `module:employees.page:edit-agent.action:improve-with-ai`
  - `module:employees.page:edit-agent.action:delete`
- `module:employees.page:training`

### module:staff — Staff  *(manages other people — owners/managers only)*
- `module:staff`
- `module:staff.page:list`
  - `module:staff.page:list.action:invite`
  - `module:staff.page:list.action:manage-access`

### module:command-center — Command Center
- `module:command-center`
- `module:command-center.page:calls`
- `module:command-center.page:leads`
- `module:command-center.page:follow-ups`
- `module:command-center.page:activity`

### module:call-setup — Call Setup
- `module:call-setup`
- `module:call-setup.page:inbound`
- `module:call-setup.page:outbound`
  - `module:call-setup.page:outbound.action:launch-campaign`

### module:workflows — Workflows
- `module:workflows`
- `module:workflows.page:canvas`
- `module:workflows.page:documents`

### module:marketplace — Feature Marketplace
- `module:marketplace`
- `module:marketplace.page:browse`
- `module:marketplace.page:zoho`
- `module:marketplace.page:google-calendar`

### module:analytics — Analytics & Call History
- `module:analytics`
- `module:analytics.page:overview`

### module:monitoring — Monitoring & Reports
- `module:monitoring`
- `module:monitoring.page:overview`

### module:billing — Billing
- `module:billing`
- `module:billing.page:overview`

### module:sub-tenants — Sub Tenants  *(main-business only)*
- `module:sub-tenants`
- `module:sub-tenants.page:list`
  - `module:sub-tenants.page:list.action:create`
  - `module:sub-tenants.page:list.action:manage`

### module:settings — Settings
- `module:settings`
- `module:settings.page:profile`
- `module:settings.page:security`
- `module:settings.page:team`
- `module:settings.page:api`
- `module:settings.page:accounts`

---

## Default access for a NEW sub-tenant
Sent as `permissions[]` on `POST /tenants` when no explicit overrides are given
(matches `DEFAULT_SUB_TENANT_PERMISSIONS`). Note: Call Setup WITHOUT number purchase.

```
module:employees
module:employees.page:list
module:employees.page:list.action:create
module:employees.page:edit-agent
module:employees.page:edit-agent.action:improve-with-ai
module:employees.page:training
module:call-setup
module:call-setup.page:inbound
module:call-setup.page:outbound
module:call-setup.page:outbound.action:launch-campaign
module:command-center
module:command-center.page:calls
module:command-center.page:leads
module:command-center.page:follow-ups
module:command-center.page:activity
module:staff
module:staff.page:list
module:staff.page:list.action:invite
module:staff.page:list.action:manage-access
module:analytics
module:analytics.page:overview
module:billing
module:billing.page:overview
module:settings
module:settings.page:profile
module:settings.page:security
```
(`module:sub-tenants` is intentionally excluded — main-business only.)

---

## Sub-tenant scope (for Staff)
A staff member also has a **sub-tenant scope** — which sub-tenants they can
manage / whose Command Center data they see. Shared across the Sub Tenants and
Command Center modules:

- `managed_sub_tenant_ids: string[]`
- Empty array `[]` = **all** sub-tenants (current and future).
- Non-empty = restricted to exactly those sub-tenant ids.

---

## Notes for backend
- Treat these keys as opaque strings; store & return them verbatim.
- `GET /auth/me` must return the current user's granted `permissions[]` (fine-grained keys above), their `role` (`{ key, description }`), and — for sub-tenants — `parentTenantId` so the frontend can resolve tenant context.
- Sub-tenant create/update already send `permissions[]` + `max_employees` (snake_case).
- Staff endpoints don't exist yet; when built, persist per-staff `permissions[]` + `managed_sub_tenant_ids[]`, and return the staff member's `permissions[]` on their own `GET /auth/me` so their session is gated correctly.
