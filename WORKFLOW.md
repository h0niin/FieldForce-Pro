# FieldForce Pro — Complete Workflow & URL Reference

## Architecture

| Service            | Port | URL                    |
|--------------------|------|------------------------|
| Server (NestJS)    | 3000 | `http://localhost:3000` |
| Web (React)        | 5173 | `http://localhost:5173` |
| AI (FastAPI)       | 8000 | `http://localhost:8000` |
| PostgreSQL         | 5432 | —                      |
| Redis              | 6379 | —                      |

---

## Phase 1: Authentication & Onboarding

### Web Pages

| Page            | URL                | Description                                      |
|-----------------|--------------------|--------------------------------------------------|
| Register        | `/register`        | New tenant signup — name, email, password, company |
| Login           | `/login`           | Email + password authentication                  |
| Forgot Password | `/forgot-password` | Request password reset via email                 |

### Mobile Screens

| Screen          | Path                     | Description                                        |
|-----------------|--------------------------|----------------------------------------------------|
| Login           | `/(auth)/login`          | Biometric-first login (Face ID/fingerprint), password fallback |
| Forgot Password | `/(auth)/forgot-password`| Email-based password reset                         |
| Biometric Lock  | `/(auth)/biometric-lock` | Re-verify identity on app resume                   |

### Server API

| Method | Endpoint                              | Description                        |
|--------|---------------------------------------|------------------------------------|
| POST   | `/auth/register`                      | Create tenant + admin user         |
| POST   | `/auth/login`                         | Issue JWT access + refresh tokens  |
| POST   | `/auth/refresh`                       | Refresh expired access token       |
| GET    | `/auth/me`                            | Current user profile + permissions |
| POST   | `/auth/forgot-password`               | Trigger password reset email       |
| POST   | `/auth/reset-password`                | Reset password with token          |
| POST   | `/auth/change-password`               | Change password (authenticated)    |
| POST   | `/auth/logout`                        | Invalidate current session         |
| POST   | `/auth/logout-all`                    | Terminate all sessions             |
| GET    | `/auth/sessions`                      | List active login sessions         |
| POST   | `/auth/terminate-session/:sessionId`  | Terminate a specific session       |
| POST   | `/mfa/setup`                          | Setup MFA (TOTP/SMS/WebAuthn)      |
| POST   | `/mfa/verify`                         | Verify MFA code                    |
| POST   | `/mfa/enable`                         | Enable MFA after verification      |
| DELETE | `/mfa/disable`                        | Disable MFA                        |

---

## Phase 2: System Setup (Admin)

### Users & Roles

| Web URL             | Description                             |
|---------------------|-----------------------------------------|
| `/users`            | List all users                          |
| `/users/create`     | Create new user (dispatcher, agent, etc.) |
| `/users/:id`        | View user profile and details           |
| `/users/:id/edit`   | Edit user                               |
| `/settings/roles`   | Configure roles and granular permissions |

| Method | Server Endpoint                     | Description                  |
|--------|-------------------------------------|------------------------------|
| GET    | `/users`                            | List users (paginated)       |
| GET    | `/users/:id`                        | Get user by ID               |
| POST   | `/users`                            | Create user                  |
| PUT    | `/users/:id`                        | Update user                  |
| DELETE | `/users/:id`                        | Soft-delete user             |
| PATCH  | `/users/:id/activate`               | Activate user                |
| PATCH  | `/users/:id/deactivate`             | Deactivate user              |
| PATCH  | `/users/:id/avatar`                 | Update avatar                |
| GET    | `/roles`                            | List roles (paginated)       |
| GET    | `/roles/all`                        | List all roles               |
| GET    | `/roles/:id`                        | Get role by ID               |
| POST   | `/roles`                            | Create role                  |
| PUT    | `/roles/:id`                        | Update role                  |
| DELETE | `/roles/:id`                        | Delete role                  |
| GET    | `/roles/:id/permissions`            | Get permissions for role     |
| POST   | `/roles/:id/permissions`            | Assign permissions to role   |
| DELETE | `/roles/:id/permissions`            | Remove permissions from role |
| GET    | `/permissions`                      | List permissions (paginated) |
| GET    | `/permissions/all`                  | List all permissions         |
| GET    | `/permissions/module/:module`       | Permissions by module        |
| POST   | `/permissions/seed`                 | Seed system permissions      |
| POST   | `/permissions/bulk`                 | Bulk create permissions      |
| GET    | `/user-roles/user/:userId`          | Get roles for a user         |
| POST   | `/user-roles/user/:userId/role`     | Assign single role           |
| POST   | `/user-roles/user/:userId/roles`    | Assign multiple roles        |
| POST   | `/user-roles/bulk-assign`           | Bulk assign roles            |
| DELETE | `/user-roles/user/:userId/role/:roleId` | Remove role from user   |

### Settings & Security

| Web URL                        | Description                    |
|--------------------------------|--------------------------------|
| `/settings`                    | General settings (company, timezone, locale, currency) |
| `/settings/payment-gateways`   | Configure Stripe/Razorpay      |
| `/settings/email-sms-templates`| Email and SMS templates        |
| `/settings/notifications`      | Notification preferences       |
| `/security/audit-logs`         | View system audit logs         |
| `/security/settings`           | IP whitelisting, MFA enforcement |

| Method | Server Endpoint                    | Description              |
|--------|------------------------------------|--------------------------|
| GET    | `/settings`                        | Get all settings         |
| GET    | `/settings/category/:category`     | Get settings by category |
| GET    | `/settings/:key`                   | Get setting by key       |
| PUT    | `/settings/:key`                   | Upsert setting           |
| GET    | `/audit-logs`                      | List audit logs          |
| GET    | `/audit-logs/:id`                  | Get audit log by ID      |

