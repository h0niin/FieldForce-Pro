# Platform Overview

## What is FieldForce Pro?

FieldForce Pro is a web-based Field Service Management (FSM) platform. It centralises work orders, scheduling, dispatch, customer management, invoicing, and reporting for field service businesses (HVAC, plumbing, electrical, cleaning, security, landscaping, etc.).

## Navigation

The application is divided into two areas:

**Sidebar (left):** Primary navigation. Sections include:
- Dashboard / Home
- Service Requests
- Work Orders
- Scheduling
- Contacts (customers and companies)
- Service Locations
- Assets
- Invoices
- Estimates
- Timesheets
- Reports
- Settings
- Admin (super-admin only)

**Top bar:** User profile, notifications bell, theme toggle (light/dark), and the AI assistant (Max) chat button.

## User Roles

| Role | Primary Access |
|------|----------------|
| **Admin** | Full access — all modules, settings, user management |
| **Dispatcher** | Service requests, work orders, scheduling, contacts |
| **Technician** | Assigned work orders (read/update), timesheets, mobile app |
| **Manager** | Reports, approvals, read-only across all modules |

Roles and their exact permissions are configurable in **Settings → Roles & Permissions**.

## Status Workflows

Every entity follows a defined status lifecycle. Status transitions are validated server-side — you cannot skip steps.

### Work Order statuses (in order)
`New` → `Estimated` → `Approved` → `Scheduled` → `In Progress` → `On Hold` → `Completed` → `Closed` → `Cancelled`

### Service Request statuses
`New` → `Triaged` → `Estimated` → `Approved` → `Converted to WO` → `Closed` → `Spam`

### Estimate statuses
`Draft` → `Sent` → `Viewed` → `Approved` → `Rejected` → `Expired` → `Converted to WO`

### Invoice statuses
`Draft` → `Sent` → `Viewed` → `Partially Paid` → `Paid` → `Overdue` → `Void`

### Service Appointment statuses
`Scheduled` → `Dispatched` → `In Transit` → `On Site` → `In Progress` → `On Hold` → `Completed` → `Cancelled`

## Multi-Tenant Architecture

Each organisation (tenant) is fully isolated. Users can only see data belonging to their own tenant. Tenant settings are managed under **Settings → Organisation**.

## Search and Filters

Most list pages (Work Orders, Contacts, Invoices, etc.) support:
- A **search bar** at the top — searches across name, ID, and key fields
- **Column filters** — click a column header arrow to sort; use the filter icon for advanced filtering
- **Date range pickers** on reports and log views
- **Status filter dropdowns** — filter by one or more statuses
