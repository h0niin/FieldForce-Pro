# WF-SA-super-admin-suite — Super Admin Suite (Platform Operations)

## Module
Super Admin — `SuperAdminDashboardPage` (`/admin/tenants`), `TenantDetailPage` (`/admin/tenants/:id`), `SystemHealthPage` (`/admin/platform-health`), `AuditLogsPage` (`/admin/audit-logs`), `ApiKeysPage` (`/admin/api-keys`), `AnalyticsDashboardPage` (`/admin/analytics`), `SuperAdminProfilePage` (`/admin/profile`), `SubscriptionMagicLinksPage` (`/admin/magic-links`)

## Prerequisites
- These pages require a **Super Admin account** (`is_super_admin = true`). All routes above are guarded by `SuperAdminRoute`.
- Regular tenant users **cannot** access any Super Admin page — they manage a single tenant, whereas the Super Admin operates across all tenants on the platform.

---

## Steps — Tenants Dashboard (`/admin/tenants`)

1. The page title reads **"Super Admin Dashboard"** with a subtitle.
2. Four platform stat cards appear at the top (from `usePlatformHealth`): **Total Tenants**, **Active Tenants**, **Total Users**, and **Service Requests**.
3. A **search box** filters the tenant list by company name, admin email, or slug.
4. A tenant table (from `useAllTenants`) lists every tenant with columns: **Company** (name + `/slug`), **Admin Email** (copyable), **Registered** date, **Users** count, **Service Requests** count, **Plan** (tag: enterprise/professional/other), and **Status** (Active / Suspended tag, filterable).
5. Per-row **Actions**:
   - **Access Dashboard** (eye icon) — navigates to `/admin/tenants/{id}` to view that tenant.
   - **Onboarding Link** (link icon, shown only if the tenant has an admin user) — generates an admin onboarding magic link via `useGenerateMagicLink` and opens the `MagicLinkModal`.
   - **Suspend** (stop icon, when active) — Popconfirm, then `useSuspendTenant`.
   - **Reactivate** (play icon, when suspended) — Popconfirm, then `useActivateTenant`.
6. The table is paginated (20 per page, page-size changer enabled).

---

## Steps — Tenant Detail (`/admin/tenants/:id`)

1. A **warning banner** at the top states the Super Admin is viewing this tenant (read-only view) and offers an **Exit Tenant View** button back to `/admin/tenants`.
2. The header shows the tenant **name** and `/slug`, an Active/Suspended status tag, and a **Suspend Tenant** or **Reactivate Tenant** button (Popconfirm-guarded; `useSuspendTenant` / `useActivateTenant`).
3. Four stat cards (from `useTenantOverview`): **Users**, **Service Requests**, **Work Orders**, **Invoices**.
4. A **Subscription** card shows Plan, Status (tag), and Subscription End date, plus a **users usage** progress bar (from `useTenantUsage`; shows "Unlimited" when no limit). An **Update Subscription** button (edit icon) opens a modal.
5. The **Update Subscription** modal (`useUpdateTenantSubscription`) has fields: **Subscription Plan** (select, from `useSubscriptionPlans`, showing name + monthly price), **Status** (trial / active / suspended / cancelled / expired), **Subscription End Date** (date picker), and **Max Users Override** (number). Save Changes submits.
6. A **Tenant Information** descriptions panel lists: Company Name, Slug, Admin Email (copyable), Admin Name, Subscription Plan, Max Users, Domain, Status, Registered, and Last Updated.
7. A footer **Exit Tenant View** button returns to `/admin/tenants`.

---

## Steps — Platform Health (`/admin/platform-health`)

1. The page title reads **"System Health"** with a subtitle (data from `useSuperAdminHealth`).
2. An **Overall Status** line shows a colored tag (HEALTHY / DEGRADED / UNHEALTHY) and the last-checked timestamp.
3. Three service cards each show a status tag in the header:
   - **API** — uptime (hours), memory usage progress bar (used MB / total MB), and CPU load.
   - **Database** — query latency (ms); a high-latency warning appears if latency exceeds 100 ms.
   - **Redis** — ping latency (ms); a high-latency warning appears if ping exceeds 50 ms.

---

## Steps — Audit Logs (`/admin/audit-logs`)

1. The page title reads **"Audit Logs"** with a subtitle and an **Export CSV** button (download icon) in the header.
2. A **Filter by Action** select narrows results to: **Create API Key**, **Revoke API Key**, or **Regenerate API Key**.
3. The log table (from `useSuperAdminAuditLogs`) has columns: **Date**, **Action** (blue tag), **Resource**, **Target ID** (copyable), **IP Address**, and **Details** (JSON, truncated with tooltip).
4. The table is server-paginated (page and limit controlled by state).
5. Clicking **Export CSV** (`useExportSuperAdminAuditLogs`) builds a CSV client-side from the fetched logs and downloads `audit_logs_<timestamp>.csv`.

---

## Steps — API Keys (`/admin/api-keys`)

1. The page title reads **"API Keys"** with a subtitle and a **Generate New Key** button (plus icon) in the header.
2. The keys table (from `useSuperAdminApiKeys`) has columns: **Key Name**, **Status** (Active / Revoked tag), **Created At**, **Last Used** (or "Never"), **Expires At** (or "Never"), and **Actions**.
3. Per-row Actions (only for active keys):
   - **Regenerate** (sync icon) — Popconfirm, then `useRegenerateSuperAdminApiKey`; the new key is shown in the modal.
   - **Revoke** (delete icon) — Popconfirm (danger), then `useRevokeSuperAdminApiKey`.