---

## Phase 3: Master Data Setup

### Contacts

| Web URL                  | Description           |
|--------------------------|-----------------------|
| `/contacts`              | List all contacts     |
| `/contacts/new`          | Create contact        |
| `/contacts/:id`          | View contact details  |
| `/contacts/:id/edit`     | Edit contact          |

| Mobile Path       | Description          |
|--------------------|----------------------|
| `/contacts`        | Contact list (offline-capable) |
| `/contacts/[id]`   | Contact detail       |

| Method | Server Endpoint     | Description              |
|--------|---------------------|--------------------------|
| GET    | `/contacts`         | List contacts (paginated)|
| GET    | `/contacts/all`     | List all contacts        |
| GET    | `/contacts/:id`     | Get contact by ID        |
| POST   | `/contacts`         | Create contact           |
| PUT    | `/contacts/:id`     | Update contact           |
| DELETE | `/contacts/:id`     | Soft-delete contact      |

### Companies

| Web URL                  | Description           |
|--------------------------|-----------------------|
| `/companies`             | List all companies    |
| `/companies/new`         | Create company        |
| `/companies/:id`         | View company details  |
| `/companies/:id/edit`    | Edit company          |

| Mobile Path      | Description          |
|-------------------|----------------------|
| `/company`        | Company list         |
| `/company/[id]`   | Company detail       |

| Method | Server Endpoint      | Description               |
|--------|----------------------|---------------------------|
| GET    | `/companies`         | List companies (paginated)|
| GET    | `/companies/all`     | List all companies        |
| GET    | `/companies/:id`     | Get company by ID         |
| POST   | `/companies`         | Create company            |
| PUT    | `/companies/:id`     | Update company            |
| DELETE | `/companies/:id`     | Soft-delete company       |

### Service Locations

| Web URL                          | Description                |
|----------------------------------|----------------------------|
| `/service-locations`             | List all service locations |
| `/service-locations/new`         | Create location            |
| `/service-locations/:id`         | View location details      |
| `/service-locations/:id/edit`    | Edit location              |

| Mobile Path               | Description            |
|----------------------------|------------------------|
| `/service-location`        | Location list          |
| `/service-location/[id]`   | Location detail        |

| Method | Server Endpoint                                | Description                |
|--------|------------------------------------------------|----------------------------|
| GET    | `/service-locations`                           | List locations (paginated) |
| GET    | `/service-locations/all`                       | List all locations         |
| GET    | `/service-locations/:id`                       | Get location by ID         |
| GET    | `/service-locations/by-contact/:contactId`     | Get by contact             |
| GET    | `/service-locations/by-company/:companyId`     | Get by company             |
| POST   | `/service-locations`                           | Create location            |
| PUT    | `/service-locations/:id`                       | Update location            |
| DELETE | `/service-locations/:id`                       | Soft-delete location       |

### Catalog — Services

| Web URL                          | Description            |
|----------------------------------|------------------------|
| `/catalog/services`              | List service catalog   |
| `/catalog/services/new`          | Create service item    |
| `/catalog/services/:id/edit`     | Edit service item      |

| Method | Server Endpoint            | Description                |
|--------|----------------------------|----------------------------|
| GET    | `/services-catalog`        | List services (paginated)  |
| GET    | `/services-catalog/all`    | List all services          |
| GET    | `/services-catalog/:id`    | Get service by ID          |
| POST   | `/services-catalog`        | Create service             |
| PUT    | `/services-catalog/:id`    | Update service             |
| DELETE | `/services-catalog/:id`    | Soft-delete service        |

### Catalog — Parts

| Web URL                      | Description          |
|------------------------------|----------------------|
| `/catalog/parts`             | List parts catalog   |
| `/catalog/parts/new`         | Create part          |
| `/catalog/parts/:id/edit`    | Edit part            |

| Method | Server Endpoint         | Description              |
|--------|-------------------------|--------------------------|
| GET    | `/parts-catalog`        | List parts (paginated)   |
| GET    | `/parts-catalog/all`    | List all parts           |
| GET    | `/parts-catalog/:id`    | Get part by ID           |
| POST   | `/parts-catalog`        | Create part              |
| PUT    | `/parts-catalog/:id`    | Update part              |
| DELETE | `/parts-catalog/:id`    | Soft-delete part         |

### Pricebook

| Web URL                  | Description         |
|--------------------------|---------------------|
| `/pricebook`             | List pricebooks     |
| `/pricebook/new`         | Create pricebook    |
| `/pricebook/:id/edit`    | Edit pricebook      |

### Assets

| Web URL                      | Description                                  |
|------------------------------|----------------------------------------------|
| `/assets`                    | List all assets/equipment                    |
| `/assets/new`                | Register a new asset                         |
| `/assets/:id`                | View asset (health score, warranty, history) |
| `/assets/:id/edit`           | Edit asset                                   |

| Mobile Path             | Description                            |
|--------------------------|----------------------------------------|
| `/asset`                 | Asset list with barcode scanner        |
| `/asset/[id]`            | Asset detail (health score, warranty)  |
| `/asset/service-history` | Full service history for asset         |
| `/asset/new`             | Create new asset                       |

| Method | Server Endpoint     | Description             |
|--------|---------------------|-------------------------|
| GET    | `/assets`           | List assets (paginated) |
| GET    | `/assets/all`       | List all assets         |
| GET    | `/assets/:id`       | Get asset by ID         |
| POST   | `/assets`           | Create asset            |
| PUT    | `/assets/:id`       | Update asset            |
| DELETE | `/assets/:id`       | Soft-delete asset       |

