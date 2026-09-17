# ShivAI Frontend — API Endpoints

All backend APIs the frontend calls, grouped by area. Paths are relative to the
base URL unless noted.

- **Main API base:** `VITE_API_BASE_URL` (e.g. `https://staging.nodejs.callshivai.com/api/v1`)
- **Voice/phone service:** `https://staging.voice.callshivai.com` (prod: `https://voice.callshivai.com`) — used for `createAgentFull` and the phone-service dialer (`/phone`).
- **KB progress WebSocket:** `wss://<voice-host>/ws/kb-progress/:agentId`
- **Auth:** `Authorization: Bearer <accessToken>` on all authenticated calls.

---

## Auth (`/auth`, `/users`)
| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/login` | Sign in |
| POST | `/auth/register` | Register |
| POST | `/auth/google` | Google OAuth sign-in |
| GET | `/auth/google/url` | Get Google auth URL |
| POST | `/auth/refresh-token` | Refresh access token |
| POST | `/auth/logout` | Sign out |
| GET | `/auth/me` | Current user profile (role, permissions, accounts) |
| POST | `/auth/validate-email` | Email/password validation (signin/signup) |
| POST | `/auth/validate-credentials` | Validate credentials |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |
| GET | `/users/profile` | Get user profile |
| PUT | `/users/profile` | Update user profile |

## Onboarding (`/onboarding`, `/code-verify`)
| Method | Path | Purpose |
|---|---|---|
| POST | `/onboarding` | Create onboarding |
| POST | `/onboarding?draft=true` | Save onboarding draft |
| GET | `/onboarding/:id/status` | Onboarding status |
| PUT | `/onboarding/:id` | Update onboarding |
| GET | `/onboarding/history` | Onboarding history |
| POST | `/onboarding/upload-files` | Upload onboarding files |
| POST | `/code-verify` | Verify onboarding code |

## Agents (`/agents`, `/agent-configs`, `/agent-sessions`, `/publications`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/agents` | List agents (supports `sub_tenant_id`, filters, pagination) |
| GET | `/agents/:id` | Get agent |
| POST | `/agents/create-agent` | Create agent (also on voice service; sends `sub_tenant_id` in body for sub-tenants) |
| PUT | `/agents/:id` | Update agent |
| DELETE | `/agents/:id` | Delete agent |
| GET | `/agent-configs/:id` | Full agent config (edit/view) |
| POST | `/agents/upload/knowledge-bases` | Upload knowledge-base files |
| GET | `/agents/:id/presigned-url` | KB presigned URL |
| GET | `/agent-sessions/agent/:id?<query>` | Agent session history |
| GET | `/agent-sessions/:id/transcripts` | Session transcripts |
| DELETE | `/agent-sessions/:id` | Delete a session |
| POST | `/publications/publish` | Publish / unpublish agent (`is_published`) |
| POST | `/generate-prompt/generate` | AI prompt generation |
| GET | `/leads/agent/:id` | Leads for an agent |
| GET | `/summaries/agent/:id` | Call summaries by agent |
| GET | `/summaries/call/:callId` | Call summary by call id |
| GET | `/voice/catalog` | TTS voice catalog |
| POST | `/widgets` | Create/register widget |
| POST | `/upload/logo` | Upload a logo image |

## Phone Numbers (`/phone-numbers`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/phone-numbers` | List provisioned numbers |
| GET | `/phone-numbers/:id` | Get one number |
| GET | `/phone-numbers/catalog?type=<didTypeId>` | Browse buyable DIDs |
| GET | `/phone-numbers/did-types` | DID types |
| POST | `/phone-numbers/buy` | Buy + provision (`channel_count`, `months`, `dry_run`) |
| GET | `/phone-numbers/:id/status` | Provisioning readiness (layers) |
| PUT | `/phone-numbers/:id/reassign` | Reassign inbound agent |
| POST | `/phone-numbers/:id/enable-outbound` | Enable outbound |
| PUT | `/phone-numbers/:id/outbound-agent` | Set outbound agent |
| DELETE | `/phone-numbers/:id/provision` | Deprovision (remove trunk/routing) |
| DELETE | `/phone-numbers/:id/release` | Release number (`{ confirm: true }`) |
| POST | `/webhook/voicelink/call-logs` | (VoiceLink call-logs webhook) |

## Campaigns (`/campaigns`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/campaigns` | List campaigns |
| POST | `/campaigns` | Create campaign |
| GET | `/campaigns/:id` | Get campaign |
| PUT | `/campaigns/:id` | Update campaign |
| GET | `/campaigns/:id/status` | Campaign status |
| POST | `/campaigns/:id/contacts` | Add contacts |
| POST | `/campaigns/:id/contacts/upload` | Upload contacts |
| GET | `/campaigns/:id/contacts` | List campaign contacts |
| POST | `/campaigns/:id/archive` | Archive campaign |
| POST | `/campaigns/:id/<action>` | Start/pause/etc. |
| GET | `/campaigns/all-contacts` | All contacts |
| GET/POST | `/campaigns/contacts` | Campaign contacts |

