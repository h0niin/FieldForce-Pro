# Super Admin Features (Hanin)

Implemented a Super Admin Dashboard Redesign with additional features including Audit Logs, API Keys Management, System Health Monitoring, and Usage & Billing Analytics.

---

# 👉[Video Demo](video-demo.mp4)

<video src="https://github.com/user-attachments/assets/e0632474-26b5-4c04-a0d9-07a9d8c9b491"></video>

---

## Problem (Before)

The FieldForce-Pro application had a `is_super_admin` flag on the `User` model, but there was no dedicated interface or centralized module for super admins to manage cross-tenant operations. Specifically:
- **No visibility into platform adoption:** Super admins couldn't see MRR, total revenue, or work-orders easily.
- **No system health monitoring:** Checking the status of the database and Redis required manual infrastructure access.
- **No automated cross-tenant access:** Super admins lacked the ability to generate long-lived API keys for integration or scripting.
- **No audit trail:** Critical administrative actions were not logged or tracked centrally.

## Solution (After)

Created a new `SUPER_ADMIN` module in the NestJS backend and corresponding pages in the React frontend, accessible only to users with the `is_super_admin` flag. 

### 1. Audit Logs
- **Backend**: Implemented `SuperAdminAuditLogsService` and `SuperAdminAuditLog` entity to track cross-tenant actions.
- **Frontend**: Added a filterable, paginated `AuditLogsPage` with CSV export capabilities.

### 2. API Keys Management
- **Backend**: Implemented `SuperAdminApiKeysService` to manage long-lived hashed tokens for super-admin automation.
- **Frontend**: Added `ApiKeysPage` allowing admins to generate, view, regenerate, and revoke API keys.

### 3. Usage & Billing Analytics
- **Backend**: Built `SuperAdminAnalyticsService` to aggregate cross-tenant statistics like MRR, active users, and work orders.
- **Frontend**: Added `AnalyticsDashboardPage` with interactive Recharts graphs showing revenue trends and adoption by plan.

### 4. System Health Monitoring
- **Backend**: Created `SuperAdminHealthService` to verify operational status of Postgres and Redis (via `RedisCacheService.ping()`).
- **Frontend**: Built `SystemHealthPage` to display real-time service availability and performance metrics.

---

## Files Changed

### Backend

- **`server/src/SUPER_ADMIN/SUPER_ADMIN_API_KEYS/*`** (NEW)
  - `super_admin_api_keys.entity.ts`: Defines the API key model with hashed keys and expiration.
  - `super_admin_api_keys.service.ts`: Handles CRUD and key regeneration.
- **`server/src/SUPER_ADMIN/SUPER_ADMIN_AUDIT_LOGS/*`** (NEW)
  - `super_admin_audit_logs.entity.ts`: Defines the audit log model.
  - `super_admin_audit_logs.service.ts`: Handles logging actions and fetching paginated history.
- **`server/src/SUPER_ADMIN/SUPER_ADMIN_HEALTH/*`** (NEW)
  - `super_admin_health.service.ts`: Integrates with Sequelize and Redis to determine system health.
- **`server/src/SUPER_ADMIN/SUPER_ADMIN_ANALYTICS/*`** (NEW)
  - `super_admin_analytics.service.ts`: Aggregates usage metrics across all tenants.
- **`server/src/SUPER_ADMIN/super_admin.controller.ts`** (MODIFIED/NEW endpoints)
  - Exposed all the new services via REST endpoints prefixed with `/admin`.
- **`server/src/SUPER_ADMIN/super_admin.module.ts`** (MODIFIED)
  - Registered all new entities and services.
- **`server/src/shared/services/redis-cache.service.ts`** (MODIFIED)
  - Added a `ping()` method to test Redis connectivity.

### Frontend

- **`web/src/pages/super-admin/*`** (NEW)
  - `AuditLogsPage.tsx`
  - `ApiKeysPage.tsx`
  - `AnalyticsDashboardPage.tsx`
  - `SystemHealthPage.tsx`
- **`web/src/api/super-admin-*.api.ts`** (NEW)
  - Created strongly typed Axios API client files for analytics, api-keys, audit-logs, and health.
- **`web/src/hooks/use-super-admin-*.ts`** (NEW)
  - Created React Query hooks for fetching and mutating super admin data.
- **`web/src/routes.tsx`** (MODIFIED)
  - Added the new super admin routes under `/admin/*`.
- **`web/src/components/layout/Sidebar.tsx`** (MODIFIED)
  - Dynamically renders a "Super Admin" navigation section if the logged-in user is a super admin.

---

## API Contract

All new APIs are accessible at the `/admin/*` route prefix. 
They require authentication and the caller must possess the `is_super_admin: true` flag.

- **`GET /admin/analytics/overview`**: Returns high-level metrics.
- **`GET /admin/analytics/revenue`**: Returns revenue trends.
- **`GET /admin/analytics/adoption`**: Returns tenant counts grouped by subscription plan.
- **`GET /admin/health/status`**: Returns health status of DB, Redis, and API.
- **`GET /admin/audit-logs`**: Returns paginated audit logs.
- **`GET /admin/audit-logs/export`**: Returns CSV of audit logs.
- **`GET /admin/api-keys`**: Returns a list of active API keys.
- **`POST /admin/api-keys`**: Generates a new API key.
- **`PATCH /admin/api-keys/:id/regenerate`**: Regenerates an existing API key.
- **`DELETE /admin/api-keys/:id`**: Revokes an API key.