### Maintenance Plans

| Web URL                              | Description              |
|--------------------------------------|--------------------------|
| `/maintenance-plans`                 | List maintenance plans   |
| `/maintenance-plans/new`             | Create plan              |
| `/maintenance-plans/:id`             | View plan details        |
| `/maintenance-plans/:id/edit`        | Edit plan                |

| Method | Server Endpoint                              | Description                |
|--------|----------------------------------------------|----------------------------|
| GET    | `/asset-maintenance-plans`                   | List plans (paginated)     |
| GET    | `/asset-maintenance-plans/asset/:assetId`    | Get plans by asset         |
| GET    | `/asset-maintenance-plans/:id`               | Get plan by ID             |
| POST   | `/asset-maintenance-plans`                   | Create plan                |
| PUT    | `/asset-maintenance-plans/:id`               | Update plan                |
| DELETE | `/asset-maintenance-plans/:id`               | Soft-delete plan           |

---

## Phase 4: Service Request Intake

Customer submits a request through webform, email, phone, portal, or API. AI auto-categorizes and suggests priority.

### Status Flow

```
New → Triaged → Estimated → Approved → Converted to WO → Closed → Spam
```

### Web Pages

| Web URL                          | Description              |
|----------------------------------|--------------------------|
| `/service-requests`              | List all service requests|
| `/service-requests/new`          | Create service request   |
| `/service-requests/:id`          | View and triage request  |
| `/service-requests/:id/edit`     | Edit request             |

### Webforms (Intake Channel)

| Web URL                  | Description            |
|--------------------------|------------------------|
| `/webforms`              | List webforms          |
| `/webforms/new`          | Create webform         |
| `/webforms/:id`          | View webform details   |
| `/webforms/:id/edit`     | Edit webform           |

| Method | Server Endpoint                        | Description                 |
|--------|----------------------------------------|-----------------------------|
| GET    | `/service-requests`                    | List requests (paginated)   |
| GET    | `/service-requests/all`                | List all requests           |
| GET    | `/service-requests/:id`                | Get request by ID           |
| POST   | `/service-requests`                    | Create request              |
| PUT    | `/service-requests/:id`                | Update request              |
| PATCH  | `/service-requests/:id/status`         | Update status               |
| DELETE | `/service-requests/:id`                | Soft-delete request         |
| GET    | `/webforms`                            | List webforms               |
| POST   | `/webforms`                            | Create webform              |
| PUT    | `/webforms/:id`                        | Update webform              |
| DELETE | `/webforms/:id`                        | Soft-delete webform         |

### AI Enhancement

| Method | AI Endpoint                  | Description                              |
|--------|------------------------------|------------------------------------------|
| POST   | `/api/analytics/sentiment`   | Analyze request tone for priority escalation |

---

## Phase 5: Estimate Creation & Approval

After triaging, a dispatcher creates an estimate with line items. The estimate is sent to the customer for digital approval.

### Status Flow

```
Draft → Sent → Viewed → Approved → Rejected → Expired → Converted to WO
```

### Web Pages

| Web URL                      | Description                         |
|------------------------------|-------------------------------------|
| `/estimates`                 | List all estimates                  |
| `/estimates/new`             | Create estimate (form)              |
| `/estimates/new/builder`     | Create estimate (visual builder)    |
| `/estimates/:id`             | View estimate details               |
| `/estimates/:id/edit`        | Edit estimate                       |
| `/estimates/:id/builder`     | Edit estimate in visual builder     |

| Method | Server Endpoint                              | Description                    |
|--------|----------------------------------------------|--------------------------------|
| GET    | `/estimates`                                 | List estimates (paginated)     |
| GET    | `/estimates/all`                             | List all estimates             |
| GET    | `/estimates/:id`                             | Get estimate by ID             |
| POST   | `/estimates`                                 | Create estimate                |
| PUT    | `/estimates/:id`                             | Update estimate                |
| PATCH  | `/estimates/:id/status`                      | Update status                  |
| DELETE | `/estimates/:id`                             | Soft-delete estimate           |
| POST   | `/estimates/:id/send`                        | Send to customer via email     |
| POST   | `/estimates/:id/approve`                     | Record customer approval       |
| POST   | `/estimates/:id/reject`                      | Record rejection               |
| POST   | `/estimates/:id/convert-to-work-order`       | Convert approved estimate → WO |
| GET    | `/estimates/:id/pdf`                         | Download PDF                   |

### Estimate Line Items

| Method | Server Endpoint                                    | Description                  |
|--------|----------------------------------------------------|------------------------------|
| GET    | `/estimate-line-items`                             | List line items (paginated)  |
| GET    | `/estimate-line-items/all`                         | List all line items          |
| GET    | `/estimate-line-items/estimate/:estimateId`        | Get by estimate              |
| GET    | `/estimate-line-items/:id`                         | Get line item by ID          |
| POST   | `/estimate-line-items`                             | Create line item             |
| PUT    | `/estimate-line-items/:id`                         | Update line item             |
| DELETE | `/estimate-line-items/:id`                         | Soft-delete line item        |

---

## Phase 6: Work Order Management

The core operational entity. Created from an estimate conversion, a service request, or manually.

### Status Flow

```
New → Estimated → Approved → Scheduled → In Progress → On Hold → Completed → Closed → Cancelled
```

### Web Pages

| Web URL                  | Description                                        |
|--------------------------|----------------------------------------------------|
| `/work-orders`           | List all work orders (filter by status, priority)  |
| `/work-orders/new`       | Create work order                                  |
| `/work-orders/:id`       | View WO (line items, notes, attachments, appointments) |
| `/work-orders/:id/edit`  | Edit work order                                    |

