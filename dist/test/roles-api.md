# Roles API — React client integration

Roles are **global permission templates**. They define which `module:action` pairs a user may perform. Assigning a role to a tenant or sub-tenant happens via the separate `Permission` collection (done automatically when creating a sub-tenant with `roleId`).

> **Sub-tenants:** see [sub-tenants-api.md](./sub-tenants-api.md).

**Do not confuse with** the RBAC **Role** key `admin` on a `Permission` row — that is how platform admin access is granted. API access for tenants/sub-tenants is driven by the **Role** documents and `Permission` rows described here.

## Base URL

```text
{API_BASE}/api/v1/roles
```

## Auth and permissions

Every endpoint requires:

```http
Authorization: Bearer <access-token>
Content-Type: application/json
```

| Method | Path | Required permission |
|---|---|---|
| `GET` | `/roles/options` | `roles:read` |
| `POST` | `/roles` | `roles:create` |
| `GET` | `/roles` | `roles:read` |
| `GET` | `/roles/:id` | `roles:read` |
| `PUT` | `/roles/:id` | `roles:update` |
| `DELETE` | `/roles/:id` | `roles:delete` |

Users with Permission → Role key `admin` bypass permission checks.

Treat:

- `401` — missing / expired / invalid token
- `403` — missing required permission
- `404` — role not found (includes soft-deleted roles)
- `409` — duplicate `key` among active roles
- `422` — Joi validation
- `400` — role is assigned to one or more permissions and cannot be deleted

## Seeded roles

On server start, these templates are created if missing:

| `key` | Typical use |
|---|---|
| `admin` | Full module/action access (permission template) |
| `tenant` | Parent tenant default — full access within org |
| `sub-tenant` | Limited read/update on `users`, `tenants`, `settings` |

Parent tenants receive a `Permission` row with the `tenant` role. Sub-tenants receive one with the role chosen at create time (`roleId`).

---

## Permission model

```ts
type PermissionModule =
  | 'users'
  | 'roles'
  | 'permissions'
  | 'tenants'
  | 'settings';

type PermissionAction = 'create' | 'read' | 'update' | 'delete';
```

A **permission string** is `module:action`, e.g. `users:read`, `roles:update`.

Roles store:

- `default_modules` — which modules apply
- `default_actions` — which actions apply
- `default_permissions` — server-computed Cartesian product (`module:action`)

Example: `default_modules: ['users', 'roles']` + `default_actions: ['read', 'update']` →

```json
["roles:read", "roles:update", "users:read", "users:update"]
```

Do **not** send `default_permissions` in create/update bodies.

When a role is updated, existing `Permission` rows that reference it are invalidated in Redis so middleware picks up new grants on the next request.

---

## Types

```ts
type Role = {
  id: string;
  key: string;
  description: string;
  default_modules: PermissionModule[];
  default_actions: PermissionAction[];
  default_permissions: string[];
  createdAt: string;
  updatedAt: string;
};
```

Soft-deleted roles (`is_deleted: true` in the database) are **excluded** from all list/get responses. Deleted role keys can be reused for new roles.

---

## Get permission options

`GET /roles/options`

Returns valid module and action values for role form pickers.

```json
{
  "success": true,
  "data": {
    "modules": ["users", "roles", "permissions", "tenants", "settings"],
    "actions": ["create", "read", "update", "delete"]
  }
}
```

---

## Create role

`POST /roles`

| Field | Required | Rules |
|---|---|---|
| `key` | yes | 2–64 chars; lowercase; starts with letter; `[a-z0-9_-]` only; unique among active roles |
| `description` | no | Max 500 characters |
| `default_modules` | yes | Non-empty array of valid modules |
| `default_actions` | yes | Non-empty array of valid actions |

```json
{
  "key": "manager",
  "description": "Can read and update users and roles",
  "default_modules": ["users", "roles"],
  "default_actions": ["read", "update"]
}
```

Response `201`: `{ "data": { "role": { ... } } }`

---

## List roles

`GET /roles`

| Query | Default | Notes |
|---|---|---|
| `page` | `1` | |
| `limit` | `10` | Max `100` |
| `sortBy` | `createdAt` | `createdAt`, `updatedAt`, `key` |
| `sortOrder` | `desc` | `asc` or `desc` |
| `search` | | Case-insensitive on `key` or `description` |

Response: `{ "data": { "roles": Role[] }, "meta": { "pagination": { ... } } }`

Only active roles (`is_deleted: false`) are returned.

---

## Get role

`GET /roles/:id`

Response: `{ "data": { "role": Role } }`

`404` if not found or soft-deleted.

---

## Update role

`PUT /roles/:id`

At least one field required. Recomputes `default_permissions` when modules or actions change.

| Field | Rules |
|---|---|
| `key` | Same as create; unique among active roles |
| `description` | Max 500 characters |
| `default_modules` | Non-empty array |
| `default_actions` | Non-empty array |

Response: `{ "data": { "role": Role } }`

---

## Delete role (soft delete)

`DELETE /roles/:id`

Sets `is_deleted: true`. The role disappears from all listings. The document remains in the database.

- `404` — not found or already deleted
- `400` — role is referenced by one or more `Permission` records

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Role deleted successfully"
}
```

No `data` payload on success.

---

## Suggested React screens

1. Load pickers from `GET /roles/options`.
2. Table: `GET /roles` with pagination and search.
3. Create: `key`, `description`, module/action multi-select → `POST /roles`.
4. Show `default_permissions` from the response (read-only).
5. Edit → `PUT /roles/:id`.
6. Delete → `DELETE /roles/:id` (handle `400` if role is in use).

Use `GET /roles` (not deleted roles) to populate the **Starting Permission Template** dropdown when creating a sub-tenant.

---

## Endpoint map

| Method | Path | Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/roles/options` | `roles:read` | Module/action enums |
| `POST` | `/api/v1/roles` | `roles:create` | Create role |
| `GET` | `/api/v1/roles` | `roles:read` | List active roles |
| `GET` | `/api/v1/roles/:id` | `roles:read` | Get role |
| `PUT` | `/api/v1/roles/:id` | `roles:update` | Update role |
| `DELETE` | `/api/v1/roles/:id` | `roles:delete` | Soft-delete role |

## Checklist for frontend

- [ ] Do not send `default_permissions` — server computes it
- [ ] Permission format is always `module:action`
- [ ] Deleted roles are hidden; `404` on get by id after delete
- [ ] Cannot delete a role still assigned to users (`400`)
- [ ] Sub-tenant create uses `roleId` from this API — see [sub-tenants-api.md](./sub-tenants-api.md)
