# CLAUDE.md — Project Instructions for Claude Code

## 1. Project Overview

**FieldForce Pro** is an AI-Powered Field Service Management platform comprising four codebases:

- **server/** — NestJS backend (REST API, WebSockets, Sequelize ORM, PostgreSQL)
- **web/** — React frontend (Vite, Ant Design 5, TanStack Query, Zustand)
- **mobile/** — React Native + Expo (Expo Router, WatermelonDB, MMKV)
- **ai/** — FastAPI AI/ML service (Pydantic v2, Celery, Redis)

Reference documents:
- `IMPLEMENTATION_PLAN_V3.md` — Master plan and authoritative spec for all features
- `ALL_TASKS.md` — Task tracking with checkbox status

---

## 2. Task Completion Protocol

Whenever ANY task is completed, follow this protocol without exception:

1. **Cross-reference IMPLEMENTATION_PLAN_V3.md** for the authoritative spec of what the feature must do.
2. **Update ALL_TASKS.md** by changing `[ ]` to `[x]` for every completed sub-task.
3. **Run the appropriate validation model** (see Section 3 below) before marking done.
4. **Never mark a task complete without passing validation.**

---

## 3. Validation Models

### A. Server API Validation

- [ ] Entity/model file exists with all fields from IMPLEMENTATION_PLAN_V3.md
- [ ] DTOs exist (create, update, response) with class-validator decorators
- [ ] Provider file follows the Sequelize provider pattern
- [ ] Service file implements: findAll (paginated, tenant-scoped), findById, create, update, soft-delete
- [ ] Controller file has proper decorators: @UseGuards(JwtAuthGuard), @Permissions(), @TenantId()
- [ ] Module file imports/exports correctly and is registered in app.module.ts
- [ ] All responses use DataResponseDto wrapper
- [ ] Pagination uses PageOptionsDto/PageMetaDto pattern
- [ ] Soft delete pattern: is_deleted boolean, all queries filter is_deleted: false
- [ ] Swagger decorators (@ApiTags, @ApiOperation, @ApiBearerAuth) on all endpoints
- [ ] Multi-tenancy: all queries scoped by tenant_id from JWT
- [ ] Status transitions validated against IMPLEMENTATION_PLAN_V3.md status flows
- [ ] Endpoint tested manually or via automated test (HTTP 200 for valid, 401/403 for unauthorized)

### B. Web UI Validation

- [ ] API file exists in web/src/api/ with all endpoints for the module
- [ ] TanStack Query hook exists in web/src/hooks/ with proper cache keys
- [ ] List page uses DataTable component with pagination, search, filters
- [ ] Detail page shows all entity fields with proper formatting
- [ ] Form page uses React Hook Form + Zod validation matching server DTOs
- [ ] Status badges use correct colors from IMPLEMENTATION_PLAN_V3.md status flows
- [ ] Page registered in routes.tsx with proper auth guard
- [ ] Sidebar navigation entry added
- [ ] Responsive layout works (desktop and tablet)
- [ ] Loading states, empty states, and error states handled
- [ ] Permission-based rendering: buttons/actions hidden if user lacks permission
- [ ] Ant Design components used consistently (no raw HTML for standard UI)
- [ ] Forms submit correctly and show success/error notifications
- [ ] List refreshes after create/update/delete operations (TanStack Query invalidation)

### C. Mobile UI Validation

- [ ] Screen file exists in mobile/app/ directory
- [ ] WatermelonDB model exists if entity needs offline support
- [ ] Offline sync works: data available without network
- [ ] Navigation works from tab bar and deep links
- [ ] Forms validate input before submission
- [ ] Loading indicators shown during API calls
- [ ] Pull-to-refresh implemented on list screens
- [ ] Proper keyboard handling (dismiss, scroll into view)
- [ ] Camera/location permissions requested gracefully

### D. AI Service Validation

- [ ] Model class exists with graceful import (try/except with *_AVAILABLE flag)
- [ ] Endpoint returns placeholder response when ML lib unavailable
- [ ] Endpoint returns proper ApiResponse envelope ({statusCode, status, message, data})
- [ ] JWT authentication enforced on all endpoints
- [ ] Request/response Pydantic schemas defined
- [ ] Celery task created for long-running operations
- [ ] Unit test exists and passes
- [ ] Endpoint accessible via Swagger at /api/docs

### E. Cross-Platform Integration Validation

- [ ] Server endpoint works end-to-end (Postman/curl test)
- [ ] Web page calls correct server endpoint
- [ ] Mobile screen calls correct server endpoint
- [ ] AI service called from server (if applicable) with proper error handling
- [ ] JWT token flows correctly across all platforms
- [ ] Response format consistent ({statusCode, status, message, data, meta})
- [ ] WebSocket events fire correctly for real-time features

### F. Feature Completeness Validation

- [ ] All fields from IMPLEMENTATION_PLAN_V3.md entity definition are implemented
- [ ] All status transitions from Section 1.2 are enforced
- [ ] All CRUD operations work (Create, Read single, Read list paginated, Update, Soft Delete)
- [ ] Search/filter works on list endpoints
- [ ] Related entities are properly linked (foreign keys, includes)
- [ ] Audit log entry created for CUD operations (when audit_logs module exists)

---

## 4. Code Standards

### Server (NestJS)
- NestJS module pattern (controller, service, module, provider, DTOs)
- Sequelize models with sequelize-typescript decorators (@Table, @Column, @ForeignKey, @BelongsTo)
- DTOs with class-validator decorators (@IsString, @IsUUID, @IsOptional, etc.)
- TypeScript strict typing — no `any` types unless unavoidable

### Web (React)
- Functional components only
- TypeScript strict mode
- Ant Design 5 for all UI components
- Zustand for global state (auth, theme, sidebar)
- TanStack Query for server state (caching, invalidation, optimistic updates)
- No `any` types unless unavoidable

### Mobile (React Native + Expo)
- Expo Router file-based routing
- WatermelonDB for offline-first data persistence
- MMKV for key-value storage (tokens, preferences)
- TypeScript strict typing — no `any` types unless unavoidable

### AI (FastAPI)
- Pydantic v2 models for request/response validation
- FastAPI dependency injection for auth, database, config
- Graceful ML imports (try/except with *_AVAILABLE flags)
- Celery for async and long-running tasks
- Python strict typing with type hints on all functions

### All Platforms
- TypeScript or Python strict typing everywhere
- No `any` types unless absolutely unavoidable and documented with a comment

---

## 5. Status Flow Reference (from IMPLEMENTATION_PLAN_V3.md Section 1.2)

### Work Order
```
New → Estimated → Approved → Scheduled → In Progress → On Hold → Completed → Closed → Cancelled
```

### Service Appointment
```
Scheduled → Dispatched → In Transit → On Site → In Progress → On Hold → Completed → Cancelled
```

### Estimate
```
Draft → Sent → Viewed → Approved → Rejected → Expired → Converted to WO
```

### Invoice
```
Draft → Sent → Viewed → Partially Paid → Paid → Overdue → Void
```

### Service Request
```
New → Triaged → Estimated → Approved → Converted to WO → Closed → Spam
```

---

## 6. Database Conventions

- **All tables** must have: `id` (UUID, primary key), `tenant_id` (FK to tenants), `created_at`, `updated_at`, `is_deleted` (boolean, default false)
- **Soft delete only** — never hard delete rows from any table
- **JSONB columns** for flexible data: `custom_fields`, `settings`, `metadata`
- **Provider pattern**: each entity has a provider file exporting `{ provide: 'XxxRepository', useValue: XxxEntity }`
- All queries must filter `is_deleted: false` unless explicitly querying deleted records
- Foreign keys reference UUID `id` columns of related tables

---

## 7. Architecture Quick Reference

| Service    | Port  | Notes                        |
|------------|-------|------------------------------|
| Server     | 3000  | NestJS REST API + WebSockets |
| Web        | 5173  | Vite dev server              |
| AI         | 8000  | FastAPI service              |
| PostgreSQL | 5432  | Primary database             |
| Redis      | 6379  | Caching + Celery broker      |

**Shared configuration**: `JWT_SECRET` must match between server and ai services.
