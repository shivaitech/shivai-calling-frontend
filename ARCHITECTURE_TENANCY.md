# ShivAI — Tenancy Architecture (Main Tenant · Sub-Tenant · Staff)

This document describes how the **frontend** models and drives the multi-tenant
system, and exactly what it sends to / expects from the backend. It is the
contract the backend must satisfy for the UI to behave correctly.

Audience: backend engineers/AI implementing or reviewing the APIs.

---

## 1. The three account kinds

| Kind | What it is | JWT identity | Frontend role (`tenantRole`) |
|---|---|---|---|
| **Main tenant** | The root business account (e.g. "Celebfie"). Owns everything. | its own user id | `MAIN_OWNER` (fail-open) |
| **Sub-tenant** | A business under a main tenant (e.g. a celebrity). A `User` with `parentTenantId`. | its own user id | `SUBTENANT_OWNER` / `SUBTENANT_MEMBER` |
| **Staff** | A delegated human who operates ON one or more accounts. A `User` with **no** `parentTenantId`. | its own user id | `STAFF` |

The frontend resolves the kind from **`GET /auth/me`** after login (the login
response does NOT carry role/permissions — `permission` is null there).

---

## 2. The data-ownership model (backend, as the FE assumes)

Every scoped record (agents, campaigns, contacts, call-history, phone-numbers,
leads, contact-batches) carries **two** ownership fields:

```
tenant_id      // ALWAYS the ROOT tenant id — never a sub-tenant's user id
sub_tenant_id  // the owning sub-tenant, or null when the main tenant owns it directly
```

Visibility:

| Caller | Sees |
|---|---|
| Main tenant | own records + every sub-tenant's (whole org) |
| Sub-tenant | only records stamped with their own id |
| Staff | whatever their acting-tenant + optional `sub_tenant_id` selects (acts as the main tenant) |

> **Critical:** `tenant_id` = root tenant. The FE must NOT compare `tenant_id`
> to the logged-in user id to decide ownership — it uses `sub_tenant_id`.

---

## 3. `GET /auth/me` — the source of truth

The FE calls this right after login (and on every reload) to learn the account
kind, permissions, and — for staff — which accounts they may act on.

### Main tenant / sub-tenant
```jsonc
{ "data": {
  "user": { "id", "email", "fullName", "parentTenantId": null|<parentId> },
  "permissions": {            // NOTE: key is "permissions" (plural) on /auth/me
    "role": { "key": "tenant" | "sub-tenant" },
    "permissions": ["module:employees", "module:employees.page:list", ...],
    "tenantId": "<self or parent>",
    "subTenantId": null | "<self>"
  },
  "tenantDetails": { ... },   // business profile (see §8)
  "role": "tenant" | "sub-tenant",
  "roleId": "..."
}}
```
- A **sub-tenant** is detected by `user.parentTenantId` OR `permissions.subTenantId` OR `role === "sub-tenant"`.

### Staff
```jsonc
{ "data": {
  "user": { "id", "email", "fullName" },
  "permissions": {
    "role": { "key": "staff" },
    "role_name": "Operations Lead",           // free-text display label
    "permissions": [ "module:command-center-read-subtenant-(id1,id2)", ... ],
    "accounts": [ { "tenantId": "<parent>", "subTenantId": null|"<sub>" }, ... ]
  },
  "role": "staff"
}}
```
- The FE uses `accounts[0].tenantId` as the staff's **acting parent tenant**.

---

## 4. How the FE scopes each API call (THE CORE CONTRACT)

There are exactly three mechanisms. The backend must honor all three.

### (a) Main tenant — no extra scoping by default
Normal calls with the main tenant's Bearer token → whole-org data.
When the main tenant opens a **sub-tenant's** module, the FE adds a query param:
```
?sub_tenant_id=<subTenantId>   // that one sub-tenant
?sub_tenant_id=none            // the main tenant's OWN records only
(omitted)                      // whole org, combined
```
Applies to: `/agents`, `/campaigns`, `/call-history`, `/call-history/stats`,
`/leads`, `/leads/stats`, `/contact-batches`.

### (b) Real sub-tenant — auto-scope to self
A logged-in sub-tenant's list/action calls automatically carry
`?sub_tenant_id=<their own id>`. (Their JWT also scopes them server-side; the
explicit param is belt-and-suspenders and must be accepted.) The backend must
still reject/ignore any attempt by a sub-tenant to widen scope.