## Contacts & Call History (`/contacts`, `/call-history`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/contacts` | List contacts (leads) |
| POST | `/contacts` | Create contact |
| GET | `/contacts/:id` | Get contact |
| PUT | `/contacts/:id` | Update contact |
| DELETE | `/contacts/:id` | Archive contact |
| GET | `/call-history` | Call history (filters) |
| GET | `/call-history/:id` | Call detail |
| GET | `/call-history/by-number/:phone` | History for a number |
| GET | `/call-history/stats` | Call history stats |

## Sub Tenants (`/tenants`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/tenants?tenant_id=<id>` | List sub-tenants (scoped by tenant/staff) |
| POST | `/tenants` | Create sub-tenant |
| GET | `/tenants/:id` | Get sub-tenant |
| PUT | `/tenants/:id` | Update sub-tenant / permissions (`max_employees` snake_case) |
| DELETE | `/tenants/:id` | Soft-delete sub-tenant |

## Roles (`/roles`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/roles` | List roles |
| GET | `/roles/options` | Permission options |
| GET | `/roles/:id` | Get role |
| POST | `/roles` | Create role |
| PUT | `/roles/:id` | Update role |
| DELETE | `/roles/:id` | Soft-delete role |

## Staff (`/staff`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/staff` | List staff (pagination, search, includeInactive) |
| POST | `/staff` | Create staff (`fullName`, `accounts[]`, `permissions[]`, scope encoded in permission keys) |
| GET | `/staff/:id` | Get staff |
| PUT | `/staff/:id` | Update staff |
| DELETE | `/staff/:id` | Soft-delete staff |

## Integrations & Google Sheets (`/integrations`, `/oauth`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/integrations` | List integrations |
| POST | `/integrations` | Link an integration |
| PUT | `/integrations/:id` | Replace integration |
| PATCH | `/integrations/:id` | Partial update |
| DELETE | `/integrations/:id` | Remove integration |
| GET | `/integrations/service/google_sheets/discover` | Discover Google Sheets |
| GET | `/integrations/sheets/:sheetId/columns` | Sheet columns |
| POST | `/integrations/sheets/create` | Create sheet (linked to agent) |
| POST | `/integrations/sheets/create-standalone` | Create standalone sheet |
| GET | `/integrations/agent/:agentId/service/:serviceName` | Agent service integrations |
| GET | `/oauth/status` | Connected providers |
| GET | `/oauth/connect/google?token=<t>` | Connect Google (Gmail/Sheets) |
| POST | `/oauth/sheets/select` | Save selected sheet |

## Zoho CRM (`/auth/zoho`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/auth/zoho/connect?dc=<dc>` | Start Zoho OAuth |
| GET | `/auth/zoho/status` | Zoho connection status |
| DELETE | `/auth/zoho/disconnect` | Disconnect Zoho |

## Google Calendar (`/auth/gc`, `/calendar`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/auth/gc/connect?token=<t>` | Start Calendar OAuth |
| GET | `/auth/gc/status` | Calendar connection status |
| DELETE | `/auth/gc/disconnect` | Disconnect Calendar |
| GET | `/calendar/events` | List events |
| POST | `/calendar/events` | Create event |
| PUT | `/calendar/events/:eventId` | Update event |
| DELETE | `/calendar/events/:eventId` | Delete event |

## External (non-ShivAI)
| Method | URL | Purpose |
|---|---|---|
| POST | `https://countriesnow.space/api/v0.1/countries/cities` | City list by country (location dropdowns) |
| POST | `https://nodejs.service.callshivai.com/api/v1/voice/generate` | Widget voice preview (TTS) |

---

## Notes
- **`/auth/me`** is the source of truth for role (`tenant` / `sub-tenant` / `staff` / `admin`), fine-grained `permissions[]`, and (for staff) `accounts[]`.
- **Staff acting context** (for tenant product APIs, per backend doc): `X-Acting-Tenant-Id` and optional `X-Acting-Sub-Tenant-Id` headers — not yet wired in the frontend.
- **Sub-tenant scoping**: `GET /agents?sub_tenant_id=<id>`; create sends `sub_tenant_id` in body; listings send `tenant_id`.
- Mock/localStorage (no backend yet): Command Center follow-ups & activity, tenant branding/templates/audit (tenantAPI), AppointmentCRM staff (separate model).