4. The **Generate API Key** modal has fields **Key Name** (required) and **Expires In Days** (optional number); submitting calls `useCreateSuperAdminApiKey`.
5. After generation/regeneration, the modal shows the **generated key** once with a copy-warning ("copy now") and a copyable monospace value; a **Done** button closes it.

---

## Steps — Usage & Billing Analytics (`/admin/analytics`)

1. The page title reads **"Usage & Billing Analytics"** with a subtitle.
2. Four stat cards (from `useSuperAdminAnalyticsOverview`): **Monthly Recurring Revenue (MRR)**, **Total Revenue**, **Active Users**, and **Total Work Orders**.
3. A **Revenue Trends** area chart (from `useSuperAdminRevenueTrends('monthly')`) plots revenue over time.
4. An **Adoption by Plan** table (from `useSuperAdminAdoptionMetrics`) lists each **Subscription Plan** and its **Number of Tenants**.

---

## Steps — Super Admin Profile (`/admin/profile`)

1. A **Back to Dashboard** link returns to `/admin/tenants`. The header reads **"My Profile"** with the signed-in email.
2. **Profile Details** card — edit **First Name** and **Last Name** (React Hook Form + Zod validation); **Save Changes** calls `useUpdateSuperAdminProfile`.
3. **Change Email** card — shows current email (disabled), and a form for **New Email Address** plus **current password** to confirm; **Update** calls `useChangeSuperAdminEmail`.
4. **Change Password** card — fields **Current Password**, **New Password** (min 8 chars, must include uppercase, lowercase, number, special char), and **Confirm Password**; submits via `useChangePassword`.
5. **Super Admin Magic Link** card — a **Generate** button creates a `super_admin_access` magic link for the current user (`useGenerateMagicLink`) and shows it in the `MagicLinkModal`.

---

## Steps — Subscription Magic Links (`/admin/magic-links`)

1. The page title reads **"Subscription Magic Links"** with a **Generate Link** button (plus icon) in the header.
2. Four stat cards summarize the links: **Total Links**, **Active**, **Used**, **Expired**.
3. The links table (from `useSubscriptionMagicLinks`) has columns: **Plan** (name + monthly price), **Status** (active / expired / used / disabled tag), **Uses** (used_count / max_uses), **Created By** (creator name), **Created**, **Expires** (red if past), **Notes**, and **Actions**.
4. Per-row Actions:
   - **Disable link** (stop icon, active links only) — Popconfirm, then `useDisableSubscriptionMagicLink`.
   - **Delete link** (delete icon, non-used links only) — Popconfirm, then `useDeleteSubscriptionMagicLink`.
5. The **Generate Subscription Magic Link** modal has fields: **Subscription Plan** (required select, from `useSubscriptionPlans`), **Max Uses** (default 1), **Expires In (days)** (default 7), and **Notes** (internal only); **Generate Link** calls `useGenerateSubscriptionMagicLink`.
6. The **Magic Link Generated** modal shows the single-use **Signup URL** (copyable, expires in 7 days by default) with a **Copy Link** button.

---

## Actions Summary

| Action | Page | Permission | API |
|---|---|---|---|
| View platform stats & tenant list | Tenants Dashboard | Super Admin | `usePlatformHealth`, `useAllTenants` |
| Suspend tenant | Tenants Dashboard / Tenant Detail | Super Admin | `useSuspendTenant` |
| Reactivate tenant | Tenants Dashboard / Tenant Detail | Super Admin | `useActivateTenant` |
| Send admin onboarding link | Tenants Dashboard | Super Admin | `useGenerateMagicLink` (`admin_onboarding`) |
| View tenant detail & usage | Tenant Detail | Super Admin | `useTenantOverview`, `useTenantUsage` |
| Update tenant subscription | Tenant Detail | Super Admin | `useUpdateTenantSubscription`, `useSubscriptionPlans` |
| Monitor platform health | Platform Health | Super Admin | `useSuperAdminHealth` |
| View / filter audit logs | Audit Logs | Super Admin | `useSuperAdminAuditLogs` |
| Export audit logs CSV | Audit Logs | Super Admin | `useExportSuperAdminAuditLogs` (client-side CSV) |
| List API keys | API Keys | Super Admin | `useSuperAdminApiKeys` |
| Generate API key | API Keys | Super Admin | `useCreateSuperAdminApiKey` |
| Regenerate API key | API Keys | Super Admin | `useRegenerateSuperAdminApiKey` |
| Revoke API key | API Keys | Super Admin | `useRevokeSuperAdminApiKey` |
| View usage & billing analytics | Analytics | Super Admin | `useSuperAdminAnalyticsOverview`, `useSuperAdminRevenueTrends`, `useSuperAdminAdoptionMetrics` |
| Update own profile name | Profile | Super Admin | `useUpdateSuperAdminProfile` |
| Change own email | Profile | Super Admin | `useChangeSuperAdminEmail` |
| Change own password | Profile | Super Admin | `useChangePassword` |
| Generate super admin access link | Profile | Super Admin | `useGenerateMagicLink` (`super_admin_access`) |
| List subscription magic links | Subscription Magic Links | Super Admin | `useSubscriptionMagicLinks` |
| Generate subscription magic link | Subscription Magic Links | Super Admin | `useGenerateSubscriptionMagicLink`, `useSubscriptionPlans` |
| Disable subscription magic link | Subscription Magic Links | Super Admin | `useDisableSubscriptionMagicLink` |
| Delete subscription magic link | Subscription Magic Links | Super Admin | `useDeleteSubscriptionMagicLink` |