| Mobile Path                   | Description                              |
|--------------------------------|------------------------------------------|
| `/work-order/[id]`            | View WO details, customer info, line items |
| `/work-order/checklist/[id]`  | Complete job checklist with progress bar  |

| Method | Server Endpoint                                         | Description                |
|--------|---------------------------------------------------------|----------------------------|
| GET    | `/work-orders`                                          | List WOs (paginated)       |
| GET    | `/work-orders/all`                                      | List all WOs               |
| GET    | `/work-orders/:id`                                      | Get WO by ID               |
| POST   | `/work-orders`                                          | Create WO                  |
| PUT    | `/work-orders/:id`                                      | Update WO                  |
| PATCH  | `/work-orders/:id/status`                               | Transition WO status       |
| DELETE | `/work-orders/:id`                                      | Soft-delete WO             |
| POST   | `/work-orders/:id/generate-invoice`                     | Auto-generate invoice      |

### Work Order Line Items

| Method | Server Endpoint                                           | Description              |
|--------|-----------------------------------------------------------|--------------------------|
| GET    | `/work-order-line-items`                                  | List (paginated)         |
| GET    | `/work-order-line-items/all`                              | List all                 |
| GET    | `/work-order-line-items/work-order/:workOrderId`          | Get by work order        |
| GET    | `/work-order-line-items/:id`                              | Get by ID                |
| POST   | `/work-order-line-items`                                  | Create                   |
| PUT    | `/work-order-line-items/:id`                              | Update                   |
| DELETE | `/work-order-line-items/:id`                              | Soft-delete              |

### Work Order Notes

| Method | Server Endpoint                                      | Description        |
|--------|------------------------------------------------------|--------------------|
| GET    | `/work-order-notes`                                  | List (paginated)   |
| GET    | `/work-order-notes/all`                              | List all           |
| GET    | `/work-order-notes/work-order/:workOrderId`          | Get by work order  |
| GET    | `/work-order-notes/:id`                              | Get by ID          |
| POST   | `/work-order-notes`                                  | Create             |
| PUT    | `/work-order-notes/:id`                              | Update             |
| DELETE | `/work-order-notes/:id`                              | Soft-delete        |

### Work Order Attachments

| Method | Server Endpoint                                            | Description        |
|--------|------------------------------------------------------------|--------------------|
| GET    | `/work-order-attachments`                                  | List (paginated)   |
| GET    | `/work-order-attachments/all`                              | List all           |
| GET    | `/work-order-attachments/work-order/:workOrderId`          | Get by work order  |
| GET    | `/work-order-attachments/:id`                              | Get by ID          |
| POST   | `/work-order-attachments`                                  | Create             |
| PUT    | `/work-order-attachments/:id`                              | Update             |
| DELETE | `/work-order-attachments/:id`                              | Soft-delete        |

---

## Phase 7: Scheduling & Dispatch

Assign technicians, optimize routes, and create service appointments.

### Service Appointment Status Flow

```
Scheduled → Dispatched → In Transit → On Site → In Progress → On Hold → Completed → Cancelled
```

### Web Pages

| Web URL                  | Description                                  |
|--------------------------|----------------------------------------------|
| `/scheduling`            | Dispatch board — Gantt/drag-drop scheduling  |
| `/scheduling/new`        | Create service appointment                   |
| `/scheduling/:id/edit`   | Edit appointment                             |
| `/scheduling/calendar`   | Calendar view (day/week/month)               |
| `/scheduling/map`        | Map view — all appointments geographically   |
| `/workforce`             | Manage field agents (skills, availability)   |

| Mobile Path        | Description                                        |
|---------------------|----------------------------------------------------|
| `/(tabs)/schedule`  | Agent daily appointment list with date picker       |
| `/(tabs)/map`       | Map with color-coded appointment markers            |

| Method | Server Endpoint                                        | Description                  |
|--------|--------------------------------------------------------|------------------------------|
| GET    | `/service-appointments`                                | List appointments (paginated)|
| GET    | `/service-appointments/all`                            | List all appointments        |
| GET    | `/service-appointments/work-order/:workOrderId`        | Get by work order            |
| GET    | `/service-appointments/:id`                            | Get appointment by ID        |
| POST   | `/service-appointments`                                | Create appointment           |
| PUT    | `/service-appointments/:id`                            | Update appointment           |
| PATCH  | `/service-appointments/:id/status`                     | Update appointment status    |
| DELETE | `/service-appointments/:id`                            | Soft-delete appointment      |

### AI Scheduling Optimization

| Method | AI Endpoint                                | Description                                |
|--------|--------------------------------------------|--------------------------------------------|
| POST   | `/api/schedule/optimize`                   | AI-optimized scheduling (OR-Tools VRP)     |
| POST   | `/api/schedule/route`                      | Single-technician route optimization       |
| POST   | `/api/schedule/optimize/realtime`          | Real-time re-optimization with traffic     |
| GET    | `/api/schedule/optimize/status/:task_id`   | Check background optimization status       |
| POST   | `/api/schedule/forecast/demand`            | Forecast future service demand             |
| POST   | `/api/schedule/recommend/schedule`         | AI scheduling recommendations              |

---

## Phase 8: Field Execution (Mobile)

The field agent performs work on-site. This is the step-by-step mobile workflow.

### Step-by-Step Agent Flow

