# Sub-tenants and Roles — overview

Tenant-facing APIs for **team members (sub-tenants)** and **role templates**. Detailed endpoint docs:

| Topic | Document |
|---|---|
| Sub-tenant CRUD | [sub-tenants-api.md](./sub-tenants-api.md) |
| Role CRUD | [roles-api.md](./roles-api.md) |

**Not** the admin panel: `/api/v1/admin/tenants` manages top-level tenant users ([admin doc](./admin-tenants-and-agents-api.md)).

## Base URL

```text
{API_BASE}/api/v1
```

| Resource | Prefix |
|---|---|
| Sub-tenants | `/tenants` |
| Roles | `/roles` |

## How the pieces fit together

```text
Parent tenant (User)
  ├── Permission (tenantId = parent._id, sub_tenantId = null, role → tenant)
  ├── TenantDetail (tenant_id = parent._id) — parent's business profile
  └── Sub-tenants (User with parentTenantId = parent._id)
        ├── Permission (tenantId = parent._id, sub_tenantId = sub._id, role → chosen template)
        └── TenantDetail (tenant_id = sub._id) — sub-tenant's own business profile
```

- **User** — authentication identity (email/password).
- **Role** — reusable template (`default_modules`, `default_actions`, `default_permissions`).
- **Permission** — binds a user to a role with effective grants; cached in Redis for middleware.
- **TenantDetail** — business metadata per user (parent and each sub-tenant have their own).

Sub-tenants do **not** use a separate `Sub_Tenant` collection.

## Permission model

Modules: `users`, `roles`, `permissions`, `tenants`, `settings`

Actions: `create`, `read`, `update`, `delete`

Effective grant strings: `module:action` (e.g. `tenants:create`).

### Route enforcement

Routes use `requirePermission('module:action')` after `authenticate()`. Users with Permission → Role key `admin` bypass checks. Everyone else needs the string in their cached `Permission.permissions` array.

| Area | Example permission |
|---|---|
| Sub-tenant create | `tenants:create` |
| Sub-tenant list/get | `tenants:read` |
| Sub-tenant update | `tenants:update` |
| Sub-tenant delete | `tenants:delete` |
| Role management | `roles:create`, `roles:read`, `roles:update`, `roles:delete` |

### Resolving permissions at login

1. **Platform admin** — `Permission` with Role key `admin` (`tenantId = userId`, `sub_tenantId` null); full access.
2. **Parent tenant** — `Permission` where `tenantId = userId` and `sub_tenantId` is null.
3. **Sub-tenant** — `Permission` where `tenantId = parentTenantId` and `sub_tenantId = userId`.

Permissions are cached in Redis after login (`cachePermissionsForUser`) and checked by `requirePermission` middleware.

## Seeded roles

| Key | Description |
|---|---|
| `admin` | Full modules and actions |
| `tenant` | Full access for parent tenant accounts |
| `sub-tenant` | `users`, `tenants`, `settings` with `read` + `update` |

## Backfilling existing users

Users created before the permission system may lack a `Permission` row. Run:

```bash
# Preview
npm run seed:permissions

# Apply
npm run seed:permissions -- --confirm
```

This creates `Permission` documents for non-admin users: `tenant` role for parent accounts, `sub-tenant` role for users with `parentTenantId`. Platform admins are skipped.

## Quick endpoint map

| Method | Path | Doc |
|---|---|---|
| `POST` | `/api/v1/tenants` | [Create sub-tenant](./sub-tenants-api.md#create-sub-tenant) |
| `GET` | `/api/v1/tenants` | [List](./sub-tenants-api.md#list-sub-tenants) |
| `GET` | `/api/v1/tenants/:id` | [Get](./sub-tenants-api.md#get-sub-tenant) |
| `PUT` | `/api/v1/tenants/:id` | [Update](./sub-tenants-api.md#update-sub-tenant) |
| `DELETE` | `/api/v1/tenants/:id` | [Soft-delete](./sub-tenants-api.md#soft-delete-sub-tenant) |
| `GET` | `/api/v1/roles/options` | [Options](./roles-api.md#get-permission-options) |
| `POST` | `/api/v1/roles` | [Create role](./roles-api.md#create-role) |
| `GET` | `/api/v1/roles` | [List roles](./roles-api.md#list-roles) |
| `GET` | `/api/v1/roles/:id` | [Get role](./roles-api.md#get-role) |
| `PUT` | `/api/v1/roles/:id` | [Update role](./roles-api.md#update-role) |
| `DELETE` | `/api/v1/roles/:id` | [Soft-delete role](./roles-api.md#delete-role-soft-delete) |

## Frontend checklist

- [ ] `/api/v1/tenants` = sub-tenants; `/api/v1/admin/tenants` = admin tenant users
- [ ] Sub-tenant responses use `{ user, permission, tenantDetail }` — not `subTenant`
- [ ] Sub-tenant create requires `roleId` + business fields (`businessName`, `industry`, `phone`, …)
- [ ] `phone` is digits only
- [ ] `sendInvite` sends login link only (no password in email)
- [ ] Role delete is soft delete (`is_deleted`); hidden from lists
- [ ] Handle `403` when the caller lacks `tenants:*` or `roles:*` permissions
