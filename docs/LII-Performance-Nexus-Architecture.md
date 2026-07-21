# LII Performance Nexus — Technical Architecture

**Document type:** Foundational Architecture Specification
**Scope:** Platform architecture only. No business modules included.
**Stack:** React + TypeScript + Vite (frontend) · Node.js + Express (backend) · MySQL · JWT + bcrypt

---

## Guiding Principles

Before the structure, the rules that produced it:

1. **Clean Architecture** — dependencies point inward. Domain logic knows nothing about Express, MySQL, or React. Infrastructure is swappable; business rules are not.
2. **Repository Pattern** — no SQL, no ORM query builder, no data-access code ever appears in a service or controller. All persistence goes through a repository interface.
3. **Service Layer** — all business logic lives in services. Controllers are thin: parse request → call service → shape response.
4. **Modular Monolith first** — every "module" (e.g., `employees`, `evaluations`, `attendance`, later modules) is a self-contained vertical slice with its own controller/service/repository/model/routes. Modules do not import each other's internals — only through defined contracts (interfaces) or shared `core` services. This is what lets the platform later be split into microservices without a rewrite, since a module boundary today becomes a service boundary tomorrow.
5. **No business modules yet** — this document defines the skeleton, the plumbing, and one placeholder module (`_module-template`) that demonstrates the pattern. Actual measurement/evaluation modules are out of scope for this document.

---

## 1. Folder Structure

### 1.1 Monorepo Layout (recommended)

```
lii-performance-nexus/
├── apps/
│   ├── backend/                 # Node.js + Express API
│   └── frontend/                # React + TS + Vite SPA
├── packages/
│   ├── shared-types/            # DTOs, enums, API contracts shared FE/BE
│   ├── shared-config/           # lint, tsconfig, prettier bases
│   └── shared-constants/        # permission keys, error codes, roles
├── infra/
│   ├── docker/
│   ├── nginx/
│   ├── k8s/                     # future container orchestration
│   └── scripts/
├── docs/
│   ├── architecture/
│   ├── adr/                     # Architecture Decision Records
│   └── api/                     # OpenAPI specs
├── .github/
│   └── workflows/                # CI/CD pipelines
├── docker-compose.yml
├── docker-compose.dev.yml
├── package.json                  # workspaces root
├── turbo.json / nx.json          # monorepo task runner (optional)
└── README.md
```

Using a monorepo with workspaces (npm/pnpm/yarn workspaces + Turborepo or Nx) lets frontend and backend share `shared-types` so API contracts are type-safe end-to-end, and lets each module later be extracted into its own deployable service with minimal friction.

### 1.2 Backend Folder Structure (Clean Architecture, module-based)

```
apps/backend/
├── src/
│   ├── config/
│   │   ├── env.ts                       # validated env loader (zod/joi)
│   │   ├── database.ts                  # MySQL pool/connection config
│   │   ├── logger.config.ts
│   │   └── constants.ts
│   │
│   ├── core/                            # cross-cutting, framework-agnostic
│   │   ├── domain/
│   │   │   ├── entities/                # base Entity, AggregateRoot
│   │   │   ├── errors/                  # DomainError, ValidationError, etc.
│   │   │   └── value-objects/
│   │   ├── application/
│   │   │   ├── interfaces/
│   │   │   │   ├── IRepository.ts
│   │   │   │   ├── IUnitOfWork.ts
│   │   │   │   └── IUseCase.ts
│   │   │   └── use-cases/               # generic/shared use cases
│   │   └── ports/                       # interfaces infra must implement
│   │       ├── ILogger.ts
│   │       ├── ICache.ts
│   │       ├── INotificationSender.ts
│   │       └── IEventBus.ts
│   │
│   ├── infrastructure/                  # concrete implementations of ports
│   │   ├── database/
│   │   │   ├── mysql/
│   │   │   │   ├── connection.ts
│   │   │   │   ├── migrations/
│   │   │   │   └── seeders/
│   │   │   └── unit-of-work/
│   │   ├── cache/
│   │   │   └── redis.client.ts
│   │   ├── logging/
│   │   │   └── winston.logger.ts
│   │   ├── notification/
│   │   │   ├── email.provider.ts
│   │   │   ├── sms.provider.ts
│   │   │   └── push.provider.ts
│   │   ├── security/
│   │   │   ├── jwt.service.ts
│   │   │   ├── bcrypt.service.ts
│   │   │   └── token-blacklist.ts
│   │   └── events/
│   │       └── event-bus.ts             # in-process now, message-broker later
│   │
│   ├── modules/                         # MODULES — each is self-contained
│   │   ├── _module-template/            # reference implementation (not a real module)
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   └── repositories/        # interface only (IXxxRepository.ts)
│   │   │   ├── application/
│   │   │   │   ├── dto/
│   │   │   │   ├── services/
│   │   │   │   ├── validators/
│   │   │   │   └── use-cases/
│   │   │   ├── infrastructure/
│   │   │   │   └── repositories/        # MySQL implementation of the interface
│   │   │   ├── presentation/
│   │   │   │   ├── controllers/
│   │   │   │   ├── routes/
│   │   │   │   └── mappers/
│   │   │   ├── module.config.ts         # registers routes, DI bindings
│   │   │   └── index.ts                 # public module contract (barrel export)
│   │   │
│   │   ├── identity/                    # users, auth, sessions (foundational, ships now)
│   │   ├── rbac/                        # roles, permissions (foundational, ships now)
│   │   ├── audit/                       # audit trail (foundational, ships now)
│   │   ├── notification/                # notification orchestration (foundational)
│   │   └── organization/                # departments/sites/shifts (foundational, structural only)
│   │
│   ├── shared/
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── rbac.middleware.ts
│   │   │   ├── error-handler.middleware.ts
│   │   │   ├── request-logger.middleware.ts
│   │   │   ├── rate-limiter.middleware.ts
│   │   │   └── validate-request.middleware.ts
│   │   ├── utils/
│   │   ├── decorators/                  # if using tsyringe/inversify DI decorators
│   │   └── di/
│   │       └── container.ts             # dependency injection container
│   │
│   ├── api/
│   │   ├── v1/
│   │   │   └── router.ts                # aggregates all module routers under /api/v1
│   │   └── health/
│   │       └── health.routes.ts
│   │
│   ├── app.ts                           # Express app assembly (middleware pipeline)
│   └── server.ts                        # process entrypoint (listen, graceful shutdown)
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .env.development
├── .env.staging
├── .env.production
├── tsconfig.json
├── package.json
└── Dockerfile
```