| Step | Screen             | Mobile Path                  | What Happens                                      |
|------|--------------------|------------------------------|---------------------------------------------------|
| 1    | Home               | `/(tabs)/home`               | View today's jobs, stats (open/in-progress/urgent)|
| 2    | Schedule           | `/(tabs)/schedule`           | View today's appointments with times and addresses|
| 3    | Appointment Detail | `/appointment/[id]`          | View appointment details, customer info, status   |
| 4    | Start Trip         | `/appointment/start-trip`    | Initiate GPS tracking, view map + destination     |
| 5    | Map View           | `/(tabs)/map`                | See all appointments on map with markers          |
| 6    | Arrive On Site     | `/appointment/on-site`       | Arrival checklist, site photos, customer contact  |
| 7    | Work Order Detail  | `/work-order/[id]`           | View full WO — line items, customer, schedule     |
| 8    | Job Checklist      | `/work-order/checklist/[id]` | Complete checklist items with notes and progress  |
| 9    | Capture Signature  | `/appointment/signature`     | Customer signs on device                          |
| 10   | Complete Job       | `/appointment/complete`      | Summary review + mark as complete                 |
| 11   | Timesheet          | `/timesheet`                 | Clock in/out with GPS location                    |

### Server API (Field Operations)

| Method | Server Endpoint                        | Description                     |
|--------|----------------------------------------|---------------------------------|
| POST   | `/trips/start`                         | Start trip (GPS tracking begins)|
| PATCH  | `/trips/:id/end`                       | End trip                        |
| POST   | `/agent-locations`                     | Submit GPS coordinate           |
| POST   | `/agent-locations/batch`               | Batch submit GPS coordinates    |
| PATCH  | `/service-appointments/:id/status`     | Update appointment status       |
| POST   | `/timesheets`                          | Clock in/out                    |

### AI — Vision (Quality Verification)

| Method | AI Endpoint                            | Description                          |
|--------|----------------------------------------|--------------------------------------|
| POST   | `/api/vision/verify-work`              | AI verifies work completion from photo |
| POST   | `/api/vision/identify-equipment`       | Identify equipment from photo        |
| POST   | `/api/vision/compare-before-after`     | Compare before/after photos          |

### AI — Voice

| Method | AI Endpoint                    | Description                    |
|--------|--------------------------------|--------------------------------|
| POST   | `/api/voice/transcribe`        | Voice-to-text for job notes    |
| POST   | `/api/voice/detect-language`   | Detect spoken language         |

---

## Phase 9: Job Sheets & Documentation

Standardized checklists and real-time documentation during field work.

### Web Pages

| Web URL                              | Description                        |
|--------------------------------------|------------------------------------|
| `/job-sheets/templates`              | List job sheet templates           |
| `/job-sheets/templates/new`          | Create job sheet template (builder)|
| `/job-sheets/templates/:id/edit`     | Edit template                      |
| `/job-sheets/dashboard`              | Job sheet completion analytics     |

| Mobile Path          | Description                  |
|-----------------------|------------------------------|
| `/documents`          | Document list                |
| `/documents/upload`   | Upload document              |
| `/documents/[id]`     | View document detail         |

| Method | Server Endpoint                                                | Description               |
|--------|----------------------------------------------------------------|---------------------------|
| GET    | `/job-sheet-templates`                                         | List templates (paginated)|
| GET    | `/job-sheet-templates/all`                                     | List all templates        |
| GET    | `/job-sheet-templates/:id`                                     | Get template by ID        |
| POST   | `/job-sheet-templates`                                         | Create template           |
| PUT    | `/job-sheet-templates/:id`                                     | Update template           |
| DELETE | `/job-sheet-templates/:id`                                     | Soft-delete template      |
| GET    | `/job-sheet-instances`                                         | List instances (paginated)|
| GET    | `/job-sheet-instances/appointment/:appointmentId`              | Get by appointment        |
| GET    | `/job-sheet-instances/work-order/:workOrderId`                 | Get by work order         |
| POST   | `/job-sheet-instances`                                         | Create instance           |
| PUT    | `/job-sheet-instances/:id`                                     | Update instance           |
| DELETE | `/job-sheet-instances/:id`                                     | Soft-delete instance      |
| POST   | `/documents/upload`                                            | Upload document           |
| GET    | `/documents`                                                   | List documents            |
| GET    | `/documents/:id`                                               | Get document by ID        |
| PUT    | `/documents/:id`                                               | Update document           |
| DELETE | `/documents/:id`                                               | Delete document           |

### AI — Document Processing

| Method | AI Endpoint                      | Description                        |
|--------|----------------------------------|------------------------------------|
| POST   | `/api/documents/parse`           | Parse uploaded PDF/image via OCR   |
| POST   | `/api/documents/parse/invoice`   | Extract invoice fields via OCR     |
| POST   | `/api/documents/generate`        | Generate PDF/Excel reports         |

---

## Phase 10: Invoicing & Payment

After work completion, an invoice is generated from the work order.

### Invoice Status Flow

```
Draft → Sent → Viewed → Partially Paid → Paid → Overdue → Void
```

### Web Pages

| Web URL                  | Description            |
|--------------------------|------------------------|
| `/invoices`              | List all invoices      |
| `/invoices/new`          | Create invoice         |
| `/invoices/:id`          | View invoice details   |
| `/invoices/:id/edit`     | Edit invoice           |
| `/payments`              | List all payments      |
| `/payments/new`          | Record a payment       |
| `/payments/:id`          | View payment details   |
| `/payments/:id/edit`     | Edit payment           |