### (c) Staff — acting-context headers + drill-down param
Staff act **as the main (parent) tenant**. Every authenticated request carries:
```
X-Acting-Tenant-Id: <parent tenant user id>     // from accounts[0].tenantId
```
(No `X-Acting-Sub-Tenant-Id` in normal operation.) The backend resolves the
staff's scope to that parent tenant on **every** protected route.

To monitor a specific sub-tenant (Command Center / Sub Tenants), the staff
selects one and the FE adds `?sub_tenant_id=<id>` — exactly like the main tenant
drilling in. So staff = "main tenant, but pinned to X-Acting-Tenant-Id, and only
to the modules they were granted."

> Summary the backend must implement:
> - Read `X-Acting-Tenant-Id` (staff) to resolve the operating tenant.
> - Read `?sub_tenant_id` (`<id>` | `none` | absent) as the shared drill filter.
> - Derive `sub_tenant_id` from the caller's own token for a real sub-tenant.
> - Stamp new records with `tenant_id` = root tenant, `sub_tenant_id` = the
>   scope in play (or null for the main tenant's own).

---

## 5. Permissions (RBAC) — fine-grained keys

The whole UI gates on **fine-grained permission keys**:
```
module:<module>
module:<module>.page:<page>
module:<module>.page:<page>.action:<action>
```
- Returned in `permissions.permissions[]` on `/auth/me`; the FE builds a grant
  map and shows/hides modules, pages, actions, and route-guards accordingly.
- **Deny-by-default** for sub-tenants and staff; **fail-open** for main tenant.
- `module:dashboard` is always-on for sub-tenants (locked), but **grantable**
  for staff.
- Full key list: see `PERMISSION_MODULES.md`.

### Sub-tenant SCOPE encoded INTO permission strings (staff)
For the two scope-aware modules (`module:command-center`, `module:sub-tenants`),
the staff's selected sub-tenants are encoded as a suffix on the granted keys:
```
module:command-center-read-subtenant-(id1,id2)   // only those sub-tenants
module:command-center-read-subtenant-(all)       // every sub-tenant
```
The FE strips this suffix when reading grants back (to match the registry) and
re-parses it to prefill the "All / Select sub-tenants" picker per module. The
backend should store these strings verbatim in `permissions[]`.

---

## 6. Sub-Tenants API (`/tenants`) — managed by the main tenant

| Method | Path | Notes |
|---|---|---|
| GET | `/tenants` | List sub-tenants of the caller's tenant. **`tenant_id` query removed** — parent comes from token / `X-Acting-Tenant-Id`. Returns `data.subTenants[]` + `meta.pagination`. |
| POST | `/tenants` | Create sub-tenant. Body includes `email, fullName, password, roleId, businessName, industry, phone, address, city, state, zip, country, website, description, logo, max_employees` (snake_case), and `permissions[]` (fine-grained default set). Never send `parentTenantId`/`tenant_id`. |
| GET | `/tenants/:id` | Bundle `{ user, permission, tenantDetail }`. |
| PUT | `/tenants/:id` | Update user/business/permission fields. `permissions[]` replaces grants. `max_employees` snake_case. |
| DELETE | `/tenants/:id` | Soft-delete (sets `user.isActive=false`). |

Response bundle keys: `data.user`, `data.permission`, `data.tenantDetail`.
`max_employees` caps a sub-tenant's agent creation (enforced on
`POST /agents/create-agent` → `403 Agent limit reached (N)`).

---

## 7. Staff API (`/staff`) — managed by the main tenant

A staff member is an independent `User`; access is a list of accounts + grants.

| Method | Path | Notes |
|---|---|---|
| GET | `/staff` | List staff the caller manages. `page, limit, search, includeInactive`. |
| POST | `/staff` | Create. Body: `fullName, email, password, role_name, sendInvite, accounts[]{tenantId,subTenantId}, permissions[]`. Tenant caller: each account `{ tenantId: <caller id>, subTenantId: <sub> }`. No `roleId` (server assigns the `staff` role). |
| GET | `/staff/:id` | Full record. |
| PUT | `/staff/:id` | Update `fullName, role_name, permissions[], accounts[]`. |
| DELETE | `/staff/:id` | Soft-delete. |

- `role_name` is a free-text label (e.g. "Lead Manager").
- `accounts[]` = which orgs the staff may act on; the FE uses these to send
  `X-Acting-Tenant-Id` and to build the account/scope pickers.