**Dependency rule enforced by folder position:** `domain` → depends on nothing. `application` → depends only on `domain`. `infrastructure` → depends on `application`/`domain` interfaces. `presentation` → depends on `application`. Nothing inside `domain` or `application` ever imports from `infrastructure` or `presentation`, and this should be enforced with an ESLint boundary rule (e.g. `eslint-plugin-boundaries` or `dependency-cruiser`), not just convention.

### 1.3 Frontend Folder Structure (feature-modular)

```
apps/frontend/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── AppProviders.tsx             # theme, query client, auth, i18n providers
│   │   ├── router/
│   │   │   ├── AppRouter.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── routes.config.ts
│   │   └── store/
│   │       └── rootStore.ts             # or QueryClient if no global state lib
│   │
│   ├── modules/                         # mirrors backend modules 1:1
│   │   ├── _module-template/
│   │   │   ├── api/                     # typed API client calls for this module
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── pages/
│   │   │   ├── types/
│   │   │   ├── store/                   # module-local state (zustand slice, etc.)
│   │   │   └── routes.tsx
│   │   ├── auth/
│   │   ├── rbac/                        # role/permission management UI
│   │   ├── audit/                       # audit log viewer UI
│   │   ├── notifications/
│   │   └── organization/
│   │
│   ├── shared/
│   │   ├── components/                  # design-system-level shared components
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── utils/
│   │   ├── constants/
│   │   └── guards/
│   │       └── PermissionGate.tsx       # component-level RBAC gating
│   │
│   ├── services/
│   │   ├── api/
│   │   │   ├── axiosInstance.ts         # interceptors: auth header, refresh, 401 handling
│   │   │   └── endpoints.ts
│   │   ├── auth/
│   │   │   └── authService.ts
│   │   └── storage/
│   │       └── secureStorage.ts
│   │
│   ├── config/
│   │   ├── env.ts
│   │   └── permissions.map.ts
│   │
│   ├── types/
│   │   └── global.d.ts
│   │
│   ├── styles/
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── public/
├── .env.development
├── .env.staging
├── .env.production
├── vite.config.ts
├── tsconfig.json
└── package.json
```

Frontend modules mirror backend modules by name deliberately — anyone navigating either codebase finds the same mental map, and it keeps the eventual "module → microservice + micro-frontend" split symmetrical.

---

## 2. Backend Architecture

**Layering (Clean Architecture, 4 rings, outer depends on inner):**

```
┌─────────────────────────────────────────────┐
│  Presentation (Controllers, Routes, DTO out) │
│  ┌─────────────────────────────────────────┐ │
│  │  Infrastructure (MySQL Repos, JWT, etc.) │ │
│  │  ┌───────────────────────────────────┐  │ │
│  │  │  Application (Services, Use Cases)│  │ │
│  │  │  ┌─────────────────────────────┐  │  │ │
│  │  │  │   Domain (Entities, Rules)  │  │  │ │
│  │  │  └─────────────────────────────┘  │  │ │
│  │  └───────────────────────────────────┘  │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

Request lifecycle:

```
HTTP Request
  → Middleware pipeline (helmet, cors, rate-limit, requestId, logger)
  → auth.middleware (verify JWT, attach req.user)
  → rbac.middleware (check permission for route)
  → validate-request.middleware (schema validation - zod/joi)
  → Controller (parse req → call Service, never touches DB)
  → Service (business logic, orchestrates repositories, enforces domain rules)
  → Repository interface → Repository implementation (MySQL)
  → MySQL
  ← Entity/domain result
  ← Service maps to DTO
  ← Controller sends HTTP response (standard envelope)
  ← error-handler.middleware (catches anything thrown along the way)