| Method | Server Endpoint                          | Description                  |
|--------|------------------------------------------|------------------------------|
| GET    | `/invoices`                              | List invoices (paginated)    |
| GET    | `/invoices/all`                          | List all invoices            |
| GET    | `/invoices/:id`                          | Get invoice by ID            |
| POST   | `/invoices`                              | Create invoice               |
| PUT    | `/invoices/:id`                          | Update invoice               |
| PATCH  | `/invoices/:id/status`                   | Update invoice status        |
| DELETE | `/invoices/:id`                          | Soft-delete invoice          |
| GET    | `/invoices/:id/pdf`                      | Download invoice PDF         |
| POST   | `/work-orders/:id/generate-invoice`      | Auto-generate from WO        |

### Invoice Line Items

| Method | Server Endpoint                                  | Description            |
|--------|--------------------------------------------------|------------------------|
| GET    | `/invoice-line-items`                            | List (paginated)       |
| GET    | `/invoice-line-items/all`                        | List all               |
| GET    | `/invoice-line-items/invoice/:invoiceId`         | Get by invoice         |
| GET    | `/invoice-line-items/:id`                        | Get by ID              |
| POST   | `/invoice-line-items`                            | Create                 |
| PUT    | `/invoice-line-items/:id`                        | Update                 |
| DELETE | `/invoice-line-items/:id`                        | Soft-delete            |

### Payments

| Method | Server Endpoint                          | Description             |
|--------|------------------------------------------|-------------------------|
| GET    | `/payments`                              | List payments (paginated)|
| GET    | `/payments/all`                          | List all payments       |
| GET    | `/payments/invoice/:invoiceId`           | Get by invoice          |
| GET    | `/payments/:id`                          | Get payment by ID       |
| POST   | `/payments`                              | Create payment          |
| PUT    | `/payments/:id`                          | Update payment          |
| DELETE | `/payments/:id`                          | Soft-delete payment     |

---

## Phase 11: Service Agreements & SLA

Recurring contract management with SLA monitoring.

### Web Pages

| Web URL                          | Description                  |
|----------------------------------|------------------------------|
| `/agreements`                    | List service agreements      |
| `/agreements/new`                | Create agreement             |
| `/agreements/:id`                | View agreement details       |
| `/agreements/:id/edit`           | Edit agreement               |
| `/agreements/sla-compliance`     | SLA compliance dashboard     |

---

## Phase 12: Customer Engagement & Reviews

Post-service engagement including review solicitation, communications, and customer self-service portal.

### Web Pages

| Web URL                  | Description                            |
|--------------------------|----------------------------------------|
| `/reviews`               | List customer reviews                  |
| `/reviews/new`           | Create/solicit review                  |
| `/reviews/:id`           | View review details                    |
| `/reviews/:id/edit`      | Edit review                            |
| `/communications`        | List all communications (email, SMS)   |
| `/communications/:id`    | View communication detail              |

### Customer Portal

| Web URL               | Description                              |
|-----------------------|------------------------------------------|
| `/portal`             | Customer portal dashboard                |
| `/portal/tracking`    | Customer tracks service in real-time     |
| `/portal/payments`    | Customer views and pays invoices         |
| `/portal/history`     | Customer views service history           |

| Method | Server Endpoint                            | Description               |
|--------|--------------------------------------------|---------------------------|
| GET    | `/reviews`                                 | List reviews (paginated)  |
| POST   | `/reviews`                                 | Create review             |
| PUT    | `/reviews/:id`                             | Update review             |
| DELETE | `/reviews/:id`                             | Soft-delete review        |
| GET    | `/communications`                          | List communications       |
| GET    | `/communications/contact/:contactId`       | Get by contact            |
| POST   | `/communications`                          | Create communication      |
| PUT    | `/communications/:id`                      | Update communication      |
| DELETE | `/communications/:id`                      | Soft-delete communication |

### AI — Chatbot

| Method | AI Endpoint                          | Description                       |
|--------|--------------------------------------|-----------------------------------|
| POST   | `/api/chat/message`                  | AI chatbot for customer queries   |
| GET    | `/api/chat/history/:session_id`      | Get chat history                  |
| DELETE | `/api/chat/session/:session_id`      | Clear chat session                |
| POST   | `/api/chat/knowledge/ingest`         | Feed knowledge base for RAG       |

### AI — Sentiment Analysis

| Method | AI Endpoint                          | Description                 |
|--------|--------------------------------------|-----------------------------|
| POST   | `/api/analytics/sentiment`           | Single-text sentiment       |
| POST   | `/api/analytics/sentiment/batch`     | Batch sentiment analysis    |

---

## Phase 13: Tracking, Trips & Timesheets

Real-time GPS tracking, trip logging, and timesheet management.

### Web Pages

| Web URL                  | Description                                |
|--------------------------|--------------------------------------------|
| `/dashboard/live-map`    | Live map of all field agents               |
| `/tracking/live`         | Live agent tracking with breadcrumb trail  |
| `/trips/history`         | Historical trip records with mileage       |
| `/timesheets`            | Timesheet records (clock in/out, hours)    |
| `/timesheets/:id`        | Timesheet detail (approve/reject)          |

| Mobile Path            | Description                          |
|-------------------------|--------------------------------------|
| `/(tabs)/map`           | Live map view with all appointments  |
| `/timesheet`            | Clock in/out with GPS location       |