- Password rule (create): 8+ chars, upper + lower + digit + special `@$!%*?&`.
- The FE currently sends the fine-grained `permissions[]` (with the sub-tenant
  scope suffix for command-center/sub-tenants keys). Store verbatim.
- **Staff login** must return `role: "staff"`, `permissions[]`, and `accounts[]`
  on `/auth/me` so the FE can gate modules and set the acting tenant.

---

## 8. Business profile (TenantDetail)

Both main tenant and sub-tenant have a business profile. On `/auth/me` it may
arrive as `tenantDetails` (plural) nested under `user` or at top level, with
mixed casing. Fields: `businessName, industry, phone, address, city, state,
zip, country, logo, website, description, max_employees` (also seen as
`max_agents`), `plan_id`, timestamps. The FE normalizes both cases.

- Main tenant edits it via `PUT /users/profile`.
- Sub-tenant's is edited by the main tenant via `PUT /tenants/:id`.

---

## 9. Agents — scoping specifics

- `GET /agents` — main tenant gets the whole org; sub-tenant gets their own;
  supports `?sub_tenant_id=<id>|none`. Each agent returns `tenant_id` (root) +
  `sub_tenant_id`.
- `POST /agents/create-agent` — server stamps ownership from scope; the FE sends
  `sub_tenant_id` in the body when a main tenant creates for a sub-tenant.
  Enforces `max_employees` → `403 Agent limit reached (N)`.
- `GET /agent-configs/:id`, `PUT /agents/:id`, `DELETE /agents/:id`,
  `POST /publications/publish` — permission by **ownership** (scope), not by
  `created_by`. A main tenant may edit/delete a sub-tenant's agent and vice-versa.
- `GET /agents/all` and `/agents/stats` are **admin-only** (403 otherwise); the
  FE uses `GET /agents` for the org list.

---

## 10. Call Setup, Campaigns, Call History — scoping

- **Phone numbers are org-level** (shared). A sub-tenant sees the main tenant's
  numbers and may use them as `caller_number`.
- **Campaigns** are "for" whichever account owns the dialing agent; picking a
  sub-tenant's agent files the campaign under that sub-tenant. Response carries
  `tenant_id`, `sub_tenant_id`, `created_by`, `run_by`.
- **Call history** is scoped by the agents you can see (fixes the inbound/outbound
  split). Supports `?sub_tenant_id`. Each row returns `sub_tenant_id`.
- The FE's Call Setup, Command Center, and Analytics pass `sub_tenant_id` when
  viewing a sub-tenant (main tenant or staff), and auto-scope for a real
  sub-tenant.

---

## 11. What the frontend sends — quick reference

| Scenario | Bearer | Extra scoping the FE adds |
|---|---|---|
| Main tenant, own view | main token | — |
| Main tenant, sub-tenant module | main token | `?sub_tenant_id=<id>` (+ create sends `sub_tenant_id` in body) |
| Sub-tenant, any view | sub-tenant token | `?sub_tenant_id=<own id>` on list/action calls |
| Staff, any view | staff token | `X-Acting-Tenant-Id: <parent>` on all requests |
| Staff, Command Center / Sub Tenants drill | staff token | `X-Acting-Tenant-Id` + `?sub_tenant_id=<id>` |

---

## 12. Backend checklist

- [ ] `/auth/me` returns role (`tenant`/`sub-tenant`/`staff`/`admin`), fine-grained `permissions[]`, `parentTenantId` (sub-tenant), `accounts[]` (staff), and `tenantDetails`.
- [ ] Every scoped record has `tenant_id` (root) + `sub_tenant_id`.
- [ ] Honor `?sub_tenant_id=<id>|none|absent` on agents, campaigns, call-history(+stats), leads(+stats), contact-batches.
- [ ] Resolve staff scope from `X-Acting-Tenant-Id` on ALL protected routes.
- [ ] A real sub-tenant token scopes to itself and cannot widen scope.
- [ ] `/tenants` ignores/removes `tenant_id` query; parent from token/acting header.
- [ ] `/staff` CRUD stores `accounts[]` + `permissions[]` (with sub-tenant scope suffix) verbatim; login exposes them.
- [ ] `max_employees` enforced on agent creation (`403 Agent limit reached (N)`).
- [ ] `create-agent` / `PUT` / `DELETE` / config / publish authorize by ownership scope, not `created_by`.
- [ ] Store `max_employees` snake_case on TenantDetail; accept it on tenant create/update.

See also: `PERMISSION_MODULES.md` (full permission keys), `API_ENDPOINTS.md`
(every endpoint the FE calls).