```

**Repository Pattern contract example:**

```ts
// domain/repositories/IUserRepository.ts
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<User>;
  update(id: string, changes: Partial<User>): Promise<User>;
  softDelete(id: string): Promise<void>;
}
```

```ts
// infrastructure/repositories/MySqlUserRepository.ts
export class MySqlUserRepository implements IUserRepository {
  constructor(private readonly db: MySqlConnectionPool) {}
  async findById(id: string) { /* parameterized SQL only */ }
  // ...
}
```

Services depend on the **interface**, never the concrete class. Binding happens in the DI container / module composition root, so swapping MySQL for another store later touches only `infrastructure`.

**Dependency Injection:** use a lightweight container (`tsyringe` or `inversify`) or manual composition roots per module (`module.config.ts`). Manual composition is perfectly fine at this stage and avoids decorator overhead — recommended to start manual, migrate to a DI library only if module count and constructor complexity justify it.

**Unit of Work:** introduced from day one even though it looks like overhead now, because performance evaluations will eventually span multiple tables in a single transaction (e.g., write an evaluation + update an aggregate score + write an audit entry). The `IUnitOfWork` interface wraps a MySQL transaction and is passed into services that need atomicity.

---

## 3. Frontend Architecture

- **Vite** for build/dev server; **React + TypeScript** with strict mode on.
- **Routing:** `react-router-dom` with a config-driven route table (`routes.config.ts`) so routes can be permission-filtered before render.
- **Server state:** `@tanstack/react-query` for all API data (caching, retries, invalidation) — this is not optional at "large enterprise platform" scale; do not hand-roll fetch + useState for data that multiple screens depend on.
- **Client/UI state:** `zustand` (or Redux Toolkit if the team prefers more structure) for cross-cutting UI state (current user, active theme, sidebar state). Keep this small — most state should be server state via React Query.
- **Forms:** `react-hook-form` + `zod` schemas shared conceptually with backend validators (not literally shared code, but same shape, ideally generated from `shared-types`).
- **API layer:** every module owns typed functions in `modules/<module>/api/`, calling a single shared `axiosInstance` with interceptors for:
  - attaching `Authorization: Bearer <token>`
  - silent refresh on 401 (queue pending requests during refresh)
  - global error normalization into a consistent shape for UI toasts
- **Component tiers:**
  - `shared/components` — pure, no business/module knowledge (Button, Table, Modal, DataGrid)
  - `modules/*/components` — module-specific composition of shared components
- **Permission-aware rendering:** a `PermissionGate` component and `useHasPermission()` hook hide/disable UI based on the same permission keys the backend enforces — UI hiding is a UX convenience only, never the actual security boundary.
- **Code-splitting:** each module lazy-loaded via `React.lazy` + route-based splitting, so the bundle scales with module count instead of growing monolithically.

---

## 4. Database Architecture

**Engine:** MySQL 8+, InnoDB, `utf8mb4`.

**Design conventions:**
- Every table: `id` (UUID stored as `CHAR(36)` or `BINARY(16)`, not auto-increment int, to avoid enumeration and to support future distributed IDs), `created_at`, `updated_at`, `created_by`, `updated_by`, `is_deleted` (soft delete) or `deleted_at`.
- Foreign keys enforced at the DB level, not just application level.
- No cross-module foreign keys where avoidable at this stage — if `evaluations` needs `employee_id`, it references a shared `organization`/`identity` table, but modules built later should not reach into each other's private tables directly; access goes through that module's service/repository. This is the seam that allows a future module extraction into its own database.
- Migrations are the only way schema changes — no manual ALTERs in any environment. Use a migration tool (`knex`, `umzug`, or `Prisma Migrate` if the ORM choice is Prisma; raw `mysql2` + `knex` query builder is the more Clean-Architecture-friendly pairing since it avoids ORM entities leaking into the domain layer).

**Foundational schema (platform-level, not business modules):**

```
users
  id, employee_code, email, password_hash, full_name,
  status (active/suspended/inactive), last_login_at,
  created_at, updated_at, deleted_at

roles
  id, name, description, is_system_role, created_at, updated_at

permissions
  id, key (e.g. "evaluation.create"), module, description

role_permissions
  role_id, permission_id                      -- many-to-many

user_roles
  user_id, role_id, scope_type, scope_id      -- scope enables e.g. "manager of Dept X"

departments / sites / shifts   (organization module — structural only)
  id, name, parent_id, ...

refresh_tokens
  id, user_id, token_hash, expires_at, revoked_at, ip_address, user_agent

audit_logs
  id, actor_user_id, action, entity_type, entity_id,
  before_state (JSON), after_state (JSON), ip_address, user_agent, created_at

notifications
  id, recipient_user_id, channel, template_key, payload (JSON),
  status (pending/sent/failed/read), sent_at, read_at, created_at

notification_templates
  id, key, channel, subject, body_template, created_at
```

**Indexing strategy:** composite indexes on every foreign key plus every column used in a WHERE/ORDER BY on high-traffic tables (`user_id`, `created_at`), and a covering index strategy revisited per module as real query patterns emerge — don't over-index speculatively beyond FKs and obvious lookup columns.

**Scaling path:** start as a single MySQL instance with read replicas added when read load justifies it; partitioning/sharding by `tenant_id` or `site_id` is a documented future option (see §18) but not implemented until multi-tenancy or data volume requires it — do not build sharding logic on day one, but do reserve a `tenant_id` column pattern in foundational tables so it costs nothing to activate later.

---

## 5. Authentication Flow

**Login:**
1. Client POSTs `{ email, password }` to `/api/v1/auth/login`.
2. `AuthController` → `AuthService.login()`.
3. Service loads user via `IUserRepository`, verifies with `bcrypt.compare`.
4. On success, `JwtService` issues:
   - **Access token** (short-lived, 15 min, signed, contains `userId`, `roles`, `permissions` snapshot or just `roles` if permission set is large).
   - **Refresh token** (long-lived, 7–30 days, random opaque token, stored **hashed** in `refresh_tokens` table, not as a JWT — this allows revocation, which a stateless JWT alone cannot do).
5. Access token returned in response body; refresh token set as an `httpOnly`, `Secure`, `SameSite=Strict` cookie (never in `localStorage`, to reduce XSS token theft risk).
6. `audit` module records the login event.

**Token refresh:**
1. When access token expires, frontend Axios interceptor calls `/api/v1/auth/refresh` (browser sends the httpOnly cookie automatically).
2. Backend validates the refresh token hash against `refresh_tokens`, checks `revoked_at`/`expires_at`.
3. Issues a new access token; optionally rotates the refresh token (rotate-on-use is recommended — old refresh token is immediately revoked, new one issued, which limits replay-attack windows).

**Logout:**
1. Revoke the refresh token row (`revoked_at = now()`).
2. Clear the cookie.
3. Access token is short-lived enough that no blacklist is strictly required, but an in-memory/Redis blacklist of revoked access-token JTIs can be added for immediate hard-logout guarantees on sensitive actions.

**Password handling:** `bcrypt` with cost factor ≥ 12, never store or log plaintext, enforce password policy at the validator layer, and rate-limit `/auth/login` per IP + per account to blunt brute force.

---

## 6. Authorization Flow

Authentication answers "who are you"; authorization answers "what can you do" — kept as two distinct middleware stages, never merged into one check.

```
Request → auth.middleware
             (verifies JWT signature + expiry, loads/attaches req.user
              = { id, roles[], permissions[] })
        → rbac.middleware(requiredPermission)
             (checks req.user.permissions includes requiredPermission,
              OR re-fetches fresh permissions from DB/cache if the token
              only carries roles — see note below)
        → Controller
```

**Design decision — permissions in token vs. permissions on demand:** encoding a full permission list into the JWT is fast but stale until the token expires (a revoked permission still "works" for up to 15 minutes). Two acceptable patterns:
- **Cache-backed live check** (recommended for this platform): JWT carries only `roles`; `rbac.middleware` checks role→permission mapping against a Redis-cached lookup that's invalidated whenever `role_permissions` changes. Gives near-real-time revocation without a DB hit per request.
- **Claims-in-token:** simpler, but accept the staleness window; mitigate by keeping access-token lifetime short (15 min).

Route-level declaration example:

```ts
router.post(
  "/evaluations",
  authMiddleware,
  requirePermission("evaluation.create"),
  validate(createEvaluationSchema),
  evaluationController.create
);
```

**Scoped authorization:** beyond flat permissions, many checks in this platform will be scope-based ("can rate employees in *their own* department"). This is modeled as: permission check (`evaluation.create`) + a service-level scope check (`evaluationService` verifies the target employee is within the actor's assigned scope, using the `user_roles.scope_id` data). Scope logic lives in the service layer, not middleware, because it depends on the specific resource being acted on.

---

## 7. RBAC (Role-Based Access Control)

**Model:**

```
User ──< UserRole >── Role ──< RolePermission >── Permission
```

- **Role** — a named collection of permissions (`Employee`, `Supervisor`, `Department Manager`, `HR Admin`, `Plant Manager`, `System Admin`). Roles are data, not code — creatable/editable via an admin UI, not hardcoded enums, except for a small set of `is_system_role = true` roles (e.g. `System Admin`) that cannot be deleted.
- **Permission** — an atomic capability, named `module.action` (e.g. `evaluation.create`, `evaluation.view.own`, `evaluation.view.department`, `employee.export`). Permissions are seeded by each module's migration/seed script — every module registers its own permission set, which is how modularity is preserved: a module can be added or removed without touching a central "master permission list" by hand.
- **UserRole with scope** — a user can hold the same role differently scoped (`Supervisor` of `Line 3` vs `Supervisor` of `Line 7`), modeled via `scope_type` (`department`, `site`, `global`) + `scope_id` on `user_roles`.

**Why RBAC over pure ACL:** with hundreds/thousands of factory + office employees, per-user permission assignment doesn't scale operationally. Roles give HR/admins a manageable unit; the `permissions` layer underneath still gives fine-grained control when a role needs a custom tweak (see hybrid note below).

**Hybrid escape hatch (optional, future):** a `user_permissions` override table (`user_id, permission_id, effect: allow|deny`) can be added later for exceptional one-off grants without inventing a new role for a single person — deliberately not built now to avoid premature complexity, but the schema leaves room for it.

---

## 8. Permission System

**Permission key convention:** `<module>.<resource>.<action>[.<qualifier>]`

Examples:
```
identity.user.create
identity.user.deactivate
rbac.role.assign
audit.log.view
notification.template.manage
evaluation.record.create        (future module, illustrative only)
evaluation.record.view.own
evaluation.record.view.department
evaluation.record.view.all
```

**Enforcement points (defense in depth — every layer checks, none trusts the layer above blindly):**
1. **Route middleware** — coarse check: does the user have this permission at all.
2. **Service layer** — fine-grained/scoped check: does the user have this permission *for this specific resource instance*.
3. **Frontend `PermissionGate`** — UX only: hide/disable controls the user can't use. Never the actual security boundary.
4. **Database** — last line of defense for data integrity (FKs, constraints), not for authorization, but prevents orphaned/inconsistent data even if a bug slips through the above.

**Permission registry:** each module exports a `permissions.ts` manifest:

```ts
// modules/_module-template/permissions.ts
export const ModulePermissions = {
  VIEW: "moduleTemplate.view",
  CREATE: "moduleTemplate.create",
  UPDATE: "moduleTemplate.update",
  DELETE: "moduleTemplate.delete",
} as const;
```

A boot-time seeding step aggregates every module's manifest and upserts rows into the `permissions` table, so permissions are always in sync with code and never manually typed into the database.

---

## 9. API Structure

**Convention:** REST, versioned, resource-oriented, consistent envelope.

```
Base URL:  /api/v1

Auth:
  POST   /api/v1/auth/login
  POST   /api/v1/auth/refresh
  POST   /api/v1/auth/logout
  POST   /api/v1/auth/forgot-password
  POST   /api/v1/auth/reset-password

Identity (foundational module):
  GET    /api/v1/users
  GET    /api/v1/users/:id
  POST   /api/v1/users
  PATCH  /api/v1/users/:id
  DELETE /api/v1/users/:id          (soft delete)

RBAC (foundational module):
  GET    /api/v1/roles
  POST   /api/v1/roles
  PATCH  /api/v1/roles/:id
  GET    /api/v1/permissions
  POST   /api/v1/roles/:id/permissions
  POST   /api/v1/users/:id/roles

Audit (foundational module):
  GET    /api/v1/audit-logs?entityType=&actorId=&from=&to=

Notifications (foundational module):
  GET    /api/v1/notifications
  PATCH  /api/v1/notifications/:id/read

Health / Ops:
  GET    /api/v1/health
  GET    /api/v1/health/ready
  GET    /api/v1/health/live
```

**Response envelope (uniform across all endpoints):**

```json
{
  "success": true,
  "data": { },
  "meta": { "page": 1, "pageSize": 20, "totalItems": 134 },
  "error": null
}
```

```json
{
  "success": false,
  "data": null,
  "meta": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required.",
    "details": [ { "field": "email", "issue": "required" } ]
  }
}
```

**Conventions:**
- Plural nouns, no verbs in URLs (`/users`, not `/getUsers`).
- Filtering/sorting/pagination via query params: `?page=1&pageSize=20&sortBy=createdAt&sortOrder=desc&status=active`.
- `PATCH` for partial updates, `PUT` reserved for full replace (rarely used).
- Idempotency keys supported on POST for critical write operations (`Idempotency-Key` header), relevant once evaluation-submission endpoints exist.
- API documented with OpenAPI 3.1, generated/maintained in `docs/api/`, and ideally auto-generated from route + zod schemas (`zod-to-openapi`) so docs can't drift from implementation.

---

## 10. Environment Files

**Backend (`apps/backend/.env.*`):**

```
# App
NODE_ENV=development
PORT=4000
APP_NAME=lii-performance-nexus-api
API_VERSION=v1

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=lii_nexus
DB_USER=lii_nexus_app
DB_PASSWORD=__secret__
DB_POOL_MIN=2
DB_POOL_MAX=20
DB_SSL=false

# Auth
JWT_ACCESS_SECRET=__secret__
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
COOKIE_DOMAIN=.liinexus.com

# Cache
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Notifications
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMS_PROVIDER_API_KEY=

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://app.liinexus.com

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

**Frontend (`apps/frontend/.env.*`):**

```
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_APP_NAME=LII Performance Nexus
VITE_ENV=development
```

**Rules:**
- `.env.example` committed with placeholder values; real `.env.*` files are `.gitignore`d.
- Secrets never committed, never logged. In staging/production, secrets are injected via the deployment platform's secret manager (see §11), not baked into images or committed env files.
- Config is loaded once at boot through a validated schema (`zod`/`joi`) — the app should refuse to start if a required env var is missing or malformed, rather than failing unpredictably at runtime.

---

## 11. Deployment Structure

**Containerization:** each app (`backend`, `frontend`) gets its own multi-stage `Dockerfile` (build stage → slim runtime stage).

```
infra/
├── docker/
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── nginx.Dockerfile
├── nginx/
│   └── nginx.conf              # reverse proxy, serves FE static build, proxies /api to backend
├── k8s/                        # activated when scale justifies it
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   ├── ingress.yaml
│   ├── mysql-statefulset.yaml (or managed DB instead)
│   ├── redis-deployment.yaml
│   └── secrets/                # sealed-secrets or external-secrets refs, never plaintext
└── scripts/
    ├── migrate.sh
    ├── seed.sh
    └── backup-db.sh
```

**Environments:** `development` → `staging` → `production`, each with its own env file/secret set and its own database instance. No environment shares credentials with another.

**CI/CD pipeline (per push/PR, e.g. GitHub Actions):**
```
1. Install & cache dependencies
2. Lint + type-check (frontend & backend)
3. Unit tests
4. Integration tests (spin up MySQL + Redis via docker-compose in CI)
5. Build (tsc/vite build)
6. Build & push Docker images (tagged with git SHA + semver)
7. Run DB migrations against target environment
8. Deploy (rolling update)
9. Smoke test /health endpoint post-deploy
```

**Deployment topology (initial, scales later without redesign):**
```
                    [ Load Balancer / Nginx ]
                       /                \
        [ Frontend static build ]   [ Backend API (N replicas) ]
                                            |
                                    [ MySQL Primary ]
                                            |
                                    [ MySQL Read Replica(s) ]
                                            |
                                       [ Redis Cache ]
```

Start with a single backend replica + single DB instance behind a reverse proxy on modest infrastructure; the same container images and the same modular boundaries scale horizontally (more backend replicas) and eventually vertically-split (extracting a hot module like `notification` or `audit` into its own deployable service) without touching application code, because modules were never coupled to begin with.

---

## 12. Logging

**Library:** `winston` (or `pino` for higher throughput) with structured JSON output in staging/production, pretty-printed in development.

**Log levels:** `error`, `warn`, `info`, `http`, `debug`.

**Structured log shape:**

```json
{
  "timestamp": "2026-07-04T10:22:31.000Z",
  "level": "info",
  "requestId": "a1b2c3d4",
  "userId": "u_9f21",
  "module": "identity",
  "message": "User created",
  "meta": { "targetUserId": "u_7712" }
}
```

**Requirements:**
- Every request gets a `requestId` (generated in middleware, propagated through logs and returned in the response header `X-Request-Id`) so a single request's full log trail can be reconstructed across services later.
- Never log passwords, tokens, or full request bodies containing PII — log field allowlists, not blanket `JSON.stringify(req.body)`.
- Logs shipped to a central aggregator (e.g., ELK stack, Grafana Loki, or a managed service) once there's more than one instance — local file logs alone don't scale past a single node.
- `ILogger` is a **port** (see §2) implemented by the winston adapter — services log through the interface, never `console.log` directly, so the logging backend can be swapped without touching business code.

---

## 13. Error Handling

**Domain-level error hierarchy:**

```ts
export class DomainError extends Error {
  constructor(message: string, public readonly code: string, public readonly statusCode: number) {
    super(message);
  }
}

export class ValidationError extends DomainError { /* 400 */ }
export class UnauthorizedError extends DomainError { /* 401 */ }
export class ForbiddenError extends DomainError { /* 403 */ }
export class NotFoundError extends DomainError { /* 404 */ }
export class ConflictError extends DomainError { /* 409 */ }
export class InternalServerError extends DomainError { /* 500 */ }
```

- Services throw these typed errors; they never throw raw strings or leak MySQL driver errors upward.
- A single global `error-handler.middleware.ts` catches everything at the end of the pipeline, maps known `DomainError` subclasses to their status code + the standard error envelope (§9), and maps **unknown** errors to a generic `500` with a logged stack trace — the client never sees a raw stack trace or SQL error in any environment.
- Async route handlers are wrapped (via a small `asyncHandler` utility or `express-async-errors`) so rejected promises are always funneled into the error middleware instead of crashing the process or hanging the request.
- Uncaught exceptions / unhandled rejections at the process level are logged and trigger a graceful shutdown (drain connections, close DB pool, exit) rather than leaving the process in an undefined state — handled in `server.ts`.
- Frontend: a global Axios response interceptor normalizes all API errors into a single shape consumed by a toast/notification system; React error boundaries catch render-time failures per route so one broken module page doesn't blank the whole app.

---

## 14. Notification Framework

Modeled as its own foundational module (`modules/notification`) so any future module can trigger a notification without knowing *how* it's delivered.

**Architecture:**

```
Any Module Service
      │  (calls) 
      ▼