| Method | Server Endpoint                                    | Description                  |
|--------|----------------------------------------------------|------------------------------|
| GET    | `/trips`                                           | List trips (paginated)       |
| GET    | `/trips/all`                                       | List all trips               |
| GET    | `/trips/user/:userId`                              | Get trips by user            |
| GET    | `/trips/:id`                                       | Get trip by ID               |
| POST   | `/trips`                                           | Create trip                  |
| POST   | `/trips/start`                                     | Start trip                   |
| PATCH  | `/trips/:id/end`                                   | End trip                     |
| PUT    | `/trips/:id`                                       | Update trip                  |
| DELETE | `/trips/:id`                                       | Soft-delete trip             |
| GET    | `/agent-locations`                                 | List locations (paginated)   |
| GET    | `/agent-locations/user/:userId/latest`             | Latest location for user     |
| GET    | `/agent-locations/user/:userId/history`            | Location history (date range)|
| POST   | `/agent-locations`                                 | Submit GPS coordinate        |
| POST   | `/agent-locations/batch`                           | Batch submit coordinates     |
| GET    | `/timesheets`                                      | List timesheets (paginated)  |
| GET    | `/timesheets/user/:userId`                         | Get by user                  |
| GET    | `/timesheets/:id`                                  | Get timesheet by ID          |
| POST   | `/timesheets`                                      | Create (clock in/out)        |
| PUT    | `/timesheets/:id`                                  | Update timesheet             |
| PATCH  | `/timesheets/:id/approve`                          | Approve timesheet            |
| PATCH  | `/timesheets/:id/reject`                           | Reject timesheet             |
| DELETE | `/timesheets/:id`                                  | Soft-delete timesheet        |

---

## Phase 14: Automation & Customization

Blueprint engine, custom fields, workflow rules, and webhooks.

### Web Pages

| Web URL                                      | Description                          |
|----------------------------------------------|--------------------------------------|
| `/blueprints`                                | List blueprint state machines        |
| `/blueprints/:id`                            | Edit blueprint (states, transitions) |
| `/customization/custom-fields`               | List custom fields                   |
| `/customization/custom-fields/new`           | Create custom field                  |
| `/customization/custom-fields/:id/edit`      | Edit custom field                    |
| `/customization/templates`                   | List email/PDF templates             |
| `/customization/templates/new`               | Build template                       |
| `/customization/templates/:id/edit`          | Edit template                        |
| `/customization/workflow-rules`              | List automation rules                |
| `/customization/workflow-rules/new`          | Create rule                          |
| `/customization/workflow-rules/:id/edit`     | Edit rule                            |
| `/customization/webhooks`                    | List webhooks                        |
| `/customization/webhooks/new`                | Create webhook                       |
| `/customization/webhooks/:id/edit`           | Edit webhook                         |

| Method | Server Endpoint                                                    | Description                    |
|--------|--------------------------------------------------------------------|--------------------------------|
| GET    | `/blueprint-definitions`                                           | List blueprints (paginated)    |
| GET    | `/blueprint-definitions/:id`                                       | Get blueprint by ID            |
| POST   | `/blueprint-definitions`                                           | Create blueprint               |
| PUT    | `/blueprint-definitions/:id`                                       | Update blueprint               |
| DELETE | `/blueprint-definitions/:id`                                       | Soft-delete blueprint          |
| GET    | `/blueprint-definitions/:id/transitions/:fromStateId`              | Get available transitions      |
| POST   | `/blueprint-definitions/:id/validate-transition`                   | Validate transition            |
| POST   | `/blueprint-definitions/:id/execute-transition`                    | Execute transition             |
| GET    | `/workflow-rules`                                                  | List rules (paginated)         |
| POST   | `/workflow-rules`                                                  | Create rule                    |
| PUT    | `/workflow-rules/:id`                                              | Update rule                    |
| DELETE | `/workflow-rules/:id`                                              | Soft-delete rule               |
| GET    | `/webhooks`                                                        | List webhooks (paginated)      |
| POST   | `/webhooks`                                                        | Create webhook                 |
| PUT    | `/webhooks/:id`                                                    | Update webhook                 |
| DELETE | `/webhooks/:id`                                                    | Soft-delete webhook            |
| GET    | `/custom-fields`                                                   | List custom fields             |
| POST   | `/custom-fields`                                                   | Create custom field            |
| PUT    | `/custom-fields/:id`                                               | Update custom field            |
| DELETE | `/custom-fields/:id`                                               | Soft-delete custom field       |
| GET    | `/templates`                                                       | List templates                 |
| POST   | `/templates`                                                       | Create template                |
| PUT    | `/templates/:id`                                                   | Update template                |
| DELETE | `/templates/:id`                                                   | Soft-delete template           |

---

## Phase 15: AI Intelligence & Analytics

AI-powered dashboards, predictive maintenance, document processing, and natural language analytics.

### Web Pages

| Web URL                          | Description                                |
|----------------------------------|--------------------------------------------|
| `/maintenance/health-dashboard`  | Equipment health prediction dashboard      |
| `/documents/ai`                  | Document AI — upload and extract data      |
| `/analytics/ai`                  | Natural language analytics queries         |
| `/vision`                        | Vision AI dashboard — photo verification   |
| `/voice-notes`                   | Voice note transcription                   |
| `/reports`                       | Standard reports list                      |
| `/reports/:reportId`             | View specific report                       |
| `/reports/builder`               | Custom report builder                      |
| `/dashboard/builder`             | Custom dashboard builder                   |

### AI — Predictive Maintenance

| Method | AI Endpoint                              | Description                              |
|--------|------------------------------------------|------------------------------------------|
| POST   | `/api/predict/maintenance`               | Predict equipment maintenance needs      |
| POST   | `/api/predict/failure/lstm`              | LSTM model for failure prediction        |
| POST   | `/api/predict/failure/prophet`           | Prophet model for failure prediction     |
| POST   | `/api/predict/failure/ensemble`          | Ensemble (LSTM + Prophet) prediction     |
| POST   | `/api/predict/health-score`              | Equipment health score (0–100)           |
| POST   | `/api/predict/health-score/batch`        | Batch health scoring                     |
| POST   | `/api/predict/demand`                    | Demand forecasting                       |

