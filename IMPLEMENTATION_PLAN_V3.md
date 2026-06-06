# FieldForce Pro - Complete Implementation Plan (v2.0)

## AI-Powered Field Service Management Software

> **Updated after deep study of Zoho FSM, ServiceTitan, Housecall Pro, Jobber, and 2026 industry trends**
> **Server folder structure modeled after lms-server-master architecture**

---

## Table of Contents

1. [Zoho FSM Deep Analysis - What We're Beating](#1-zoho-fsm-deep-analysis)
2. [Our Competitive Advantages](#2-our-competitive-advantages)
3. [Tech Stack](#3-tech-stack)
4. [Folder Structure](#4-folder-structure)
5. [Database Schema Overview](#5-database-schema-overview)
6. [Development Phases](#6-development-phases)
7. [Workflow Summary](#7-workflow-summary)

---

## 1. Zoho FSM Deep Analysis

> This section documents every Zoho FSM capability so developers know exactly what we must match and exceed.

### 1.1 Zoho FSM Complete Module Map

| Module | What Zoho Has | Our Response |
|--------|--------------|--------------|
| **Contacts & Companies** | Centralized contact details, service histories, personalized dashboards, company management, multi-location, tax compliance | Match all + AI-powered 360° customer profiles with sentiment tracking and churn prediction |
| **Assets** | Customer asset registry, service history per asset, maintenance plans | Match + IoT sensor integration, predictive failure detection, equipment health scoring |
| **Services & Parts** | Service/parts catalog, pricing, tax | Match + AI-suggested pricing, dynamic pricebook with good/better/best options |
| **Requests** | Multi-channel intake (email, portal, webform, phone, API), auto-assignment rules, round-robin, priority/category | Match all + AI auto-categorization, sentiment-based priority escalation, SMS/WhatsApp intake |
| **Estimates** | Line items (services/parts/travel), tax/discount, PDF templates, email send, digital signature approval, convert to WO, expiry | Match all + AI-generated estimates from request description, conversion rate analytics |
| **Work Orders** | Full lifecycle (New→Scheduled→InProgress→OnHold→Completed→Closed), line items, custom fields, notes, attachments, tags, recurring WOs | Match all + Blueprint engine with visual state machine editor, AI work time prediction |
| **Schedule & Dispatch** | Gantt chart, drag-drop, calendar (day/week/month), skill matching, territory routing, availability check, travel time, conflict detection | Match all + AI-driven auto-scheduling, real-time route optimization, demand forecasting |
| **Service Appointments** | Multi-tech, recurring, crew assignment, independent status tracking per appointment | Match all + AI optimal crew composition, split/merge appointments |
| **Job Sheets** | Standardized checklists, real-time documentation, photo capture | Match + Dynamic checklist builder with conditional logic, AI-verified completion |
| **Mobile App** | iOS/Android, offline, schedule view, navigation, photos, signatures, payments, timesheets, trip logging | Match all + AR guidance, voice interface, computer vision, barcode scanner, offline-first architecture |
| **Timesheets** | Work hour tracking, agent performance monitoring, mobile entry | Match + Auto-calculation (travel vs work time), overtime alerts, payroll export |
| **Agent Location & Trips** | Real-time GPS, travel logs, live map | Match + Geofencing, breadcrumb trails, mileage calculation, fuel cost tracking |
| **Service Reports** | On-site notes, photos, signatures, auto-generated reports | Match + LLM-generated narrative reports, before/after comparison AI |
| **Invoicing** | Branded invoices via Zoho Books/Invoice, multi-currency, country-specific tax, PDF templates | Match all + OCR vendor invoice parsing, AI auto-generation from WO, recurring invoices |
| **Payments** | Online/offline collection, multiple gateways, customer portal payments | Match + On-site tap-to-pay (Stripe Terminal), same-day settlement, partial payments, payment plans |
| **Workforce** | Users (Admin/Dispatcher/Agent), crews, skills, equipment, territories, shifts, time-off, holidays | Match all + Fully customizable RBAC (not fixed profiles), contractor/gig worker support |
| **Channels** | Email, WhatsApp, Webforms, push notifications, automated alerts | Match + SMS, AI chatbot, voice assistants, proactive outreach, in-app messaging |
| **Customization** | Custom fields (15+ types), templates, 25+ languages, custom functions (Deluge scripting) | Match + Visual low-code workflow builder (replaces Deluge), industry templates |
| **Automation** | Workflow rules, webhooks, custom code, Blueprints (visual state machines with transition guards) | Match all + AI-powered automation suggestions, event streaming (Kafka-style) |
| **Reports & Dashboard** | 40+ standard reports, custom reports, configurable dashboards, CSV/Excel/PDF export | Match + NL query ("show SLA compliance by region"), predictive KPIs, AI narrative insights |
| **Security** | Encryption, RBAC, audit logs | Match + Biometric MFA, hardware security keys, SOC 2/GDPR/HIPAA, zero-trust |
| **Integrations** | Zoho Books, Zoho CRM, Zoho Desk, Bigin, WhatsApp, REST APIs, payment gateways | Match APIs + Open connectors for any CRM/ERP, IoT platforms, calendar sync, accounting sync |

### 1.2 Zoho FSM Status Flows (We Must Match These Exactly)

**Work Order Lifecycle:**
```
New → Estimated → Approved → Scheduled → In Progress → On Hold → Completed → Closed → Cancelled
```

**Service Appointment Lifecycle:**
```
Scheduled → Dispatched → In Transit → On Site → In Progress → On Hold → Completed → Cancelled
```

**Estimate Lifecycle:**
```
Draft → Sent → Viewed → Approved → Rejected → Expired → Converted to WO
```

**Invoice Lifecycle:**
```
Draft → Sent → Viewed → Partially Paid → Paid → Overdue → Void
```

**Service Request Lifecycle:**
```
New → Triaged → Estimated → Approved → Converted to WO → Closed → Spam
```

### 1.3 Zoho FSM Pricing Model (What We're Competing Against)

| Plan | Price | Appointments | Key Features |
|------|-------|-------------|--------------|
| **Free** | $0 | 30/month | Basic WO, scheduling, mobile, 1 user |
| **Standard** | ~$30/user/month | Unlimited | All core modules, custom fields, API |
| **Professional** | ~$50/user/month | Unlimited | + Crews, territories, advanced automation, WhatsApp |

**Our pricing strategy:** Per-user pricing with generous free tier (5 users, 100 WO/month). Undercut Zoho on price while delivering 10x the AI value.

### 1.4 14 Critical Zoho Weaknesses We're Targeting

| # | Weakness | Our Advantage |
|---|----------|---------------|
| 1 | Manual/rule-based scheduling only (Gantt + drag-drop) | ML-driven dynamic scheduling with OR-Tools + PyTorch |
| 2 | No route optimization (basic map integration only) | Real-time multi-stop VRP solver with traffic awareness |
| 3 | No IoT integration (basic asset registry) | IoT sensor ingestion + LSTM/Prophet failure prediction |
| 4 | No predictive maintenance | Equipment health scoring + automated WO creation |
| 5 | Fixed user roles (Admin/Dispatcher/Agent) | Fully customizable RBAC with dynamic permission builder |
| 6 | No AI chatbot | RAG-powered 24/7 chatbot with knowledge base |
| 7 | No document intelligence | OCR + LLM for invoice parsing, report generation |
| 8 | No computer vision | YOLOv8 for work verification, equipment identification |
| 9 | No AR guidance | ARKit/ARCore overlays for complex repairs |
| 10 | No voice interface | Voice-to-text job notes, voice commands |
| 11 | Basic analytics (backward-looking only) | Predictive KPIs, anomaly detection, NL queries |
| 12 | No worker self-service portal | Full portal: schedules, pay, training, leave, benefits |
| 13 | No service agreements/contracts | Recurring contract management with SLA monitoring |
| 14 | Zoho-ecosystem lock-in | Open APIs + connectors for any CRM/ERP/IoT platform |

---

## 2. Our Competitive Advantages

### 2.1 Features Borrowed from Competitors

| Source | Feature | Implementation |
|--------|---------|---------------|
| **ServiceTitan** | Pricebook with good/better/best | Dynamic pricing engine with presentation modes |
| **ServiceTitan** | Technician scorecards + gamification | Performance dashboard with leaderboards, badges, rewards |
| **ServiceTitan** | Marketing ROI tracking | Campaign attribution per service request |
| **Housecall Pro** | Automated review collection | Post-service Google/Yelp review solicitation |
| **Housecall Pro** | Same-day payouts (Instapay) | Stripe Instant Payouts for contractors |
| **Housecall Pro** | Online booking from Google | Embeddable booking widget + Google Reserve API |
| **Jobber** | Client hub (self-service portal) | Customer portal: quotes, approvals, payments, tracking |
| **Jobber** | Batch invoicing | Bulk invoice generation for property managers |
| **Jobber** | Chemical/compliance tracking | Industry-specific compliance modules |
| **FieldEdge** | QuickBooks deep sync (two-way) | Bidirectional accounting sync (QB, Xero, Zoho Books) |
| **FieldEdge** | Equipment warranty alerts | Automated warranty expiry notifications + renewal WOs |

### 2.2 AI Features as Competitive Moat

| AI Module | Technology | What It Does |
|-----------|-----------|--------------|
| **Smart Scheduling** | Google OR-Tools + PyTorch | Solves VRP with time windows, skills, territories. Reduces travel 30% |
| **Predictive Maintenance** | LSTM + Prophet | Forecasts equipment failure from IoT data. Prevents 50% unplanned downtime |
| **AI Chatbot** | RAG + LLM (GPT-4/Claude) | 24/7 customer support, booking, status checks. Deflects 40% of queries |
| **Document Intelligence** | PaddleOCR + LLM | Extracts data from invoices, generates reports. Eliminates manual entry |
| **Smart Analytics** | Prophet + Isolation Forest | Revenue forecasting, anomaly detection, NL queries. Predictive KPIs |
| **Computer Vision** | YOLOv8 + SAM | Verifies work quality from photos, identifies equipment. Reduces QA costs |
| **Voice AI** | Whisper + TTS | Hands-free job notes, voice commands. Critical for safety-sensitive work |
| **Sentiment Analysis** | Transformer models | Analyzes customer feedback tone. Early warning for churn risk |

---

## 3. Tech Stack

### 3.1 Server (NestJS)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | NestJS 10.x | Modular REST API framework |
| **ORM** | Sequelize 6.x + sequelize-typescript | PostgreSQL ORM with decorators |
| **Database** | PostgreSQL 16 | Primary relational database |
| **Cache** | @nestjs/cache-manager + Redis | In-memory caching (TTL-based) |
| **Auth** | @nestjs/passport + passport-jwt + passport-local | JWT + Local authentication strategies |
| **API Docs** | @nestjs/swagger 7.x | OpenAPI/Swagger auto-documentation |
| **Validation** | class-validator + class-transformer | DTO validation with decorators |
| **Queue** | BullMQ + Redis | Background job processing |
| **WebSocket** | Socket.IO | Real-time events (location, notifications) |
| **File Storage** | AWS S3 / Google Cloud Storage | File uploads (photos, documents, signatures) |
| **Email** | @nestjs-modules/mailer + SendGrid | Transactional emails |
| **Scheduler** | @nestjs/schedule | Cron jobs (reminders, SLA checks) |
| **PDF** | Puppeteer | Invoice/report PDF generation |
| **Image Processing** | Sharp | Image compression and transformation |
| **Payments** | Stripe SDK / Razorpay | Payment processing |
| **Push Notifications** | firebase-admin | Mobile push notifications via FCM |

### 3.2 Web (React)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 18 + Vite | SPA with fast HMR |
| **UI Library** | Ant Design 5 | Enterprise-grade component library |
| **State** | Zustand | Lightweight global state management |
| **Data Fetching** | TanStack Query v5 | Server state, caching, pagination |
| **Routing** | React Router 6 | Client-side routing with guards |
| **Forms** | React Hook Form + Zod | Form management with schema validation |
| **Charts** | Apache ECharts | Dashboards, Gantt charts, analytics |
| **Maps** | Mapbox GL JS | Live maps, route visualization, geofencing |
| **DnD** | @dnd-kit | Drag-and-drop scheduling board |
| **Tables** | TanStack Table | Sortable, filterable data tables |
| **Real-time** | Socket.IO Client | Live updates, notifications |
| **i18n** | react-i18next | 25+ language support |

### 3.3 Mobile (React Native + Expo)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React Native + Expo SDK 50 | Cross-platform mobile |
| **Navigation** | Expo Router | File-based routing |
| **Offline DB** | WatermelonDB | Offline-first with sync |
| **Location** | expo-location | GPS tracking, geofencing |
| **Camera** | expo-camera | Photo capture, barcode scanning |
| **Maps** | react-native-maps + Mapbox | Navigation, route display |
| **Signatures** | react-native-signature-canvas | Digital signature capture |
| **Push** | expo-notifications + FCM | Push notifications |
| **State** | Zustand + MMKV | Fast persistent state |
| **Forms** | React Hook Form + Zod | Form validation |

### 3.4 AI Service (FastAPI)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | FastAPI | High-performance Python API |
| **Scheduling** | Google OR-Tools | Vehicle Routing Problem solver |
| **ML** | PyTorch + scikit-learn | Model training and inference |
| **Time Series** | Prophet + LSTM | Demand forecasting, predictive maintenance |
| **Vision** | YOLOv8 + Ultralytics | Object detection, work verification |
| **OCR** | PaddleOCR | Document text extraction |
| **LLM** | OpenAI/Claude API + LangChain | Chatbot, report generation, NL queries |
| **Vector DB** | Qdrant | RAG knowledge base for chatbot |
| **Task Queue** | Celery + Redis | Async ML job processing |
| **Speech** | Whisper | Voice-to-text transcription |

---

## 4. Folder Structure

### 4.1 Server (NestJS) — Modeled After lms-server-master

```
server/
├── .eslintrc.js
├── .prettierrc
├── .nvmrc
├── .gitignore
├── .env
├── .env.example
├── config.ts                              # Configuration entry point
├── config/
│   └── default.ts                         # Default config values
├── nest-cli.json
├── nodemon.json
├── nodemon-debug.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── tslint.json
│
├── db/                                    # Database migrations & seeders
│   ├── config.js                          # Sequelize CLI config (JS)
│   ├── config.ts                          # Sequelize CLI config (TS)
│
├── test/
│   ├── jest-e2e.json
│   └── app.e2e-spec.ts
│
└── src/
    ├── main.ts                            # Bootstrap: NestApp, ValidationPipe, Swagger, CORS, body-parser
    ├── app.module.ts                      # Root module: imports all feature modules
    ├── swagger.ts                         # Swagger/OpenAPI documentation setup
    │
    ├── database/
    │   ├── database.module.ts             # Database connection module (Sequelize)
    │   ├── database.providers.ts          # All entity providers (provide: 'XxxRepository', useValue: XxxEntity)
    │   └── seeders/
    │       └── initial-seed-data.ts       # Programmatic seed data
    │
    ├── shared/
    │   ├── shared.module.ts               # Global shared providers module
    │   ├── config/
    │   │   └── config.service.ts          # ConfigService: DB, JWT, Firebase, S3, Stripe, Redis configs
    │   ├── constants/
    │   │   ├── constants.ts               # Enums (Order, Status), pagination defaults
    │   │   ├── keynames.ts                # Repository key names
    │   │   └── status-flows.ts            # WO, Appointment, Estimate, Invoice status enums & transitions
    │   ├── decorator/
    │   │   ├── public.decorator.ts        # @Public() - skip JWT auth
    │   │   ├── permission.decorator.ts    # @Permissions(...) - RBAC check
    │   │   ├── tenant.decorator.ts        # @TenantId() - extract tenant from JWT
    │   │   ├── current-user.decorator.ts  # @CurrentUser() - inject user from request
    │   │   ├── user-id.decorator.ts       # @UserId() - extract user ID
    │   │   └── dto-data-array.decorator.ts
    │   ├── dto/
    │   │   ├── data-response.dto.ts       # Standard response wrapper { statusCode, status, message, data, meta }
    │   │   ├── page-options.dto.ts        # Pagination: page, take, skip, order
    │   │   ├── page-meta.dto.ts           # Pagination meta: itemCount, pageCount, hasPrevious, hasNext
    │   │   ├── page.dto.ts               # Paginated response wrapper
    │   │   └── index.ts
    │   ├── enum/
    │   │   ├── work-order-status.enum.ts
    │   │   ├── appointment-status.enum.ts
    │   │   ├── estimate-status.enum.ts
    │   │   ├── invoice-status.enum.ts
    │   │   ├── request-status.enum.ts
    │   │   ├── payment-status.enum.ts
    │   │   ├── priority.enum.ts
    │   │   └── line-item-type.enum.ts     # service | part | travel
    │   ├── guards/
    │   │   ├── tenant.guard.ts            # Multi-tenancy guard
    │   │   └── permission.guard.ts        # RBAC permission guard
    │   ├── helpers/
    │   │   ├── error-message.ts           # Error messaging utilities
    │   │   ├── slug.ts                    # Slug generation
    │   │   └── date-utils.ts             # Date formatting, timezone helpers
    │   ├── interceptors/
    │   │   ├── transform.interceptor.ts   # Response transformation
    │   │   └── logging.interceptor.ts     # Request/response logging
    │   ├── interfaces/
    │   │   ├── paginated-result.interface.ts
    │   │   └── jwt-payload.interface.ts
    │   ├── pipes/
    │   │   ├── file-size.pipe.ts          # File size validation
    │   │   └── validate-image.pipe.ts     # Image format validation
    │   ├── filters/
    │   │   └── http-exception.filter.ts   # Global exception filter
    │   ├── middleware/
    │   │   └── tenant.middleware.ts        # Extract tenant_id from JWT and attach to request
    │   └── services/
    │       ├── file-upload.service.ts     # S3/GCS file uploads
    │       ├── file-upload.module.ts
    │       ├── mail.service.ts            # Email sending (@nestjs-modules/mailer)
    │       └── sms.service.ts             # SMS sending (Twilio/MessageBird)
    │
    ├── auth/
    │   ├── auth.controller.ts             # Login, register, refresh, logout, forgot-password, reset-password
    │   ├── auth.service.ts                # Auth logic: validate, generateToken, refreshToken
    │   ├── auth.module.ts
    │   ├── auth.dto.ts                    # Login, register, refresh DTOs
    │   ├── guards/
    │   │   ├── jwt-auth.guard.ts          # JWT authentication guard
    │   │   └── local-auth.guard.ts        # Local (email+password) guard
    │   ├── strategies/
    │   │   ├── jwt.strategy.ts            # JWT Passport strategy
    │   │   └── local.strategy.ts          # Local Passport strategy
    │   │
    │   ├── PERMISSIONS/
    │   │   ├── permission.controller.ts
    │   │   ├── permission.service.ts
    │   │   ├── permission.module.ts
    │   │   ├── permission.provider.ts
    │   │   ├── dto/
    │   │   │   ├── permission.dto.ts
    │   │   │   ├── permission_create.dto.ts
    │   │   │   └── permission_update.dto.ts
    │   │   └── models/
    │   │       └── permission.model.ts
    │   │
    │   ├── ROLES/
    │   │   ├── role.controller.ts
    │   │   ├── role.service.ts
    │   │   ├── role.module.ts
    │   │   ├── role.provider.ts
    │   │   ├── dto/
    │   │   │   ├── role.dto.ts
    │   │   │   ├── role_create.dto.ts
    │   │   │   └── role_update.dto.ts
    │   │   └── models/
    │   │       └── role.model.ts
    │   │
    │   └── ROLE_PERMISSION/
    │       ├── role_permission.controller.ts
    │       ├── role_permission.service.ts
    │       ├── role_permission.module.ts
    │       ├── role_permission.provider.ts
    │       ├── dto/
    │       │   └── role_permission.dto.ts
    │       └── models/
    │           └── role_permission.model.ts
    │
    ├── JWT_MODULE/
    │   └── jwt.module.ts                  # Global JWT module with async factory
    │
    ├── FIREBASE/
    │   ├── firebase.controller.ts         # FCM token registration
    │   ├── firebase-public.controller.ts  # Public push notification endpoints
    │   ├── firebase.service.ts            # Push notification sending via FCM
    │   ├── firebase.module.ts
    │   └── firebase.provider.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  MULTI-TENANCY
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── TENANTS/
    │   ├── tenants.controller.ts
    │   ├── tenants.service.ts
    │   ├── tenants.entity.ts              # id, name, slug, domain, logo, settings (JSONB), subscription_plan, is_active
    │   ├── tenants.module.ts
    │   ├── tenants.provider.ts
    │   └── dto/
    │       ├── tenants.dto.ts
    │       ├── tenants_create.dto.ts
    │       └── tenants_update.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  USER MANAGEMENT
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── USERS/
    │   ├── users.controller.ts            # CRUD, profile, change-password, avatar upload
    │   ├── users.service.ts               # User business logic, password hashing (bcrypt)
    │   ├── users.entity.ts                # id, tenant_id, email, password_hash, first_name, last_name, phone, avatar, is_active, is_deleted
    │   ├── users.module.ts
    │   ├── users.provider.ts
    │   └── dto/
    │       ├── users.dto.ts
    │       ├── users_create.dto.ts
    │       ├── users_update.dto.ts
    │       └── users_login.dto.ts
    │
    ├── USER_ROLES/
    │   ├── user_roles.controller.ts
    │   ├── user_roles.service.ts
    │   ├── user_roles.entity.ts           # id, user_id, role_id
    │   ├── user_roles.module.ts
    │   ├── user_roles.provider.ts
    │   └── dto/
    │       ├── user_roles.dto.ts
    │       ├── user_roles_create.dto.ts
    │       ├── user_roles_update.dto.ts
    │       └── user_roles_bulk_assign.dto.ts
    │
    ├── USER_DOCUMENTS/
    │   ├── user_documents.controller.ts
    │   ├── user_documents.service.ts
    │   ├── user_documents.entity.ts       # id, user_id, document_type, file_url, expiry_date
    │   ├── user_documents.module.ts
    │   ├── user_documents.provider.ts
    │   └── dto/
    │       ├── user_documents.dto.ts
    │       ├── user_documents_create.dto.ts
    │       └── user_documents_update.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  CUSTOMER & CONTACT MANAGEMENT
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── CONTACTS/
    │   ├── contacts.controller.ts         # CRUD, search, paginated list, service history
    │   ├── contacts.service.ts
    │   ├── contacts.entity.ts             # id, tenant_id, company_id, first_name, last_name, email, phone, address, tags, custom_fields (JSONB)
    │   ├── contacts.module.ts
    │   ├── contacts.provider.ts
    │   └── dto/
    │       ├── contacts.dto.ts
    │       ├── contacts_create.dto.ts
    │       └── contacts_update.dto.ts
    │
    ├── COMPANIES/
    │   ├── companies.controller.ts
    │   ├── companies.service.ts
    │   ├── companies.entity.ts            # id, tenant_id, name, industry, billing_address, tax_id, website, notes
    │   ├── companies.module.ts
    │   ├── companies.provider.ts
    │   └── dto/
    │       ├── companies.dto.ts
    │       ├── companies_create.dto.ts
    │       └── companies_update.dto.ts
    │
    ├── SERVICE_LOCATIONS/
    │   ├── service_locations.controller.ts
    │   ├── service_locations.service.ts
    │   ├── service_locations.entity.ts    # id, tenant_id, contact_id, company_id, address, lat, lng, access_notes, gate_code
    │   ├── service_locations.module.ts
    │   ├── service_locations.provider.ts
    │   └── dto/
    │       ├── service_locations.dto.ts
    │       ├── service_locations_create.dto.ts
    │       └── service_locations_update.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  ASSET MANAGEMENT
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── ASSETS/
    │   ├── assets.controller.ts           # CRUD, service history per asset, maintenance schedule
    │   ├── assets.service.ts
    │   ├── assets.entity.ts               # id, tenant_id, contact_id, location_id, name, model, serial_number, manufacturer, install_date, warranty_expiry, health_score, custom_fields (JSONB)
    │   ├── assets.module.ts
    │   ├── assets.provider.ts
    │   └── dto/
    │       ├── assets.dto.ts
    │       ├── assets_create.dto.ts
    │       └── assets_update.dto.ts
    │
    ├── ASSET_MAINTENANCE_PLANS/
    │   ├── asset_maintenance_plans.controller.ts
    │   ├── asset_maintenance_plans.service.ts
    │   ├── asset_maintenance_plans.entity.ts  # id, asset_id, name, frequency, next_due_date, auto_create_wo
    │   ├── asset_maintenance_plans.module.ts
    │   ├── asset_maintenance_plans.provider.ts
    │   └── dto/
    │       ├── asset_maintenance_plans.dto.ts
    │       ├── asset_maintenance_plans_create.dto.ts
    │       └── asset_maintenance_plans_update.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  SERVICES & PARTS CATALOG
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── SERVICES_CATALOG/
    │   ├── services_catalog.controller.ts
    │   ├── services_catalog.service.ts
    │   ├── services_catalog.entity.ts     # id, tenant_id, name, description, default_price, tax_rate, duration_minutes, category
    │   ├── services_catalog.module.ts
    │   ├── services_catalog.provider.ts
    │   └── dto/
    │       ├── services_catalog.dto.ts
    │       ├── services_catalog_create.dto.ts
    │       └── services_catalog_update.dto.ts
    │
    ├── PARTS_CATALOG/
    │   ├── parts_catalog.controller.ts
    │   ├── parts_catalog.service.ts
    │   ├── parts_catalog.entity.ts        # id, tenant_id, name, sku, unit_price, stock_qty, reorder_level, supplier, category
    │   ├── parts_catalog.module.ts
    │   ├── parts_catalog.provider.ts
    │   └── dto/
    │       ├── parts_catalog.dto.ts
    │       ├── parts_catalog_create.dto.ts
    │       └── parts_catalog_update.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  SERVICE REQUESTS
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── SERVICE_REQUESTS/
    │   ├── service_requests.controller.ts  # CRUD, assign, triage, convert-to-WO, paginated list
    │   ├── service_requests.service.ts
    │   ├── service_requests.entity.ts     # id, tenant_id, contact_id, location_id, subject, description, priority, category, status, channel, assigned_to
    │   ├── service_requests.module.ts
    │   ├── service_requests.provider.ts
    │   └── dto/
    │       ├── service_requests.dto.ts
    │       ├── service_requests_create.dto.ts
    │       ├── service_requests_update.dto.ts
    │       └── service_requests_triage.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  ESTIMATES
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── ESTIMATES/
    │   ├── estimates.controller.ts        # CRUD, send, approve, reject, convert-to-WO
    │   ├── estimates.service.ts
    │   ├── estimates.entity.ts            # id, tenant_id, request_id, contact_id, status, subtotal, tax, discount, total, expiry_date, signature_url, notes
    │   ├── estimates.module.ts
    │   ├── estimates.provider.ts
    │   └── dto/
    │       ├── estimates.dto.ts
    │       ├── estimates_create.dto.ts
    │       ├── estimates_update.dto.ts
    │       └── estimates_approve.dto.ts
    │
    ├── ESTIMATE_LINE_ITEMS/
    │   ├── estimate_line_items.controller.ts
    │   ├── estimate_line_items.service.ts
    │   ├── estimate_line_items.entity.ts  # id, estimate_id, type (service|part|travel), name, description, quantity, unit_price, tax_rate, total
    │   ├── estimate_line_items.module.ts
    │   ├── estimate_line_items.provider.ts
    │   └── dto/
    │       ├── estimate_line_items.dto.ts
    │       ├── estimate_line_items_create.dto.ts
    │       └── estimate_line_items_update.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  WORK ORDERS
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── WORK_ORDERS/
    │   ├── work_orders.controller.ts      # Full lifecycle CRUD, status transitions, assign, schedule, recurring
    │   ├── work_orders.service.ts
    │   ├── work_orders.entity.ts          # id, tenant_id, request_id, estimate_id, contact_id, location_id, asset_id, status, priority, category, summary, description, scheduled_start, scheduled_end, actual_start, actual_end, assigned_to, tags, custom_fields (JSONB), is_recurring, recurrence_rule
    │   ├── work_orders.module.ts
    │   ├── work_orders.provider.ts
    │   └── dto/
    │       ├── work_orders.dto.ts
    │       ├── work_orders_create.dto.ts
    │       ├── work_orders_update.dto.ts
    │       ├── work_orders_status.dto.ts
    │       └── work_orders_pagination.dto.ts
    │
    ├── WORK_ORDER_LINE_ITEMS/
    │   ├── work_order_line_items.controller.ts
    │   ├── work_order_line_items.service.ts
    │   ├── work_order_line_items.entity.ts  # id, work_order_id, type (service|part|travel), name, quantity, unit_price, tax_rate, total
    │   ├── work_order_line_items.module.ts
    │   ├── work_order_line_items.provider.ts
    │   └── dto/
    │       ├── work_order_line_items.dto.ts
    │       ├── work_order_line_items_create.dto.ts
    │       └── work_order_line_items_update.dto.ts
    │
    ├── WORK_ORDER_NOTES/
    │   ├── work_order_notes.controller.ts
    │   ├── work_order_notes.service.ts
    │   ├── work_order_notes.entity.ts     # id, work_order_id, user_id, content, is_internal
    │   ├── work_order_notes.module.ts
    │   ├── work_order_notes.provider.ts
    │   └── dto/
    │       ├── work_order_notes.dto.ts
    │       └── work_order_notes_create.dto.ts
    │
    ├── WORK_ORDER_ATTACHMENTS/
    │   ├── work_order_attachments.controller.ts
    │   ├── work_order_attachments.service.ts
    │   ├── work_order_attachments.entity.ts  # id, work_order_id, user_id, file_url, file_type, file_name
    │   ├── work_order_attachments.module.ts
    │   ├── work_order_attachments.provider.ts
    │   └── dto/
    │       ├── work_order_attachments.dto.ts
    │       └── work_order_attachments_create.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  SERVICE APPOINTMENTS
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── SERVICE_APPOINTMENTS/
    │   ├── service_appointments.controller.ts  # CRUD, assign, reschedule, status transitions, calendar view
    │   ├── service_appointments.service.ts
    │   ├── service_appointments.entity.ts  # id, tenant_id, work_order_id, agent_id, crew_id, status, scheduled_start, scheduled_end, actual_start, actual_end, is_recurring, recurrence_rule
    │   ├── service_appointments.module.ts
    │   ├── service_appointments.provider.ts
    │   └── dto/
    │       ├── service_appointments.dto.ts
    │       ├── service_appointments_create.dto.ts
    │       ├── service_appointments_update.dto.ts
    │       ├── service_appointments_reschedule.dto.ts
    │       └── service_appointments_status.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  JOB SHEETS (Checklists)
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── JOB_SHEETS/
    │   ├── JOB_SHEET_TEMPLATES/
    │   │   ├── job_sheet_templates.controller.ts
    │   │   ├── job_sheet_templates.service.ts
    │   │   ├── job_sheet_templates.entity.ts  # id, tenant_id, name, description, category, items (JSONB)
    │   │   ├── job_sheet_templates.module.ts
    │   │   ├── job_sheet_templates.provider.ts
    │   │   └── dto/
    │   │       ├── job_sheet_templates.dto.ts
    │   │       ├── job_sheet_templates_create.dto.ts
    │   │       └── job_sheet_templates_update.dto.ts
    │   │
    │   ├── JOB_SHEET_INSTANCES/
    │   │   ├── job_sheet_instances.controller.ts
    │   │   ├── job_sheet_instances.service.ts
    │   │   ├── job_sheet_instances.entity.ts  # id, template_id, appointment_id, status, completed_by, completed_at
    │   │   ├── job_sheet_instances.module.ts
    │   │   ├── job_sheet_instances.provider.ts
    │   │   └── dto/
    │   │       ├── job_sheet_instances.dto.ts
    │   │       └── job_sheet_instances_update.dto.ts
    │   │
    │   └── JOB_SHEET_ITEMS/
    │       ├── job_sheet_items.controller.ts
    │       ├── job_sheet_items.service.ts
    │       ├── job_sheet_items.entity.ts   # id, instance_id, label, type (checkbox|text|photo|signature), value, photo_url, is_required, sort_order
    │       ├── job_sheet_items.module.ts
    │       ├── job_sheet_items.provider.ts
    │       └── dto/
    │           ├── job_sheet_items.dto.ts
    │           └── job_sheet_items_update.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  INVOICING & PAYMENTS
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── INVOICES/
    │   ├── invoices.controller.ts         # CRUD, send, void, PDF generate, batch invoicing
    │   ├── invoices.service.ts
    │   ├── invoices.entity.ts             # id, tenant_id, work_order_id, contact_id, invoice_number, status, subtotal, tax, discount, total, due_date, paid_amount, currency, notes, pdf_url
    │   ├── invoices.module.ts
    │   ├── invoices.provider.ts
    │   └── dto/
    │       ├── invoices.dto.ts
    │       ├── invoices_create.dto.ts
    │       ├── invoices_update.dto.ts
    │       └── invoices_pagination.dto.ts
    │
    ├── INVOICE_LINE_ITEMS/
    │   ├── invoice_line_items.controller.ts
    │   ├── invoice_line_items.service.ts
    │   ├── invoice_line_items.entity.ts   # id, invoice_id, type (service|part|travel), name, quantity, unit_price, tax_rate, total
    │   ├── invoice_line_items.module.ts
    │   ├── invoice_line_items.provider.ts
    │   └── dto/
    │       ├── invoice_line_items.dto.ts
    │       ├── invoice_line_items_create.dto.ts
    │       └── invoice_line_items_update.dto.ts
    │
    ├── PAYMENTS/
    │   ├── payments.controller.ts         # Record payment, refund, payment history
    │   ├── payments.service.ts
    │   ├── payments.entity.ts             # id, tenant_id, invoice_id, amount, method (card|cash|bank|online), gateway_transaction_id, status, paid_at
    │   ├── payments.module.ts
    │   ├── payments.provider.ts
    │   └── dto/
    │       ├── payments.dto.ts
    │       ├── payments_create.dto.ts
    │       ├── payments_update.dto.ts
    │       └── payments_pagination.dto.ts
    │
    ├── PAYMENT_GATEWAYS/
    │   ├── payment_gateways.controller.ts  # Stripe/Razorpay webhook handlers, gateway config
    │   ├── payment_gateways.service.ts
    │   ├── payment_gateways.entity.ts     # id, tenant_id, gateway_name, api_key_encrypted, is_active, settings (JSONB)
    │   ├── payment_gateways.module.ts
    │   ├── payment_gateways.provider.ts
    │   └── dto/
    │       ├── payment_gateways.dto.ts
    │       ├── payment_gateways_create.dto.ts
    │       └── payment_gateways_update.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  TIMESHEETS & TRIPS
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── TIMESHEETS/
    │   ├── timesheets.controller.ts       # Clock in/out, manual entry, approval, reports
    │   ├── timesheets.service.ts
    │   ├── timesheets.entity.ts           # id, tenant_id, user_id, appointment_id, clock_in, clock_out, travel_time_minutes, work_time_minutes, break_time_minutes, is_billable, status (pending|approved|rejected)
    │   ├── timesheets.module.ts
    │   ├── timesheets.provider.ts
    │   └── dto/
    │       ├── timesheets.dto.ts
    │       ├── timesheets_create.dto.ts
    │       ├── timesheets_update.dto.ts
    │       └── timesheets_pagination.dto.ts
    │
    ├── TRIPS/
    │   ├── trips.controller.ts            # Start/end trip, trip history, mileage report
    │   ├── trips.service.ts
    │   ├── trips.entity.ts                # id, tenant_id, user_id, appointment_id, start_lat, start_lng, end_lat, end_lng, start_time, end_time, distance_km, route_polyline
    │   ├── trips.module.ts
    │   ├── trips.provider.ts
    │   └── dto/
    │       ├── trips.dto.ts
    │       ├── trips_create.dto.ts
    │       └── trips_update.dto.ts
    │
    ├── AGENT_LOCATIONS/
    │   ├── agent_locations.controller.ts  # Live location updates, location history, proximity search
    │   ├── agent_locations.service.ts
    │   ├── agent_locations.entity.ts      # id, user_id, lat, lng, accuracy, speed, heading, battery_level, recorded_at
    │   ├── agent_locations.module.ts
    │   ├── agent_locations.provider.ts
    │   └── dto/
    │       ├── agent_locations.dto.ts
    │       └── agent_locations_create.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  WORKFORCE MANAGEMENT
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── TERRITORIES/
    │   ├── territories.controller.ts
    │   ├── territories.service.ts
    │   ├── territories.entity.ts          # id, tenant_id, name, description, boundary_geojson, color
    │   ├── territories.module.ts
    │   ├── territories.provider.ts
    │   └── dto/
    │       ├── territories.dto.ts
    │       ├── territories_create.dto.ts
    │       └── territories_update.dto.ts
    │
    ├── SHIFTS/
    │   ├── shifts.controller.ts
    │   ├── shifts.service.ts
    │   ├── shifts.entity.ts               # id, tenant_id, name, start_time, end_time, days_of_week, is_active
    │   ├── shifts.module.ts
    │   ├── shifts.provider.ts
    │   └── dto/
    │       ├── shifts.dto.ts
    │       ├── shifts_create.dto.ts
    │       └── shifts_update.dto.ts
    │
    ├── TIME_OFF/
    │   ├── time_off.controller.ts         # Request, approve, reject, calendar view
    │   ├── time_off.service.ts
    │   ├── time_off.entity.ts             # id, tenant_id, user_id, type, start_date, end_date, reason, status (pending|approved|rejected), approved_by
    │   ├── time_off.module.ts
    │   ├── time_off.provider.ts
    │   └── dto/
    │       ├── time_off.dto.ts
    │       ├── time_off_create.dto.ts
    │       ├── time_off_update.dto.ts
    │       └── time_off_approve.dto.ts
    │
    ├── HOLIDAYS/
    │   ├── holidays.controller.ts
    │   ├── holidays.service.ts
    │   ├── holidays.entity.ts             # id, tenant_id, name, date, is_recurring, applies_to_territories
    │   ├── holidays.module.ts
    │   ├── holidays.provider.ts
    │   └── dto/
    │       ├── holidays.dto.ts
    │       ├── holidays_create.dto.ts
    │       └── holidays_update.dto.ts
    │
    ├── SKILLS/
    │   ├── skills.controller.ts
    │   ├── skills.service.ts
    │   ├── skills.entity.ts               # id, tenant_id, name, category, description
    │   ├── skills.module.ts
    │   ├── skills.provider.ts
    │   └── dto/
    │       ├── skills.dto.ts
    │       ├── skills_create.dto.ts
    │       └── skills_update.dto.ts
    │
    ├── AGENT_SKILLS/
    │   ├── agent_skills.controller.ts
    │   ├── agent_skills.service.ts
    │   ├── agent_skills.entity.ts         # id, user_id, skill_id, proficiency_level, certified_until
    │   ├── agent_skills.module.ts
    │   ├── agent_skills.provider.ts
    │   └── dto/
    │       ├── agent_skills.dto.ts
    │       ├── agent_skills_create.dto.ts
    │       └── agent_skills_update.dto.ts
    │
    ├── CREWS/
    │   ├── crews.controller.ts
    │   ├── crews.service.ts
    │   ├── crews.entity.ts                # id, tenant_id, name, lead_user_id, territory_id
    │   ├── crews.module.ts
    │   ├── crews.provider.ts
    │   └── dto/
    │       ├── crews.dto.ts
    │       ├── crews_create.dto.ts
    │       └── crews_update.dto.ts
    │
    ├── CREW_MEMBERS/
    │   ├── crew_members.controller.ts
    │   ├── crew_members.service.ts
    │   ├── crew_members.entity.ts         # id, crew_id, user_id, role_in_crew
    │   ├── crew_members.module.ts
    │   ├── crew_members.provider.ts
    │   └── dto/
    │       ├── crew_members.dto.ts
    │       ├── crew_members_create.dto.ts
    │       └── crew_members_update.dto.ts
    │
    ├── EQUIPMENT/
    │   ├── equipment.controller.ts
    │   ├── equipment.service.ts
    │   ├── equipment.entity.ts            # id, tenant_id, name, type, serial_number, assigned_to_user_id, condition, last_maintenance_date
    │   ├── equipment.module.ts
    │   ├── equipment.provider.ts
    │   └── dto/
    │       ├── equipment.dto.ts
    │       ├── equipment_create.dto.ts
    │       └── equipment_update.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  SERVICE REPORTS
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── SERVICE_REPORTS/
    │   ├── service_reports.controller.ts  # Generate, view, send to customer, PDF
    │   ├── service_reports.service.ts
    │   ├── service_reports.entity.ts      # id, tenant_id, work_order_id, appointment_id, agent_id, summary, notes, photos (JSONB), signature_url, customer_signature_url, generated_at
    │   ├── service_reports.module.ts
    │   ├── service_reports.provider.ts
    │   └── dto/
    │       ├── service_reports.dto.ts
    │       ├── service_reports_create.dto.ts
    │       └── service_reports_update.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  BLUEPRINTS (Visual State Machine Engine)
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── BLUEPRINTS/
    │   ├── BLUEPRINT_DEFINITIONS/
    │   │   ├── blueprint_definitions.controller.ts
    │   │   ├── blueprint_definitions.service.ts
    │   │   ├── blueprint_definitions.entity.ts  # id, tenant_id, name, module (work_order|estimate|invoice), is_active
    │   │   ├── blueprint_definitions.module.ts
    │   │   ├── blueprint_definitions.provider.ts
    │   │   └── dto/
    │   │       ├── blueprint_definitions.dto.ts
    │   │       ├── blueprint_definitions_create.dto.ts
    │   │       └── blueprint_definitions_update.dto.ts
    │   │
    │   ├── BLUEPRINT_STATES/
    │   │   ├── blueprint_states.controller.ts
    │   │   ├── blueprint_states.service.ts
    │   │   ├── blueprint_states.entity.ts  # id, blueprint_id, name, color, is_initial, is_final, sort_order
    │   │   ├── blueprint_states.module.ts
    │   │   ├── blueprint_states.provider.ts
    │   │   └── dto/
    │   │       ├── blueprint_states.dto.ts
    │   │       ├── blueprint_states_create.dto.ts
    │   │       └── blueprint_states_update.dto.ts
    │   │
    │   └── BLUEPRINT_TRANSITIONS/
    │       ├── blueprint_transitions.controller.ts
    │       ├── blueprint_transitions.service.ts
    │       ├── blueprint_transitions.entity.ts  # id, blueprint_id, from_state_id, to_state_id, name, allowed_roles (JSONB), required_fields (JSONB), webhook_url, guard_condition
    │       ├── blueprint_transitions.module.ts
    │       ├── blueprint_transitions.provider.ts
    │       └── dto/
    │           ├── blueprint_transitions.dto.ts
    │           ├── blueprint_transitions_create.dto.ts
    │           └── blueprint_transitions_update.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  SERVICE AGREEMENTS & CONTRACTS
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── SERVICE_AGREEMENTS/
    │   ├── service_agreements.controller.ts  # CRUD, renew, cancel, SLA monitoring
    │   ├── service_agreements.service.ts
    │   ├── service_agreements.entity.ts   # id, tenant_id, contact_id, name, type (maintenance|warranty|SLA), start_date, end_date, recurrence, sla_response_hours, sla_resolution_hours, value, status
    │   ├── service_agreements.module.ts
    │   ├── service_agreements.provider.ts
    │   └── dto/
    │       ├── service_agreements.dto.ts
    │       ├── service_agreements_create.dto.ts
    │       ├── service_agreements_update.dto.ts
    │       └── service_agreements_renew.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  PRICEBOOK & DYNAMIC PRICING
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── PRICEBOOK/
    │   ├── pricebook.controller.ts        # CRUD, good/better/best pricing tiers
    │   ├── pricebook.service.ts
    │   ├── pricebook.entity.ts            # id, tenant_id, service_id, name, tier (good|better|best), price, description, is_active
    │   ├── pricebook.module.ts
    │   ├── pricebook.provider.ts
    │   └── dto/
    │       ├── pricebook.dto.ts
    │       ├── pricebook_create.dto.ts
    │       └── pricebook_update.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  COMMUNICATION & NOTIFICATIONS
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── NOTIFICATIONS/
    │   ├── notification.controller.ts     # List, mark-read, preferences
    │   ├── notification.service.ts
    │   ├── notification.entity.ts         # id, tenant_id, user_id, type, title, body, data (JSONB), channel (email|sms|push|in_app|whatsapp), is_read, sent_at
    │   ├── notification.module.ts
    │   ├── notification.provider.ts
    │   ├── notification.scheduler.ts      # Cron: SLA warnings, appointment reminders, payment reminders
    │   └── dto/
    │       ├── notification.dto.ts
    │       ├── notification_create.dto.ts
    │       ├── notification_update.dto.ts
    │       └── notification_query.dto.ts
    │
    ├── COMMUNICATION/
    │   ├── communication.controller.ts    # Send messages, history, templates
    │   ├── communication.service.ts
    │   ├── communication.entity.ts        # id, tenant_id, contact_id, channel, direction (inbound|outbound), subject, body, status, sent_at
    │   ├── communication_read_status.entity.ts
    │   ├── communication.module.ts
    │   ├── communication.provider.ts
    │   └── dto/
    │       └── communication.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  WEBFORMS
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── WEBFORMS/
    │   ├── webforms.controller.ts         # CRUD, embed code generation, submission handling
    │   ├── webforms.service.ts
    │   ├── webforms.entity.ts             # id, tenant_id, name, fields (JSONB), styling (JSONB), redirect_url, is_active, embed_code
    │   ├── webforms.module.ts
    │   ├── webforms.provider.ts
    │   └── dto/
    │       ├── webforms.dto.ts
    │       ├── webforms_create.dto.ts
    │       └── webforms_update.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  CUSTOMIZATION
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── CUSTOM_FIELDS/
    │   ├── custom_fields.controller.ts    # CRUD custom field definitions per module
    │   ├── custom_fields.service.ts
    │   ├── custom_fields.entity.ts        # id, tenant_id, module, field_name, field_type (text|number|date|dropdown|checkbox|multi_select|lookup), options (JSONB), is_required, sort_order
    │   ├── custom_fields.module.ts
    │   ├── custom_fields.provider.ts
    │   └── dto/
    │       ├── custom_fields.dto.ts
    │       ├── custom_fields_create.dto.ts
    │       └── custom_fields_update.dto.ts
    │
    ├── TEMPLATES/
    │   ├── templates.controller.ts        # CRUD invoice/estimate/email/report templates
    │   ├── templates.service.ts
    │   ├── templates.entity.ts            # id, tenant_id, type (invoice|estimate|email|report|job_sheet), name, content (JSONB), is_default
    │   ├── templates.module.ts
    │   ├── templates.provider.ts
    │   └── dto/
    │       ├── templates.dto.ts
    │       ├── templates_create.dto.ts
    │       └── templates_update.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  AUTOMATION
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── WORKFLOW_RULES/
    │   ├── workflow_rules.controller.ts   # CRUD automation rules
    │   ├── workflow_rules.service.ts
    │   ├── workflow_rules.entity.ts       # id, tenant_id, name, module, trigger_event, conditions (JSONB), actions (JSONB), is_active
    │   ├── workflow_rules.module.ts
    │   ├── workflow_rules.provider.ts
    │   └── dto/
    │       ├── workflow_rules.dto.ts
    │       ├── workflow_rules_create.dto.ts
    │       └── workflow_rules_update.dto.ts
    │
    ├── WEBHOOKS/
    │   ├── webhooks.controller.ts         # CRUD webhook subscriptions
    │   ├── webhooks.service.ts
    │   ├── webhooks.entity.ts             # id, tenant_id, name, url, events (JSONB), secret, is_active, last_triggered_at
    │   ├── webhooks.module.ts
    │   ├── webhooks.provider.ts
    │   └── dto/
    │       ├── webhooks.dto.ts
    │       ├── webhooks_create.dto.ts
    │       └── webhooks_update.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  REPORTS & ANALYTICS
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── REPORTS/
    │   ├── reports.controller.ts          # Standard reports, custom reports, export (PDF/CSV/Excel)
    │   ├── reports.service.ts
    │   ├── reports.module.ts
    │   └── dto/
    │       ├── report_query.dto.ts
    │       └── report_export.dto.ts
    │
    ├── DASHBOARDS/
    │   ├── dashboards.controller.ts       # KPI dashboards, widget config
    │   ├── dashboards.service.ts
    │   ├── dashboards.entity.ts           # id, tenant_id, user_id, name, widgets (JSONB), is_default
    │   ├── dashboards.module.ts
    │   ├── dashboards.provider.ts
    │   └── dto/
    │       ├── dashboards.dto.ts
    │       ├── dashboards_create.dto.ts
    │       └── dashboards_update.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  REVIEWS & FEEDBACK
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── REVIEWS/
    │   ├── reviews.controller.ts          # Submit, list, auto-solicit post-service
    │   ├── reviews.service.ts
    │   ├── reviews.entity.ts              # id, tenant_id, work_order_id, contact_id, rating, comment, platform (internal|google|yelp), created_at
    │   ├── reviews.module.ts
    │   ├── reviews.provider.ts
    │   └── dto/
    │       ├── reviews.dto.ts
    │       ├── reviews_create.dto.ts
    │       └── reviews_update.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  SETTINGS & CONFIGURATION
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── SETTINGS/
    │   ├── settings.controller.ts         # Company settings, branding, locale, tax, currency
    │   ├── settings.service.ts
    │   ├── settings.entity.ts             # id, tenant_id, key, value (JSONB), category
    │   ├── settings.module.ts
    │   ├── settings.provider.ts
    │   └── dto/
    │       ├── settings.dto.ts
    │       └── settings_update.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  AUDIT LOGS
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── AUDIT_LOGS/
    │   ├── audit_logs.controller.ts       # Search, filter, export audit trail
    │   ├── audit_logs.service.ts
    │   ├── audit_logs.entity.ts           # id, tenant_id, user_id, action, module, record_id, old_values (JSONB), new_values (JSONB), ip_address, user_agent, created_at
    │   ├── audit_logs.module.ts
    │   ├── audit_logs.provider.ts
    │   └── dto/
    │       ├── audit_logs.dto.ts
    │       └── audit_logs_query.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  SCHEDULING ENGINE (Dispatch Board)
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── SCHEDULING/
    │   ├── scheduling.controller.ts       # Gantt data, calendar data, auto-assign, conflict check, availability
    │   ├── scheduling.service.ts
    │   ├── scheduling.module.ts
    │   └── dto/
    │       ├── scheduling_gantt.dto.ts
    │       ├── scheduling_calendar.dto.ts
    │       ├── scheduling_auto_assign.dto.ts
    │       └── scheduling_availability.dto.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  IMAGE PROCESSING
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── IMAGE_COMPRESS/
    │   ├── img_compress.controller.ts
    │   ├── img_compress.service.ts        # Sharp-based image compression
    │   └── img_compress.module.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  MOBILE DASHBOARD (Aggregated Endpoints)
    │ ═══════════════════════════════════════════════════════════════
    │
    ├── MOBILE_DASHBOARD/
    │   ├── mobile_dashboard.controller.ts  # Aggregated data for mobile home screen
    │   ├── mobile_dashboard.service.ts
    │   └── mobile_dashboard.module.ts
    │
    │
    │ ═══════════════════════════════════════════════════════════════
    │  REAL-TIME (WebSocket Gateway)
    │ ═══════════════════════════════════════════════════════════════
    │
    └── REALTIME/
        ├── realtime.gateway.ts            # Socket.IO gateway: location updates, notifications, status changes
        ├── realtime.module.ts
        └── realtime.service.ts
```

### 4.2 Web (React)

```
web/
├── public/
│   ├── favicon.ico
│   └── locales/                           # i18n translation files
│       ├── en/
│       ├── es/
│       ├── fr/
│       └── ... (25+ languages)
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── .eslintrc.cjs
├── .prettierrc
│
└── src/
    ├── main.tsx                           # React entry point
    ├── App.tsx                            # Root component with router + providers
    ├── routes.tsx                         # Route definitions with guards
    │
    ├── api/                               # API layer
    │   ├── axios-instance.ts              # Axios config with interceptors, JWT refresh
    │   ├── auth.api.ts
    │   ├── contacts.api.ts
    │   ├── companies.api.ts
    │   ├── assets.api.ts
    │   ├── service-requests.api.ts
    │   ├── estimates.api.ts
    │   ├── work-orders.api.ts
    │   ├── appointments.api.ts
    │   ├── invoices.api.ts
    │   ├── payments.api.ts
    │   ├── scheduling.api.ts
    │   ├── timesheets.api.ts
    │   ├── trips.api.ts
    │   ├── workforce.api.ts               # Skills, crews, territories, shifts
    │   ├── reports.api.ts
    │   ├── settings.api.ts
    │   └── notifications.api.ts
    │
    ├── store/                             # Zustand stores
    │   ├── auth.store.ts
    │   ├── ui.store.ts                    # Sidebar, theme, locale
    │   └── notification.store.ts
    │
    ├── hooks/                             # TanStack Query hooks
    │   ├── use-contacts.ts
    │   ├── use-work-orders.ts
    │   ├── use-appointments.ts
    │   ├── use-scheduling.ts
    │   ├── use-invoices.ts
    │   └── use-notifications.ts
    │
    ├── components/                        # Shared UI components
    │   ├── layout/
    │   │   ├── AppLayout.tsx              # Sidebar + header + content
    │   │   ├── Sidebar.tsx
    │   │   ├── Header.tsx
    │   │   └── Breadcrumb.tsx
    │   ├── common/
    │   │   ├── DataTable.tsx              # TanStack Table wrapper
    │   │   ├── PageHeader.tsx
    │   │   ├── StatusBadge.tsx
    │   │   ├── PriorityBadge.tsx
    │   │   ├── ConfirmDialog.tsx
    │   │   ├── FileUpload.tsx
    │   │   ├── SignaturePad.tsx
    │   │   └── SearchInput.tsx
    │   ├── maps/
    │   │   ├── LiveMap.tsx                # Mapbox GL agent live map
    │   │   ├── RouteVisualization.tsx
    │   │   └── TerritoryMap.tsx
    │   └── charts/
    │       ├── GanttChart.tsx             # Apache ECharts Gantt
    │       ├── KPICard.tsx
    │       └── RevenueChart.tsx
    │
    ├── pages/                             # Route pages
    │   ├── auth/
    │   │   ├── LoginPage.tsx
    │   │   ├── RegisterPage.tsx
    │   │   └── ForgotPasswordPage.tsx
    │   ├── dashboard/
    │   │   └── DashboardPage.tsx
    │   ├── contacts/
    │   │   ├── ContactListPage.tsx
    │   │   ├── ContactDetailPage.tsx
    │   │   └── ContactFormPage.tsx
    │   ├── companies/
    │   │   ├── CompanyListPage.tsx
    │   │   ├── CompanyDetailPage.tsx
    │   │   └── CompanyFormPage.tsx
    │   ├── assets/
    │   │   ├── AssetListPage.tsx
    │   │   ├── AssetDetailPage.tsx
    │   │   └── AssetFormPage.tsx
    │   ├── service-requests/
    │   │   ├── RequestListPage.tsx
    │   │   ├── RequestDetailPage.tsx
    │   │   └── RequestFormPage.tsx
    │   ├── estimates/
    │   │   ├── EstimateListPage.tsx
    │   │   ├── EstimateDetailPage.tsx
    │   │   └── EstimateFormPage.tsx
    │   ├── work-orders/
    │   │   ├── WorkOrderListPage.tsx
    │   │   ├── WorkOrderDetailPage.tsx
    │   │   └── WorkOrderFormPage.tsx
    │   ├── scheduling/
    │   │   ├── DispatchBoardPage.tsx      # Gantt + drag-drop
    │   │   ├── CalendarPage.tsx           # Day/week/month views
    │   │   └── MapViewPage.tsx            # Live agent map
    │   ├── invoices/
    │   │   ├── InvoiceListPage.tsx
    │   │   ├── InvoiceDetailPage.tsx
    │   │   └── InvoiceFormPage.tsx
    │   ├── payments/
    │   │   └── PaymentListPage.tsx
    │   ├── timesheets/
    │   │   └── TimesheetListPage.tsx
    │   ├── workforce/
    │   │   ├── AgentListPage.tsx
    │   │   ├── CrewListPage.tsx
    │   │   ├── SkillListPage.tsx
    │   │   ├── TerritoryListPage.tsx
    │   │   ├── ShiftListPage.tsx
    │   │   └── TimeOffPage.tsx
    │   ├── reports/
    │   │   ├── ReportListPage.tsx
    │   │   └── ReportViewPage.tsx
    │   ├── settings/
    │   │   ├── GeneralSettingsPage.tsx
    │   │   ├── BrandingPage.tsx
    │   │   ├── CustomFieldsPage.tsx
    │   │   ├── BlueprintEditorPage.tsx    # Visual state machine editor
    │   │   ├── WorkflowRulesPage.tsx
    │   │   ├── WebhooksPage.tsx
    │   │   ├── TemplatesPage.tsx
    │   │   ├── RolesPermissionsPage.tsx
    │   │   └── IntegrationsPage.tsx
    │   └── customer-portal/               # Public-facing customer pages
    │       ├── PortalDashboard.tsx
    │       ├── PortalRequestForm.tsx
    │       ├── PortalTrackingPage.tsx
    │       └── PortalPaymentPage.tsx
    │
    ├── utils/
    │   ├── format-date.ts
    │   ├── format-currency.ts
    │   ├── permissions.ts
    │   └── constants.ts
    │
    └── types/
        ├── api.types.ts
        ├── models.types.ts
        └── enums.ts
```

### 4.3 Mobile (React Native + Expo)

```
mobile/
├── app.json
├── package.json
├── tsconfig.json
├── babel.config.js
├── eas.json                               # EAS Build config
│
├── app/                                   # Expo Router (file-based routing)
│   ├── _layout.tsx                        # Root layout with auth check
│   ├── index.tsx                          # Redirect to login or home
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx                    # Bottom tab navigator
│   │   ├── home.tsx                       # Dashboard: today's jobs, stats
│   │   ├── schedule.tsx                   # Calendar + job list
│   │   ├── map.tsx                        # Navigation map
│   │   ├── notifications.tsx
│   │   └── profile.tsx
│   ├── work-order/
│   │   ├── [id].tsx                       # Work order detail
│   │   └── checklist/[id].tsx             # Job sheet completion
│   ├── appointment/
│   │   ├── [id].tsx                       # Appointment detail + actions
│   │   ├── start-trip.tsx                 # Begin navigation/trip
│   │   ├── on-site.tsx                    # On-site actions (checklist, photos, notes)
│   │   ├── signature.tsx                  # Customer signature capture
│   │   └── complete.tsx                   # Job completion + invoice
│   ├── timesheet/
│   │   └── index.tsx                      # Clock in/out, timesheet history
│   └── settings/
│       └── index.tsx                      # App settings, offline sync status
│
├── src/
│   ├── api/
│   │   ├── api-client.ts                  # Axios with offline queue
│   │   └── endpoints.ts                   # API endpoint definitions
│   ├── db/
│   │   ├── schema.ts                      # WatermelonDB schema
│   │   ├── models/                        # WatermelonDB models (offline-first)
│   │   │   ├── WorkOrder.ts
│   │   │   ├── Appointment.ts
│   │   │   ├── Contact.ts
│   │   │   ├── JobSheet.ts
│   │   │   ├── Timesheet.ts
│   │   │   └── Trip.ts
│   │   └── sync.ts                        # Delta sync with conflict resolution
│   ├── components/
│   │   ├── JobCard.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── PhotoCapture.tsx
│   │   ├── SignaturePad.tsx
│   │   ├── ChecklistItem.tsx
│   │   ├── OfflineIndicator.tsx
│   │   └── MapNavigation.tsx
│   ├── hooks/
│   │   ├── use-location.ts               # GPS tracking hook
│   │   ├── use-offline.ts                # Offline status + sync
│   │   └── use-notifications.ts          # Push notification handler
│   ├── store/
│   │   ├── auth.store.ts
│   │   └── sync.store.ts
│   ├── utils/
│   │   ├── permissions.ts
│   │   ├── format.ts
│   │   └── constants.ts
│   └── types/
│       └── models.ts
│
└── assets/
    ├── images/
    └── fonts/
```

### 4.4 AI Service (FastAPI)

```
ai/
├── requirements.txt
├── pyproject.toml
├── Dockerfile
├── .env
├── .env.example
│
├── app/
│   ├── main.py                            # FastAPI app, CORS, routes
│   ├── config.py                          # Settings from env
│   ├── dependencies.py                    # Dependency injection
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── scheduling.py                  # POST /schedule/optimize, /schedule/route
│   │   ├── predictions.py                 # POST /predict/maintenance, /predict/demand
│   │   ├── chatbot.py                     # POST /chat/message, /chat/history
│   │   ├── documents.py                   # POST /documents/parse, /documents/generate
│   │   ├── analytics.py                   # POST /analytics/forecast, /analytics/anomaly, /analytics/nl-query
│   │   ├── vision.py                      # POST /vision/verify-work, /vision/identify-equipment
│   │   └── voice.py                       # POST /voice/transcribe
│   │
│   ├── models/                            # ML model definitions
│   │   ├── scheduler/
│   │   │   ├── vrp_solver.py              # Google OR-Tools VRP
│   │   │   └── demand_model.py            # Prophet demand forecasting
│   │   ├── maintenance/
│   │   │   ├── lstm_predictor.py          # LSTM failure prediction
│   │   │   └── health_scorer.py           # Equipment health scoring
│   │   ├── nlp/
│   │   │   ├── chatbot_engine.py          # RAG + LLM chatbot
│   │   │   ├── sentiment.py               # Sentiment analysis
│   │   │   └── nl_query.py                # NL-to-SQL query engine
│   │   ├── document/
│   │   │   ├── ocr_engine.py              # PaddleOCR wrapper
│   │   │   └── report_generator.py        # LLM report generation
│   │   └── vision/
│   │       ├── work_verifier.py           # YOLOv8 work quality check
│   │       └── equipment_detector.py      # Equipment identification
│   │
│   ├── services/
│   │   ├── vector_store.py                # Qdrant vector DB client
│   │   ├── llm_client.py                  # OpenAI/Claude API wrapper
│   │   └── model_registry.py             # Model version management
│   │
│   └── tasks/
│       ├── celery_app.py                  # Celery configuration
│       ├── scheduling_tasks.py            # Async scheduling optimization
│       ├── training_tasks.py              # Model retraining jobs
│       └── analysis_tasks.py              # Batch analytics jobs
│
├── data/
│   ├── models/                            # Trained model weights
│   └── training/                          # Training datasets
│
└── tests/
    ├── test_scheduling.py
    ├── test_predictions.py
    └── test_chatbot.py
```

### 4.5 Shared Types

```
shared/
├── package.json
├── tsconfig.json
└── src/
    ├── enums/
    │   ├── work-order-status.ts
    │   ├── appointment-status.ts
    │   ├── estimate-status.ts
    │   ├── invoice-status.ts
    │   ├── request-status.ts
    │   ├── priority.ts
    │   └── line-item-type.ts
    ├── types/
    │   ├── contact.ts
    │   ├── company.ts
    │   ├── asset.ts
    │   ├── service-request.ts
    │   ├── estimate.ts
    │   ├── work-order.ts
    │   ├── appointment.ts
    │   ├── invoice.ts
    │   ├── payment.ts
    │   ├── timesheet.ts
    │   ├── trip.ts
    │   └── user.ts
    └── constants/
        └── index.ts
```

### 4.6 Infrastructure

```
docker/
├── docker-compose.yml                     # All services orchestration
├── docker-compose.dev.yml                 # Development overrides
├── server/
│   └── Dockerfile
├── web/
│   └── Dockerfile
├── ai/
│   └── Dockerfile
└── nginx/
    └── nginx.conf                         # Reverse proxy configuration
```

---

## 5. Database Schema Overview

### 5.1 Core Entities & Relationships

```
TENANTS (multi-tenancy root)
 ├── USERS ──── USER_ROLES ──── ROLES ──── ROLE_PERMISSIONS ──── PERMISSIONS
 ├── CONTACTS ──── COMPANIES
 │    └── SERVICE_LOCATIONS
 ├── ASSETS ──── ASSET_MAINTENANCE_PLANS
 ├── SERVICES_CATALOG
 ├── PARTS_CATALOG
 ├── SERVICE_REQUESTS
 │    └── ESTIMATES ──── ESTIMATE_LINE_ITEMS
 │         └── WORK_ORDERS ──── WORK_ORDER_LINE_ITEMS
 │              │            ├── WORK_ORDER_NOTES
 │              │            └── WORK_ORDER_ATTACHMENTS
 │              └── SERVICE_APPOINTMENTS
 │                   ├── JOB_SHEET_INSTANCES ──── JOB_SHEET_ITEMS
 │                   ├── TIMESHEETS
 │                   ├── TRIPS
 │                   └── SERVICE_REPORTS
 ├── INVOICES ──── INVOICE_LINE_ITEMS
 │    └── PAYMENTS
 ├── TERRITORIES
 ├── SHIFTS
 ├── TIME_OFF
 ├── HOLIDAYS
 ├── SKILLS ──── AGENT_SKILLS
 ├── CREWS ──── CREW_MEMBERS
 ├── EQUIPMENT
 ├── BLUEPRINTS ──── BLUEPRINT_STATES ──── BLUEPRINT_TRANSITIONS
 ├── SERVICE_AGREEMENTS
 ├── PRICEBOOK
 ├── NOTIFICATIONS
 ├── COMMUNICATION
 ├── WEBFORMS
 ├── CUSTOM_FIELDS
 ├── TEMPLATES
 ├── WORKFLOW_RULES
 ├── WEBHOOKS
 ├── DASHBOARDS
 ├── REVIEWS
 ├── SETTINGS
 └── AUDIT_LOGS
```

### 5.2 Key Entity Fields (Provider Pattern)

Each entity follows the Sequelize provider pattern from lms-server:

```typescript
// Example: work_orders.provider.ts
export const WorkOrderProviders = [
  {
    provide: 'WorkOrdersRepository',
    useValue: WorkOrders,
  },
];

// Example: work_orders.service.ts
@Injectable()
export class WorkOrdersService {
  constructor(
    @Inject('WorkOrdersRepository')
    private readonly workOrdersRepository: typeof WorkOrders,
  ) {}

  async findAll(tenantId: string, pageOptionsDto: PageOptionsDto) { ... }
  async findById(tenantId: string, id: string) { ... }
  async create(tenantId: string, createDto: WorkOrderCreateDto) { ... }
  async update(tenantId: string, id: string, updateDto: WorkOrderUpdateDto) { ... }
  async delete(tenantId: string, id: string) { ... }  // soft delete (is_deleted: true)
}
```

### 5.3 Soft Delete Pattern (From LMS)

All entities use `is_deleted` boolean column (default: false):
- All queries filter by `is_deleted: false`
- DELETE endpoints set `is_deleted: true` instead of destroying records
- Audit logs capture all deletions

### 5.4 Standard Response Wrapper (From LMS)

```typescript
// DataResponseDto
{
  statusCode: 200,
  status: true,
  message: "Work orders fetched successfully",
  data: [...],
  meta: { take: 10, itemCount: 150, page: 1, pageCount: 15, hasPreviousPage: false, hasNextPage: true }
}
```

---

## 6. Development Phases

> Each phase follows: **Server API → Web Integration → Mobile Integration → AI Enhancement**
> No phase starts until the previous phase is integrated across all platforms.

### Phase 1: Project Setup & Foundation
**Server:**
- Initialize NestJS project with Sequelize, PostgreSQL, Redis
- Set up `database.module.ts`, `database.providers.ts`
- Create `shared/` module (config, constants, decorators, DTOs, pipes, guards, helpers)
- Set up `db/config.ts`, initial migration structure
- Configure Swagger, CORS, ValidationPipe, body-parser
- Set up `main.ts`, `app.module.ts`, `swagger.ts`

**Web:**
- Initialize React + Vite project
- Set up Ant Design 5, Zustand, TanStack Query, React Router
- Create AppLayout (sidebar, header, breadcrumb)
- Set up axios instance with JWT interceptors

**Mobile:**
- Initialize Expo project with Expo Router
- Set up WatermelonDB schema
- Create tab navigation layout
- Set up MMKV storage

**AI:**
- Initialize FastAPI project
- Set up Celery + Redis
- Configure Docker Compose for all services

### Phase 2: Authentication & Multi-Tenancy
**Server:**
- `TENANTS/` module (CRUD, settings)
- `USERS/` module (CRUD, password hashing with bcrypt)
- `auth/` module (login, register, JWT, refresh tokens, password reset)
- `auth/guards/` (JwtAuthGuard, LocalAuthGuard)
- `auth/strategies/` (JwtStrategy, LocalStrategy)
- `JWT_MODULE/` (global JWT with async factory)
- `shared/middleware/tenant.middleware.ts` (extract tenant from JWT)
- `shared/decorator/` (@Public, @TenantId, @CurrentUser, @UserId)

**Web:**
- Login, register, forgot password pages
- JWT token management in Zustand store
- Protected route wrapper
- Tenant context provider

**Mobile:**
- Login screen with biometric option
- Secure token storage (MMKV)
- Auto-refresh token logic

### Phase 3: Roles, Permissions & User Management
**Server:**
- `auth/PERMISSIONS/` module (CRUD permissions)
- `auth/ROLES/` module (CRUD roles with customizable permissions)
- `auth/ROLE_PERMISSION/` module (role-permission mapping)
- `USER_ROLES/` module (user-role assignment, bulk assign)
- `USER_DOCUMENTS/` module (certifications, licenses, ID uploads)
- `shared/guards/permission.guard.ts` (RBAC enforcement)

**Web:**
- Roles & Permissions settings page
- User management page (invite, assign roles)
- Permission-based UI rendering (show/hide based on permissions)

**Mobile:**
- Role-based navigation (show only permitted features)
- User profile with documents

### Phase 4: Customer & Contact Management
**Server:**
- `CONTACTS/` module (CRUD, search, paginated, service history)
- `COMPANIES/` module (CRUD, linked contacts)
- `SERVICE_LOCATIONS/` module (CRUD, geocoding, multiple per customer)

**Web:**
- Contact list with search, filters, pagination (DataTable)
- Contact detail page with service history timeline
- Company list and detail pages
- Service location management with map picker

**Mobile:**
- Contact search and detail view
- Quick-call and quick-navigate to customer
- Customer history accessible offline (WatermelonDB)

### Phase 5: Asset Management
**Server:**
- `ASSETS/` module (CRUD, service history per asset, warranty tracking)
- `ASSET_MAINTENANCE_PLANS/` module (CRUD, recurring schedule, auto-create WO)

**Web:**
- Asset registry with search and filters
- Asset detail page (info, service history, maintenance plan)
- Maintenance plan scheduler (calendar-based)

**Mobile:**
- Asset lookup by serial number / barcode scan
- Asset service history on-site

**AI:**
- Equipment health scoring model (baseline)

### Phase 6: Services & Parts Catalog
**Server:**
- `SERVICES_CATALOG/` module (CRUD, pricing, tax, duration)
- `PARTS_CATALOG/` module (CRUD, SKU, stock tracking, reorder alerts)

**Web:**
- Services catalog management
- Parts inventory with stock levels
- Reorder level alerts

**Mobile:**
- Browse services/parts catalog
- Check parts availability before job

### Phase 7: Service Requests
**Server:**
- `SERVICE_REQUESTS/` module (CRUD, multi-channel intake, triage, assign, convert to WO)
- Integration with `WEBFORMS/` for external intake
- Auto-assignment rules (round-robin, territory, skill-based)

**Web:**
- Request inbox with status filters
- Request detail page with triage actions
- Convert-to-WO and convert-to-estimate flows

**Mobile:**
- Request list for dispatchers
- Quick request creation

**AI:**
- NLP auto-categorization of request descriptions
- Priority suggestion based on sentiment analysis

### Phase 8: Estimates
**Server:**
- `ESTIMATES/` module (CRUD, send, approve, reject, convert to WO, expiry)
- `ESTIMATE_LINE_ITEMS/` module (service/part/travel line items with tax/discount)
- PDF generation (Puppeteer)
- Email delivery of estimates

**Web:**
- Estimate builder with line items (drag-and-drop ordering)
- Estimate preview with PDF download
- Customer approval tracking
- Convert approved estimate to work order

**Mobile:**
- Create/view estimates on-site
- Customer signature for approval

**AI:**
- AI estimate generation from request description

### Phase 9: Work Orders
**Server:**
- `WORK_ORDERS/` module (full lifecycle CRUD, status transitions, recurring)
- `WORK_ORDER_LINE_ITEMS/` module (service/part/travel)
- `WORK_ORDER_NOTES/` module (internal/external notes)
- `WORK_ORDER_ATTACHMENTS/` module (photos, documents)
- Status transition validation (based on Blueprint if configured)

**Web:**
- Work order list with advanced filters (status, priority, agent, date range)
- Work order detail page (tabbed: info, line items, notes, attachments, history)
- Work order form with line item builder
- Recurring work order setup

**Mobile:**
- Work order list (today's jobs)
- Work order detail with all tabs
- Status updates from field
- Photo/attachment upload

### Phase 10: Service Appointments & Scheduling
**Server:**
- `SERVICE_APPOINTMENTS/` module (CRUD, assign, reschedule, multi-tech, recurring)
- `SCHEDULING/` module (Gantt data, calendar data, availability, conflict detection, auto-assign)
- Skill + territory + shift + time-off availability calculation

**Web:**
- Dispatch board with Gantt chart (Apache ECharts + @dnd-kit drag-drop)
- Calendar view (day/week/month)
- Map view with live agent locations (Mapbox GL)
- Auto-assign with skill/territory/availability matching
- Conflict detection alerts

**Mobile:**
- Daily schedule view
- Accept/reject appointments
- Navigation to job site

**AI:**
- OR-Tools VRP solver for optimal scheduling
- Travel time estimation with traffic

### Phase 11: Job Sheets (Checklists)
**Server:**
- `JOB_SHEETS/JOB_SHEET_TEMPLATES/` module (CRUD template definitions)
- `JOB_SHEETS/JOB_SHEET_INSTANCES/` module (create from template, track completion)
- `JOB_SHEETS/JOB_SHEET_ITEMS/` module (checklist items with types: checkbox, text, photo, signature)

**Web:**
- Job sheet template builder (drag-and-drop items)
- Job sheet completion monitoring dashboard

**Mobile:**
- Step-by-step checklist completion
- Photo capture per item
- Customer signature at end
- Offline checklist completion

**AI:**
- Computer vision verification of completed work (YOLOv8)

### Phase 12: Timesheets, Trips & Location Tracking
**Server:**
- `TIMESHEETS/` module (clock in/out, manual entry, approval workflow)
- `TRIPS/` module (start/end trip, distance calculation, route storage)
- `AGENT_LOCATIONS/` module (live GPS updates, proximity search)
- `REALTIME/` gateway (Socket.IO for live location broadcasting)

**Web:**
- Timesheet management with approval
- Trip history with route visualization on map
- Live agent tracking map
- Mileage/fuel reports

**Mobile:**
- Clock in/out buttons
- Background GPS tracking
- Trip auto-logging
- Navigation integration (Google Maps / Apple Maps)

### Phase 13: Invoicing & Payments
**Server:**
- `INVOICES/` module (CRUD, send, void, PDF generate, batch invoicing)
- `INVOICE_LINE_ITEMS/` module (auto-populate from WO)
- `PAYMENTS/` module (record, refund, history)
- `PAYMENT_GATEWAYS/` module (Stripe/Razorpay config, webhook handlers)
- Auto-invoice generation from completed work orders

**Web:**
- Invoice list with status filters
- Invoice detail with PDF preview
- Batch invoice generation
- Payment recording
- Payment gateway settings

**Mobile:**
- On-site payment collection (Stripe Terminal)
- Invoice view and send to customer

### Phase 14: Service Agreements & Contracts
**Server:**
- `SERVICE_AGREEMENTS/` module (CRUD, renew, cancel, SLA monitoring)
- SLA breach detection scheduler
- Auto-WO creation for recurring agreements

**Web:**
- Service agreement management
- SLA compliance dashboard
- Agreement renewal workflow

**Mobile:**
- View active agreements for customer on-site

### Phase 15: Blueprints (Visual State Machine Engine)
**Server:**
- `BLUEPRINTS/BLUEPRINT_DEFINITIONS/` module (CRUD per module type)
- `BLUEPRINTS/BLUEPRINT_STATES/` module (define states with colors)
- `BLUEPRINTS/BLUEPRINT_TRANSITIONS/` module (define transitions with guards, required fields, role restrictions)
- Blueprint execution engine (validate transitions at runtime)

**Web:**
- Visual blueprint editor (drag-and-drop state machine designer)
- Transition configuration (guards, required fields, webhooks)
- Blueprint testing/simulation

### Phase 16: Communication & Notifications
**Server:**
- `NOTIFICATIONS/` module with scheduler (SLA warnings, reminders, payment due)
- `COMMUNICATION/` module (email, SMS, WhatsApp, in-app messaging)
- `FIREBASE/` module (FCM push notifications)
- Multi-channel notification delivery

**Web:**
- Notification center (bell icon with feed)
- Communication history per contact
- Email/SMS template management
- Notification preferences

**Mobile:**
- Push notification handling
- In-app notification feed
- Quick reply to messages

### Phase 17: Webforms & Customer Portal
**Server:**
- `WEBFORMS/` module (CRUD, embed code, submission handler → creates service request)
- Customer portal API (public endpoints for tracking, payments, history)

**Web:**
- Webform builder (drag-and-drop fields, styling)
- Embed code generator
- Customer portal pages (dashboard, tracking, payments, history)

**Mobile:**
- N/A (customer portal is web-only)

### Phase 18: Pricebook & Settings
**Server:**
- `PRICEBOOK/` module (CRUD, good/better/best tiers)
- `SETTINGS/` module (company branding, locale, currency, tax config)

**Web:**
- Pricebook management (tiered pricing presentation)
- Company settings (logo, branding, locale, currency, tax rates)

**Mobile:**
- Pricebook presentation to customers on-site

### Phase 19: Customization (Custom Fields, Templates, Workflow Rules)
**Server:**
- `CUSTOM_FIELDS/` module (CRUD per module, 15+ field types)
- `TEMPLATES/` module (invoice, estimate, email, report templates)
- `WORKFLOW_RULES/` module (event-triggered automation rules)
- `WEBHOOKS/` module (outbound webhook subscriptions)

**Web:**
- Custom field manager
- Template editor (rich text / HTML)
- Workflow rule builder (if-then visual builder)
- Webhook management

### Phase 20: Reports & Dashboards
**Server:**
- `REPORTS/` module (40+ standard reports, custom queries, export PDF/CSV/Excel)
- `DASHBOARDS/` module (CRUD user dashboards, widget configuration)

**Web:**
- Report catalog with filters
- Custom report builder
- Dashboard with configurable widgets (KPI cards, charts, maps)
- Export functionality

**Mobile:**
- Key metrics dashboard (simplified)

**AI:**
- Natural language query engine ("Show revenue by territory last quarter")
- Anomaly detection in KPIs
- AI narrative report generation

### Phase 21: Reviews & Feedback
**Server:**
- `REVIEWS/` module (CRUD, auto-solicit post-service, Google/Yelp integration)

**Web:**
- Review management dashboard
- Review solicitation settings
- Customer satisfaction analytics

**Mobile:**
- Post-service review prompt to customer

### Phase 22: Audit Logs & Security
**Server:**
- `AUDIT_LOGS/` module (search, filter, export)
- Automatic audit logging interceptor (captures all CRUD operations)
- MFA support (authenticator app, SMS, hardware keys)
- IP whitelisting

**Web:**
- Audit log viewer with search and filters
- Security settings (MFA, password policy, IP restrictions)

### Phase 23: AI - Smart Scheduling & Route Optimization
**AI:**
- Google OR-Tools VRP solver with time windows, skills, territories
- Real-time route optimization with traffic data
- Demand forecasting (Prophet)
- Schedule optimization recommendations

**Server:**
- `SCHEDULING/` module enhanced with AI integration endpoints

**Web:**
- AI scheduling suggestions on dispatch board
- "Optimize" button for auto-scheduling
- Demand forecast visualization

### Phase 24: AI - Predictive Maintenance & IoT
**AI:**
- LSTM/Prophet models for equipment failure prediction
- Equipment health scoring algorithm
- IoT data ingestion pipeline
- Automated WO creation on predicted failures

**Server:**
- IoT webhook receiver endpoints
- Health score calculation scheduler

**Web:**
- Equipment health dashboard
- Predictive maintenance alerts
- IoT sensor data visualization

### Phase 25: AI - Chatbot, Document AI & Analytics
**AI:**
- RAG-powered chatbot with LangChain + Qdrant
- PaddleOCR for invoice/document parsing
- LLM report generation
- NL-to-SQL analytics engine
- Sentiment analysis on customer communications

**Server:**
- Chatbot session management endpoints
- Document upload and parse endpoints

**Web:**
- Chatbot widget (customer and internal)
- Document upload with AI extraction preview
- NL analytics query bar

### Phase 26: AI - Computer Vision & Voice
**AI:**
- YOLOv8 work verification model
- Equipment identification model
- Whisper voice-to-text
- Before/after comparison AI

**Mobile:**
- Camera-based work verification
- Voice notes with auto-transcription
- Barcode/QR code scanning

**Web:**
- Vision verification dashboard
- Voice note playback with transcription

---

## 7. Workflow Summary

### 7.1 Primary Service Workflow

```
Customer submits request (Webform/Email/Phone/Portal/WhatsApp)
    ↓
AI auto-categorizes and suggests priority
    ↓
Dispatcher triages → Creates Estimate (with AI-suggested line items)
    ↓
Customer approves estimate (digital signature)
    ↓
Convert to Work Order → AI optimizes schedule
    ↓
Service Appointment created → Agent notified (push + SMS)
    ↓
Agent starts trip (GPS tracking begins)
    ↓
On-site: Complete job sheet, capture photos, add notes
    ↓
AI verifies work quality (computer vision)
    ↓
Customer signs → Service report auto-generated (LLM)
    ↓
Invoice auto-created → Customer pays (on-site or online)
    ↓
Review solicited → Analytics updated → AI models retrained
```

### 7.2 Feature Comparison Scorecard

| Feature | Zoho FSM | FieldForce Pro | Winner |
|---------|----------|---------------|--------|
| Work Order Management | Full lifecycle | Full lifecycle + Blueprints | **FieldForce Pro** |
| Scheduling | Manual Gantt + skill match | AI-optimized + manual fallback | **FieldForce Pro** |
| Route Optimization | Basic maps | OR-Tools VRP + traffic | **FieldForce Pro** |
| Mobile App | Offline-capable | Offline-first + AR + voice + vision | **FieldForce Pro** |
| User Roles | Fixed (3 roles) | Fully customizable RBAC | **FieldForce Pro** |
| Estimates | Full with approval | Full + AI generation | **FieldForce Pro** |
| Invoicing | Via Zoho Books | Built-in + OCR + auto-generation | **FieldForce Pro** |
| Payments | Online + on-site | + Stripe Terminal + same-day | **FieldForce Pro** |
| Timesheets | Basic tracking | + Auto-calculation + payroll export | **FieldForce Pro** |
| GPS Tracking | Real-time + trips | + Geofencing + breadcrumbs + fuel | **FieldForce Pro** |
| Reports | 40+ standard | 50+ standard + NL queries + AI insights | **FieldForce Pro** |
| Automation | Workflow rules + Blueprints | Match + AI suggestions | **FieldForce Pro** |
| Customer Portal | Basic (via Zoho) | Full self-service with chatbot | **FieldForce Pro** |
| Worker Portal | None | Full (schedules, pay, training, leave) | **FieldForce Pro** |
| Service Agreements | None | Full contract + SLA management | **FieldForce Pro** |
| Pricebook | None | Good/better/best dynamic pricing | **FieldForce Pro** |
| Review Collection | None | Auto-solicit Google/Yelp reviews | **FieldForce Pro** |
| IoT Integration | None | Sensor ingestion + predictive maintenance | **FieldForce Pro** |
| AI/ML | Minimal (basic routing) | 8 AI modules across all workflows | **FieldForce Pro** |
| Multilingual | 25+ languages | 25+ languages | Tie |