INotificationSender (port)
      │
      ▼
NotificationService
      │  1. resolve template by key
      │  2. render with payload
      │  3. persist notification record
      │  4. dispatch via channel adapter(s)
      ▼
┌───────────────┬───────────────┬───────────────┐
│ EmailProvider  │ SMSProvider   │ PushProvider  │  (infrastructure adapters)
└───────────────┴───────────────┴───────────────┘
      │
      ▼
Delivery status recorded back on the notification row (sent/failed)
```

- **Decoupling via events (recommended as the platform grows):** rather than modules calling `NotificationService` directly and synchronously, modules publish domain events (`EmployeeEvaluationSubmitted`) to the `IEventBus` port; the notification module subscribes to relevant events and reacts. This keeps modules from depending on each other directly and sets up the seam for a real message queue (RabbitMQ/SQS) later — the in-process event bus can be swapped for a broker-backed one without changing publisher/subscriber code.
- **Templates** stored in DB (`notification_templates`) so non-engineers can edit copy without a deploy.
- **Channels** are pluggable adapters behind a common interface — adding "Slack" or "Teams" later is a new adapter, not a rewrite.
- **User preferences** (future extension point): a `notification_preferences` table per user/channel/category, checked before dispatch.
- **In-app notifications** persist to `notifications` table regardless of external channel delivery, so the frontend bell/inbox always has a source of truth independent of email/SMS success.

---

## 15. Audit Trail

Modeled as its own foundational module (`modules/audit`) — every module writes to it, nothing writes to any other module's data.

**What gets audited:** authentication events (login, logout, failed login, password reset), authorization changes (role/permission assigned or revoked), and every create/update/delete on any entity considered sensitive (which, given this platform's purpose — measuring people's performance — is essentially every write operation touching employee or evaluation data).

**Mechanism:**
- A cross-cutting `AuditService.record()` call, invoked explicitly from within services after a successful state change (explicit calls, not silent DB triggers, so the audit entry can carry business context like "why", not just "what changed").
- Alternative/complementary approach for blanket coverage: a `unit-of-work`-level hook that automatically diffs entity state before/after a transaction commits and writes an audit row with `before_state`/`after_state` as JSON — worth adding once enough modules exist that manual `AuditService.record()` calls everywhere become error-prone to keep consistent.
- Audit records are **immutable** — no update/delete endpoint exists for `audit_logs` at the API layer; the table itself should have restricted DB-level privileges (the application's DB user can `INSERT`/`SELECT` but not `UPDATE`/`DELETE` on this table) so even a compromised application credential can't erase its own trail.
- Audit log viewing is itself permission-gated (`audit.log.view`) and should default to a very small set of roles (System Admin, HR Admin) given the sensitivity of performance data.

**Audit entry shape (recap from §4):**
```
actor_user_id, action, entity_type, entity_id,
before_state (JSON), after_state (JSON),
ip_address, user_agent, created_at
```

---

## 16. Coding Standards

- **TypeScript strict mode** (`"strict": true`) across both apps — no `any` except at well-justified, commented boundaries (e.g. a third-party SDK with no types).
- **ESLint + Prettier**, shared base config in `packages/shared-config`, enforced via pre-commit hook (`husky` + `lint-staged`) and again in CI (never rely on local hooks alone).
- **Architecture boundary linting**: `dependency-cruiser` or `eslint-plugin-boundaries` configured to fail the build if `domain`/`application` import from `infrastructure`/`presentation`, or if one module imports another module's internal folders directly instead of its public `index.ts` barrel.
- **No business logic in controllers.** A controller that does more than parse input, call one service method, and shape output is a code-review flag.
- **No raw SQL/query builder calls outside `infrastructure/*/repositories`.**
- **DTOs, not entities, cross layer boundaries** outward — domain entities never get serialized directly to an HTTP response; a mapper converts entity → response DTO, so internal fields (e.g. password hash) can never accidentally leak.
- **Validation at the edge**: every request body/query/params validated with a schema (zod) before reaching the controller logic.
- **Tests required** for: every service method (unit, with repository interfaces mocked), every repository (integration, against a real test MySQL instance/testcontainer), and critical auth/rbac flows (integration/e2e). Target meaningful coverage on `application` and `domain` layers specifically, not a blanket percentage vanity metric.
- **Commit convention:** Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`) to drive changelogs and semantic version bumps automatically.
- **PR requirements:** at least one review, passing CI (lint, type-check, tests, boundary-lint), and a linked ticket/ADR reference for anything architecture-affecting.

---

## 17. Naming Standards

| Item | Convention | Example |
|---|---|---|
| Files (backend, general) | `kebab-case` with role suffix | `user.service.ts`, `user.repository.ts`, `user.controller.ts` |
| Files (frontend components) | `PascalCase` | `EvaluationCard.tsx` |
| Files (frontend hooks/utils) | `camelCase` | `useHasPermission.ts` |
| Classes / Interfaces | `PascalCase`, interfaces prefixed `I` | `UserService`, `IUserRepository` |
| Types / DTOs | `PascalCase`, DTO suffix where relevant | `CreateUserDto`, `UserResponseDto` |
| Variables / functions | `camelCase` | `getUserById` |
| Constants / enums | `SCREAMING_SNAKE_CASE` for literal constants; `PascalCase` for enum names, `PascalCase` members | `MAX_LOGIN_ATTEMPTS`, `enum UserStatus { Active, Suspended }` |
| Database tables | `snake_case`, plural | `users`, `role_permissions` |
| Database columns | `snake_case` | `created_at`, `password_hash` |
| Permission keys | `module.resource.action[.qualifier]`, lowerCamel segments | `evaluation.record.view.department` |
| API routes | plural kebab-case nouns | `/api/v1/audit-logs` |
| React components (folder per component, optional) | `PascalCase` folder matching component | `EvaluationCard/EvaluationCard.tsx` |
| Environment variables | `SCREAMING_SNAKE_CASE` | `JWT_ACCESS_SECRET` |
| Git branches | `type/short-description` | `feat/rbac-scoped-permissions` |
| Module folder names | `kebab-case`, singular or domain-plural as natural | `identity`, `rbac`, `organization` |

Consistency here matters more than any individual choice — the rule is: pick these, write them down (this table is the source of truth), lint what can be linted (filenames via a naming ESLint rule), and review the rest.

---

## 18. Versioning Strategy

**API versioning:**
- URL-path versioning: `/api/v1/...` — chosen over header-based versioning for its visibility/debuggability, especially valuable for a platform integrated with factory-floor kiosk/terminal clients that may be harder to update.
- A new major version (`/api/v2`) is introduced only for breaking changes; additive/non-breaking changes (new optional fields, new endpoints) ship within the existing version.
- Deprecated versions are supported for a documented sunset window (e.g., 6–12 months) with a `Deprecation` and `Sunset` response header once a new version supersedes them.

**Application/release versioning:**
- Semantic Versioning (`MAJOR.MINOR.PATCH`) for both backend and frontend, driven automatically from Conventional Commits (`semantic-release` or `changesets`).
- `MAJOR` — breaking API contract change or schema change requiring coordinated migration.
- `MINOR` — new module or feature, backward compatible.
- `PATCH` — bug fixes, non-breaking internal changes.

**Database versioning:**
- Every schema change is a numbered, timestamped migration file, checked into version control, applied in strict order, and never edited after being merged — a schema mistake is fixed with a new forward migration, not by rewriting history.
- Each module owns its own migration files (`modules/<module>/infrastructure/database/migrations` or a centralized `migrations/` folder namespaced by module prefix) so a module's schema history travels with the module.

**Module versioning (internal):**
- Each module's public contract (`index.ts` barrel export + its DTOs in `shared-types`) is treated as an internal API. Changing it is a breaking change for any other module or the frontend that consumes it, and should be called out in the PR/changelog explicitly — this discipline is what actually keeps "every module independent" true over time, rather than just true on day one.

**Frontend/backend compatibility:**
- `shared-types` package is versioned alongside the monorepo release; the frontend build fails if it references a type/DTO shape the current backend version no longer produces, catching drift at build time rather than in production.

---

## Summary

This gives the platform: a Clean Architecture backend with strict layer boundaries and a Repository/Service split, a modular structure where every module (starting with the foundational `identity`, `rbac`, `audit`, `notification`, and `organization` modules) is independently developable and eventually independently deployable, a feature-modular React frontend that mirrors the backend's module boundaries, a RBAC + scoped-permission authorization model built for an organization with hierarchy (departments, sites, shifts, managers), and the operational scaffolding (logging, error handling, audit trail, environment management, deployment topology, versioning) an enterprise platform needs before a single business module is written.

No business/measurement modules (evaluations, scoring, KPIs, attendance, production metrics, etc.) are included in this document, per scope — they will be built as new entries under `modules/` and `apps/frontend/src/modules/`, following the `_module-template` pattern established here.