### AI — IoT Data

| Method | AI Endpoint                              | Description                        |
|--------|------------------------------------------|------------------------------------|
| POST   | `/api/predict/iot/ingest`                | Ingest IoT sensor data             |
| POST   | `/api/predict/iot/anomalies`             | Detect anomalies in sensor data    |
| GET    | `/api/predict/iot/status/:equipment_id`  | Latest IoT status for equipment    |

### AI — Analytics

| Method | AI Endpoint                    | Description                              |
|--------|--------------------------------|------------------------------------------|
| POST   | `/api/analytics/nl-query`      | Natural language → structured queries    |
| POST   | `/api/analytics/forecast`      | Time-series forecasting                  |
| POST   | `/api/analytics/anomaly`       | Anomaly detection in time-series data    |

### AI — Route Optimization (Legacy)

| Method | AI Endpoint                          | Description                            |
|--------|--------------------------------------|----------------------------------------|
| POST   | `/api/routes/optimize`               | Multi-agent route optimization         |
| POST   | `/api/routes/analyze-trip`           | Post-trip analysis + efficiency scores |
| POST   | `/api/routes/predict-travel-time`    | Predict travel time between locations  |
| GET    | `/api/routes/health`                 | Route optimizer health check           |

---

## Phase 16: Notifications & Real-Time

Push notifications, in-app alerts, and WebSocket events.

| Mobile Path              | Description                  |
|---------------------------|------------------------------|
| `/(tabs)/notifications`   | Notification list with unread indicators |

| Mobile Path   | Description              |
|----------------|--------------------------|
| `/settings`    | Toggle notification preferences, location tracking, dark mode |

| Method | Server Endpoint                    | Description                  |
|--------|------------------------------------|------------------------------|
| GET    | `/notifications`                   | List notifications (paginated)|
| GET    | `/notifications/all`               | List all notifications       |
| GET    | `/notifications/:id`               | Get notification by ID       |
| POST   | `/notifications`                   | Create notification          |
| PUT    | `/notifications/:id`               | Update notification          |
| PATCH  | `/notifications/:id/read`          | Mark as read                 |
| PATCH  | `/notifications/mark-all-read`     | Mark all as read             |
| DELETE | `/notifications/:id`               | Soft-delete notification     |

**Real-time:** WebSocket via Socket.IO for live location updates, appointment status changes, and notification delivery.

---

## End-to-End Flow Summary

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  1. REGISTER / LOGIN                                           │
 │     Web: /register → /login                                    │
 │     Mobile: /(auth)/login                                      │
 ├─────────────────────────────────────────────────────────────────┤
 │  2. SYSTEM SETUP                                               │
 │     /users → /settings/roles → /settings                       │
 ├─────────────────────────────────────────────────────────────────┤
 │  3. MASTER DATA                                                │
 │     /contacts → /companies → /service-locations                │
 │     /catalog/services → /catalog/parts → /pricebook            │
 │     /assets → /maintenance-plans                               │
 ├─────────────────────────────────────────────────────────────────┤
 │  4. SERVICE REQUEST INTAKE                                     │
 │     /service-requests/new (or webform/email/API/portal)        │
 │     Status: New → Triaged                                      │
 ├─────────────────────────────────────────────────────────────────┤
 │  5. ESTIMATE                                                   │
 │     /estimates/new → send → customer approves                  │
 │     Status: Draft → Sent → Approved → Converted to WO          │
 ├─────────────────────────────────────────────────────────────────┤
 │  6. WORK ORDER                                                 │
 │     /work-orders/:id (created from estimate or manually)       │
 │     Status: New → Scheduled → In Progress → Completed → Closed │
 ├─────────────────────────────────────────────────────────────────┤
 │  7. SCHEDULE & DISPATCH                                        │
 │     /scheduling (dispatch board) → assign tech → create appt   │
 │     AI: /api/schedule/optimize                                 │
 ├─────────────────────────────────────────────────────────────────┤
 │  8. FIELD EXECUTION (Mobile)                                   │
 │     /(tabs)/home → /(tabs)/schedule → /appointment/[id]        │
 │     → /appointment/start-trip → /appointment/on-site           │
 │     → /work-order/checklist/[id] → /appointment/signature      │
 │     → /appointment/complete                                    │
 ├─────────────────────────────────────────────────────────────────┤
 │  9. JOB SHEETS & DOCS                                          │
 │     /job-sheets/templates → field checklist completion          │
 │     AI: /api/documents/parse, /api/vision/verify-work          │
 ├─────────────────────────────────────────────────────────────────┤
 │  10. INVOICE & PAYMENT                                         │
 │      /work-orders/:id/generate-invoice → /invoices/:id         │
 │      → /payments/new                                           │
 │      Status: Draft → Sent → Paid                               │
 ├─────────────────────────────────────────────────────────────────┤
 │  11. CUSTOMER ENGAGEMENT                                       │
 │      /reviews → /communications → /portal                      │
 │      AI: /api/chat/message, /api/analytics/sentiment           │
 ├─────────────────────────────────────────────────────────────────┤
 │  12. ANALYTICS & AI                                            │
 │      /reports → /analytics/ai → /maintenance/health-dashboard  │
 │      AI: /api/predict/*, /api/analytics/*                      │
 └─────────────────────────────────────────────────────────────────┘
```

---

## Module Count Summary

| Platform       | Count         |
|----------------|---------------|
| Server Modules | 69            |
| Web Pages      | 80+           |
| Mobile Screens | 20+           |
| AI Endpoints   | 43            |
| Server API Endpoints | 200+   |
