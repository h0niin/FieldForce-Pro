# FieldForce Pro - Complete Implementation Plan (v2.0)

## AI-Powered Field Service Management Software

> **Updated after deep study of Zoho FSM, ServiceTitan, Housecall Pro, Jobber, and 2026 industry trends**

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
| **Developer Space** | REST APIs for third-party extensions | Match + GraphQL API, webhook event streaming, SDK, API marketplace |

### 1.2 Zoho FSM Status Flows (We Must Match These Exactly + Extend)

```
REQUEST:    Open → In Review → Approved → Converted (to Estimate or WO) / Rejected / Closed
ESTIMATE:   Draft → Sent → Viewed → Approved → Converted (to WO) / Declined / Expired
WORK ORDER: New → Scheduled → In Progress → On Hold → Completed → Cancelled / Closed
APPOINTMENT: New → Dispatched → In Progress → Completed / Cancelled / Incomplete
INVOICE:    Draft → Sent → Viewed → Partially Paid → Paid / Overdue / Void
```

**Our extension:** All status flows are configurable via a visual Blueprint editor. Admins can add custom statuses, define transition rules, set guards (required fields/approvals), and attach before/after actions to each transition.

### 1.3 Zoho FSM Pricing Model

- **Free tier:** Up to 30 appointments/month
- **Appointment-based pricing:** Pay per job, not per user
- **15-day free trial** on paid plans

**Our response:** Per-user pricing with unlimited appointments (more predictable for businesses). Free tier: 2 users, unlimited appointments for 30 days. This undercuts Zoho for high-volume businesses.

### 1.4 Zoho FSM's 14 Critical Weaknesses (Our Attack Surface)

| # | Zoho Weakness | How We Beat It |
|---|--------------|----------------|
| 1 | **Manual/rule-based scheduling** - Gantt + drag-drop only, no AI optimization | AI-driven dynamic scheduling with OR-Tools, real-time route re-optimization |
| 2 | **Fixed user profiles** - Admin, Dispatcher, Agent are hardcoded | Fully customizable RBAC with unlimited roles and granular permission sets |
| 3 | **No predictive maintenance** - Asset registry only, no IoT | IoT sensor ingestion, LSTM/Prophet failure prediction, automated WO creation |
| 4 | **No AI chatbot** - No automated customer support | LLM-powered 24/7 chatbot with RAG knowledge base, can create requests and check status |
| 5 | **No computer vision** - Standard photo capture only | YOLOv8 damage detection, part identification, before/after QA verification |
| 6 | **No AR guidance** - Basic mobile app | ARKit/ARCore overlays for guided repairs |
| 7 | **No voice interface** - Touch-only mobile | Voice commands, voice-to-text notes, hands-free operation |
| 8 | **No document AI** - Template-based invoicing only | OCR + LLM for vendor invoice parsing, AI-generated reports and estimates |
| 9 | **No predictive analytics** - Historical dashboards only | Revenue forecasting, demand prediction, anomaly detection, churn risk |
| 10 | **No natural language queries** - Fixed report templates | "Show me last month's SLA compliance by region" → instant chart |
| 11 | **Limited channels** - Email, WhatsApp, Webforms only | + SMS, AI chatbot, voice assistants, proactive outreach |
| 12 | **No worker portal** - No employee self-service | Full portal: schedules, timesheets, pay, training, leave, benefits |
| 13 | **Zoho ecosystem lock-in** - Deep Zoho integration, limited third-party | Open API-first with connectors for any CRM/ERP/accounting tool |
| 14 | **No sustainability tracking** - No ESG features | Carbon footprint per route, fuel savings from AI routing, ESG dashboard |

---

## 2. Our Competitive Advantages

### 2.1 Features Borrowed from Best Competitors

| Source | Feature | Our Implementation |
|--------|---------|-------------------|
| **ServiceTitan** | Pricebook management with good/better/best options | Dynamic pricing module with AI-suggested prices |
| **ServiceTitan** | Technician scorecards with gamification | Performance dashboard with leaderboards and achievements |
| **ServiceTitan** | Marketing ROI tracking | Campaign attribution on service requests |
| **Housecall Pro** | Auto-collect Google/Yelp reviews post-service | Automated review request flow with multi-platform support |
| **Housecall Pro** | Online booking from search results | Embeddable booking widget with real-time availability |
| **Housecall Pro** | Same-day payment settlement | Stripe Instant Payouts integration |
| **Jobber** | Client hub with self-service | Customer portal with request, approve, pay, track |
| **Jobber** | Batch invoicing for property managers | Bulk invoice generation per company/contract |
| **Jobber** | Quote follow-up automation | AI-powered estimate follow-up with optimal timing |
| **FieldEdge** | Flat-rate pricing books | Pre-built pricing templates by industry |

### 2.2 Industry-First AI Features (Our Moat)

| Feature | Technology | Business Impact |
|---------|-----------|-----------------|
| **Autonomous Scheduling** | OR-Tools + Reinforcement Learning | 30% less travel, 95% SLA compliance |
| **Predictive Maintenance** | LSTM + Isolation Forest on IoT data | 50% less unplanned downtime |
| **AI Customer Bot** | GPT-4/Claude + RAG + Tool Use | 40-50% support query deflection |
| **Smart Document AI** | PaddleOCR + LLM parsing | Zero manual invoice data entry |
| **Vision QA** | YOLOv8 + SAM | Quality verification without supervisor visits |
| **NL Analytics** | LLM + SQL generation | Any manager can query data in plain English |
| **Churn Prediction** | Gradient Boosting classifier | Early warning for at-risk customers |
| **Demand Forecasting** | Prophet + LSTM | Optimal staffing levels, no over/understaffing |

---

## 3. Tech Stack

### Server (API)
- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL (primary) + Redis (cache/queues)
- **ORM:** Prisma
- **Auth:** Passport.js + JWT + 2FA (TOTP, SMS, Email, Biometric)
- **Real-time:** Socket.IO (WebSockets)
- **Queue:** BullMQ (Redis-backed job queues)
- **File Storage:** AWS S3 / MinIO
- **Search:** PostgreSQL Full-Text Search (tsvector) + Meilisearch (advanced)
- **API Docs:** Swagger (OpenAPI 3.0)
- **i18n:** nestjs-i18n (25+ languages like Zoho)
- **Testing:** Jest + Supertest

### Web App
- **Framework:** React 18+ (TypeScript)
- **Build:** Vite
- **State Management:** Zustand
- **UI Library:** Ant Design 5 (enterprise-grade)
- **Data Fetching:** TanStack Query v5
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod validation
- **Maps:** Mapbox GL JS
- **Charts:** Apache ECharts (powerful Gantt support)
- **Gantt:** @dhx/gantt or custom (for dispatch board)
- **Drag-and-Drop:** @dnd-kit (for scheduling)
- **Real-time:** Socket.IO Client
- **i18n:** react-i18next (25+ languages)
- **PDF Generation:** @react-pdf/renderer
- **Testing:** Vitest + React Testing Library + Playwright (E2E)

### Mobile App
- **Framework:** React Native (Expo SDK 52+)
- **Navigation:** Expo Router v4
- **State:** Zustand
- **UI:** React Native Paper
- **Maps:** react-native-maps + Mapbox
- **Camera:** expo-camera + expo-image-picker
- **Offline:** WatermelonDB (offline-first SQLite)
- **Signatures:** react-native-signature-canvas
- **Push Notifications:** expo-notifications + FCM/APNs
- **Location:** expo-location (background tracking)
- **Biometrics:** expo-local-authentication
- **Barcode:** expo-barcode-scanner
- **AR:** ViroReact or expo-three (basic AR)
- **Voice:** expo-speech + whisper.cpp (on-device STT)
- **Testing:** Jest + Detox (E2E)

### AI Models Service
- **Framework:** FastAPI (Python 3.11+)
- **ML/AI Libraries:**
  - Scheduling: Google OR-Tools, scikit-learn, PyTorch
  - Predictive Maintenance: Prophet, LSTM (PyTorch), Isolation Forest
  - NLP/Chat: OpenAI GPT-4 API / Claude API / local Llama 3
  - Image Recognition: YOLOv8 (Ultralytics), SAM
  - Document Processing: PaddleOCR, LLM parsing
  - Analytics: pandas, scikit-learn, statsmodels
- **Task Queue:** Celery + Redis
- **Model Serving:** ONNX Runtime
- **Vector DB:** Qdrant (RAG for chatbot)
- **Testing:** pytest + httpx

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana
- **Logging:** ELK Stack
- **Reverse Proxy:** Traefik

---

## 4. Folder Structure

```
fieldforce-pro/
├── docker-compose.yml
├── docker-compose.dev.yml
├── .github/workflows/
│   ├── server-ci.yml
│   ├── web-ci.yml
│   ├── mobile-ci.yml
│   └── ai-ci.yml
├── docs/
│   ├── api/
│   ├── architecture/
│   ├── database/
│   └── guides/
│
├── server/                              # NestJS Backend
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── common/                      # Decorators, filters, guards, pipes, utils
│   │   ├── config/                      # Database, JWT, Redis, S3, Mail configs
│   │   ├── prisma/                      # Prisma service
│   │   ├── modules/
│   │   │   ├── auth/                    # Login, register, 2FA, OAuth, password reset
│   │   │   ├── users/                   # User CRUD, avatar, preferences
│   │   │   ├── roles/                   # Customizable RBAC (not fixed profiles)
│   │   │   ├── tenants/                 # Multi-tenancy middleware + config
│   │   │   ├── customers/               # Contacts + Companies (like Zoho's CRM)
│   │   │   ├── service-requests/        # Multi-channel intake + auto-assignment
│   │   │   ├── estimates/               # Line items (service/parts/travel) + approval
│   │   │   ├── work-orders/             # Full lifecycle + Blueprint state machine
│   │   │   ├── scheduling/              # Gantt data + availability + conflicts
│   │   │   ├── service-appointments/    # Multi-tech, recurring, crews
│   │   │   ├── dispatch/                # Live dispatch + nearest tech + reassignment
│   │   │   ├── trips/                   # Travel tracking + mileage + fuel
│   │   │   ├── timesheets/              # Clock in/out + approval + payroll export
│   │   │   ├── job-sheets/              # Checklist templates + dynamic forms
│   │   │   ├── service-reports/         # Auto-generate + PDF + email
│   │   │   ├── invoices/                # Multi-currency + tax + templates + recurring
│   │   │   ├── payments/                # Stripe + PayPal + cash + partial + refunds
│   │   │   ├── inventory/               # Parts catalog + warehouses + truck stock
│   │   │   ├── assets/                  # Customer equipment + maintenance plans + IoT
│   │   │   ├── sla/                     # Policies + escalations + timers + breach tracking
│   │   │   ├── service-agreements/      # Maintenance contracts + recurring billing [NEW]
│   │   │   ├── territories/             # Geographic zones + agent assignment
│   │   │   ├── skills/                  # Skill tags + certifications + expiry tracking
│   │   │   ├── crews/                   # Team composition + shared assignments
│   │   │   ├── shifts/                  # Shift scheduling + time-off + holidays
│   │   │   ├── pricebook/              # Dynamic pricing + good/better/best [NEW]
│   │   │   ├── blueprints/             # Visual workflow state machine engine [NEW]
│   │   │   ├── notifications/           # Email + SMS + Push + WhatsApp + In-App
│   │   │   ├── customer-portal/         # Scoped customer self-service APIs
│   │   │   ├── worker-portal/           # Employee self-service APIs
│   │   │   ├── reports/                 # 50+ standard + custom report builder
│   │   │   ├── reviews/                # Post-service review collection [NEW]
│   │   │   ├── file-upload/             # S3 upload + image compression
│   │   │   ├── webhooks/                # Outgoing webhooks + event streaming
│   │   │   ├── audit-log/               # Every action logged with user/timestamp
│   │   │   ├── settings/               # Company settings, branding, locale [NEW]
│   │   │   ├── webforms/               # Embeddable form builder + public API [NEW]
│   │   │   └── ai-gateway/              # Proxy to FastAPI AI service
│   │   └── websockets/                  # Real-time: tracking, notifications, dispatch
│   └── test/
│
├── web/                                 # React Web Application
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── routes/
│   │   ├── api/                         # API client layer (one file per module)
│   │   ├── hooks/                       # useAuth, useSocket, usePermissions, queries/
│   │   ├── store/                       # Zustand stores
│   │   ├── components/
│   │   │   ├── layout/                  # AppLayout, Sidebar, Header, Breadcrumbs
│   │   │   ├── common/                  # DataTable, StatusBadge, FileUploader, etc.
│   │   │   ├── maps/                    # LiveTrackingMap, RouteOverlay
│   │   │   ├── charts/                  # RevenueChart, KPICard, GaugeChart
│   │   │   ├── gantt/                   # GanttChart, GanttRow, DragHandle [KEY]
│   │   │   └── blueprints/             # StateFlowEditor, TransitionConfig [NEW]
│   │   ├── pages/
│   │   │   ├── auth/                    # Login, Register, ForgotPassword, 2FA
│   │   │   ├── dashboard/               # Admin, Dispatcher, Technician dashboards
│   │   │   ├── customers/               # List, Detail, Form (Contacts + Companies)
│   │   │   ├── service-requests/        # List (Kanban + Table), Detail, Form
│   │   │   ├── estimates/               # List, Builder, Detail, Public Approval Page
│   │   │   ├── work-orders/             # List (Kanban + Table), Detail, Form
│   │   │   ├── scheduling/              # GanttView, DispatchBoard, MapView, Calendar
│   │   │   ├── invoices/                # List, Builder, Detail, Public Payment Page
│   │   │   ├── payments/                # List, Detail, Revenue Dashboard
│   │   │   ├── inventory/               # Parts Catalog, Warehouses, Stock, POs
│   │   │   ├── assets/                  # Registry, IoT Dashboard, Maintenance Plans
│   │   │   ├── sla/                     # Policy Config, Compliance Dashboard
│   │   │   ├── service-agreements/      # Contract List, Builder, Renewal [NEW]
│   │   │   ├── workforce/               # Users, Roles, Teams, Skills, Territories, Shifts
│   │   │   ├── pricebook/              # Pricing Templates, Good/Better/Best [NEW]
│   │   │   ├── blueprints/             # Visual State Machine Editor [NEW]
│   │   │   ├── reports/                 # 50+ Reports, Custom Builder, AI Insights
│   │   │   ├── ai/                      # AI Assistant Chat, Predictions, Insights
│   │   │   ├── settings/                # Company, Branding, Notifications, Integrations
│   │   │   ├── customer-portal/         # Customer-facing pages (separate layout)
│   │   │   └── worker-portal/           # Worker self-service pages
│   │   ├── types/
│   │   ├── utils/
│   │   ├── i18n/                        # 25+ language files [NEW]
│   │   └── styles/
│   └── tests/
│
├── mobile/                              # React Native (Expo) Mobile App
│   ├── package.json
│   ├── app.json
│   ├── eas.json
│   ├── app/                             # Expo Router file-based routing
│   │   ├── _layout.tsx
│   │   ├── (auth)/                      # Login, Register, ForgotPassword, 2FA
│   │   ├── (app)/                       # Main authenticated app
│   │   │   ├── (tabs)/                  # Dashboard, Jobs, Schedule, Notifications, Profile
│   │   │   ├── jobs/                    # [id], checklist, photos, signature, notes
│   │   │   ├── customers/               # List, Detail
│   │   │   ├── map/                     # Navigation, Tracking
│   │   │   ├── invoices/                # List, Detail, Create
│   │   │   ├── payments/                # On-site collection (cash + card reader)
│   │   │   ├── inventory/               # Lookup, Barcode scan, Parts used
│   │   │   ├── ai/                      # Assistant chat, Camera AI, Voice notes
│   │   │   └── settings/                # Profile, Offline sync, Preferences
│   │   └── (customer)/                  # Customer portal mobile screens
│   ├── src/
│   │   ├── api/                         # API client
│   │   ├── hooks/                       # useAuth, useLocation, useOfflineSync, useCamera
│   │   ├── store/                       # Zustand stores
│   │   ├── components/                  # Common, Jobs, Maps, Signature
│   │   ├── services/
│   │   │   ├── offline/                 # WatermelonDB + sync engine
│   │   │   ├── location/                # Background GPS + geofencing
│   │   │   └── notifications/           # Push notification handler
│   │   ├── types/
│   │   └── utils/
│   ├── assets/
│   └── tests/
│
├── ai/                                  # FastAPI AI Models Service
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── middleware/                   # Auth (shared JWT), rate limiter, CORS
│   │   ├── api/v1/
│   │   │   ├── scheduling.py            # AI scheduling + route optimization
│   │   │   ├── maintenance.py           # Predictive maintenance + anomaly detection
│   │   │   ├── chatbot.py               # LLM chatbot + intent + sentiment
│   │   │   ├── documents.py             # OCR + report generation + estimate AI
│   │   │   ├── analytics.py             # Forecasting + anomaly + insights + churn
│   │   │   ├── vision.py                # Damage detection + part ID + quality check
│   │   │   └── recommendations.py       # Pricing + parts + training suggestions
│   │   ├── models/                      # ML model definitions per domain
│   │   │   ├── scheduling/              # optimizer, route, demand, skill_matcher
│   │   │   ├── maintenance/             # predictor, anomaly, health_scorer
│   │   │   ├── nlp/                     # chatbot, intent, sentiment, report_gen
│   │   │   ├── vision/                  # damage, parts, quality, ocr
│   │   │   └── analytics/               # forecaster, anomaly, insights, churn
│   │   ├── services/                    # llm_service, vector_store, model_registry
│   │   ├── tasks/                       # Celery: training, batch prediction, ETL
│   │   └── schemas/                     # Pydantic request/response schemas
│   ├── ml/                              # Training scripts + notebooks + data
│   └── tests/
│
└── shared/                              # Shared TypeScript types + constants
    ├── package.json
    └── src/
        ├── types/                       # User, Customer, WorkOrder, Invoice, etc.
        ├── constants/                   # Statuses, roles, permissions
        └── validators/                  # Zod schemas shared between web + mobile
```

---

## 5. Database Schema Overview

```
Tenant (Multi-tenancy)
├── Settings (company name, logo, locale, currency, timezone, branding)
├── Users
│   ├── UserRoles → Roles → RolePermissions → Permissions (FULLY CUSTOMIZABLE)
│   ├── UserSkills → Skills (with certifications + expiry dates)
│   ├── UserTerritories → Territories
│   ├── UserEquipment → Equipment
│   └── Shifts / TimeOff / Holidays
├── Customers (Contacts)
│   ├── Companies
│   ├── CustomerAddresses (multiple per customer)
│   ├── CustomerNotes / Tags
│   └── CustomerAssets → Assets
├── ServiceRequests
│   ├── source: email | portal | webform | phone | api | whatsapp | sms | chatbot
│   ├── AI auto-categorization (category, priority)
│   └── Attachments
├── Estimates
│   ├── EstimateLineItems (type: service | part | travel)  ← Zoho's 3 types
│   ├── Tax + Discount calculations
│   ├── Approval workflow (digital signature)
│   └── Conversion tracking (→ WorkOrder)
├── WorkOrders
│   ├── WorkOrderLineItems (service | part | travel)
│   ├── ServiceAppointments
│   │   ├── AssignedAgents (multiple per appointment = crews)
│   │   ├── Trips (start → arrive → end, GPS breadcrumb, distance, duration)
│   │   ├── Timesheets (clock-in/out per appointment, travel vs work split)
│   │   └── JobSheets → JobSheetItems (checklist with photos/notes per item)
│   ├── WorkOrderNotes (internal + customer-facing, like Zoho)
│   ├── WorkOrderPhotos (before/after, with AI analysis results)
│   ├── WorkOrderSignatures (customer sign-off)
│   ├── CustomFieldValues (dynamic custom fields per WO type)
│   └── StatusHistory (full audit trail of transitions)
├── Blueprints [NEW - matches Zoho's Blueprint feature]
│   ├── States (custom statuses per module)
│   ├── Transitions (from → to, with guards and actions)
│   ├── TransitionGuards (required fields, approvals, conditions)
│   └── TransitionActions (send email, update field, webhook, custom function)
├── ServiceAgreements [NEW]
│   ├── ContractTerms (start, end, renewal, value)
│   ├── CoveredAssets
│   ├── ScheduledMaintenanceEntries
│   └── BillingSchedule (monthly/quarterly/annual)
├── Invoices
│   ├── InvoiceLineItems
│   ├── TaxRates (multi-currency, country-specific like Zoho)
│   └── Payments (amount, method, status, receipt)
├── Pricebook [NEW]
│   ├── PriceItems (service/part with good/better/best tiers)
│   └── PriceRules (customer-specific, volume-based, seasonal)
├── Inventory
│   ├── Parts (SKU, barcode, category, cost, price)
│   ├── Warehouses (including truck inventory per technician)
│   └── StockMovements (adjustments, transfers, usage on jobs)
├── Assets
│   ├── MaintenancePlans (preventive schedule)
│   ├── IoTSensors → SensorReadings (time-series data)
│   └── MaintenanceHistory
├── SLAs
│   ├── SLAPolicies (response/resolution targets per priority)
│   ├── SLAEscalations (multi-level: email → SMS → alert)
│   └── SLABreaches (logged with work order reference)
├── Reviews [NEW]
│   ├── Rating (1-5 stars)
│   ├── Comment
│   └── ExternalReviewLinks (Google, Yelp prompts)
├── Notifications → NotificationTemplates → NotificationPreferences
├── Webforms [NEW] (embeddable form configs)
├── AuditLogs (every action, every user, every timestamp)
└── Webhooks (outgoing event subscriptions)
```

---

## 6. Development Phases

> **Rule:** For every feature: **Server API → Web Integration → Mobile Integration → AI (when applicable) → Test → Next**

---

### Phase 1: Project Setup & Foundation (Days 1-3)

**Goal:** All 4 projects running with shared infrastructure.

#### Step 1.1: Server (NestJS)
- Init NestJS with CLI, configure TypeScript/ESLint/Prettier
- Setup Prisma + PostgreSQL + Redis via Docker Compose
- Configure environment system (.env), Swagger auto-docs
- Health check endpoint, CORS, Helmet security headers
- Setup nestjs-i18n for multi-language support (25+ like Zoho)
- Base response interceptor (standardized API responses)

#### Step 1.2: Web (React)
- Init Vite + React + TypeScript
- Install: Ant Design 5, Zustand, TanStack Query, React Router, react-i18next
- Axios client with auth interceptors (token refresh, error handling)
- App shell: Sidebar, Header, Breadcrumbs, Theme switcher (light/dark)
- i18n setup with language switcher

#### Step 1.3: Mobile (React Native Expo)
- Init Expo with TypeScript, configure Expo Router
- Install: React Native Paper, Zustand, TanStack Query
- API client (shared patterns with web)
- EAS Build config, Tab + Stack navigation shell

#### Step 1.4: AI (FastAPI)
- Init FastAPI, configure pyproject.toml + requirements
- Celery + Redis setup, health check endpoint
- Docker image, JWT middleware (shared secret with NestJS)

#### Step 1.5: Shared Package
- TypeScript package with types, constants, Zod validators
- Importable by both web and mobile

#### Step 1.6: Docker Compose
- All services: PostgreSQL, Redis, MinIO (S3-compatible), NestJS, React (dev), FastAPI
- Single `docker-compose up` starts everything

**Deliverable:** `docker-compose up` → all 4 services running. Web shows themed layout. Mobile shows tabbed shell. AI responds to health checks.

---

### Phase 2: Authentication & User Management (Days 4-8)

**Goal:** Complete auth with customizable RBAC (beating Zoho's fixed profiles), 2FA, and multi-tenancy.

#### Step 2.1: Server - Core Auth
- Prisma schema: `Tenant`, `User`, `Role`, `Permission`, `RolePermission`, `UserRole`
- **Key difference from Zoho:** Roles are fully customizable, not fixed Admin/Dispatcher/Agent
- Auth endpoints:
  - `POST /auth/register` - Create tenant + first admin user
  - `POST /auth/login` - JWT access + refresh tokens
  - `POST /auth/refresh` - Token rotation
  - `POST /auth/logout` - Redis token blacklist
  - `POST /auth/forgot-password` + `POST /auth/reset-password`
  - `POST /auth/verify-email`
- User CRUD: list (paginated/filtered), get, update, soft-delete, avatar upload
- Invite system: `POST /users/invite` → sends email with signup link
- Roles CRUD with granular permissions:
  - ~60 permissions across all modules (e.g., `work_order:create`, `invoice:approve`, `report:export`)
  - Permission groups by module for easy assignment
- Default roles: Super Admin, Admin, Dispatcher, Field Agent, Customer (but users can create unlimited custom roles)
- JWT Guard, Roles Guard, Permissions Guard
- Tenant middleware: extract tenant from JWT, scope ALL database queries

#### Step 2.2: Web - Auth Pages
- Login, Register (company name + admin), Forgot Password, Reset Password
- Auth store (Zustand): tokens, user, tenant, permissions
- Protected routes (redirect if unauthenticated), Role-based routes (403 if unauthorized)
- Sidebar: role-based menu items (auto-hide based on permissions)
- User management page: list, invite modal, edit modal, role assignment
- Role management page: create/edit roles with permission checkbox matrix
- Profile page: avatar, name, email, password change, 2FA setup

#### Step 2.3: Mobile - Auth Screens
- Login (email/password), Register, Forgot Password
- Secure token storage (expo-secure-store)
- Auth state (Zustand), protected navigation
- Profile tab, biometric login (fingerprint/face)

#### Step 2.4: Server - Two-Factor Authentication
- TOTP: `POST /auth/2fa/setup` (QR), `/verify`, `/validate`, `/disable`
- SMS 2FA (Twilio), Email 2FA
- Hardware security key support (WebAuthn/FIDO2)

#### Step 2.5: Web + Mobile - 2FA Integration
- Web: QR setup page, TOTP input during login, 2FA settings
- Mobile: 2FA setup flow, verification during login, biometric as 2FA

**Deliverable:** Full auth system with customizable RBAC (not fixed like Zoho). 2FA with multiple methods. Multi-tenancy. Working on Web + Mobile.

---

### Phase 3: Customer & Company Management (Days 9-13)

**Goal:** Full CRM matching Zoho's Contacts + Companies + Assets module.

#### Step 3.1: Server - Customer/Company CRM
- Prisma: `Company`, `Customer`, `CustomerAddress`, `CustomerNote`, `CustomerTag`
- **Company** endpoints: CRUD + list contacts + service history summary + tax info + multi-location
- **Customer** (Contact) endpoints:
  - CRUD, link to company (or standalone), multiple addresses
  - `GET /customers/:id/service-history` - all requests, WOs, invoices
  - `GET /customers/:id/360` - AI profile: service frequency, lifetime value, satisfaction trend, churn risk [NEW]
  - `POST /customers/import` - CSV bulk import with field mapping
  - `POST /customers/merge` - merge duplicate customers [NEW]
- Full-text search (PostgreSQL tsvector)
- Customer tags and segments for targeted communication

#### Step 3.2: Web - Customer Pages
- Customer list: DataTable + search + filters (company, territory, tag, date) + bulk actions
- Customer detail: contact card, addresses (map pins), service timeline, notes, assets, linked WOs/invoices
- Customer 360 AI card: lifetime value, satisfaction score, churn risk, service frequency [NEW]
- Company pages: same structure with contacts list
- CSV import wizard with preview and field mapping

#### Step 3.3: Mobile - Customer Screens
- Customer list (search, pull-to-refresh)
- Detail screen: contact info, tap-to-call/email/navigate, recent jobs
- Quick-add customer form

**Deliverable:** Full CRM with AI-powered customer profiles (beyond Zoho).

---

### Phase 4: Service Requests (Days 14-18)

**Goal:** Multi-channel intake matching all Zoho channels + adding AI categorization.

#### Step 4.1: Server - Service Request API
- Prisma: `ServiceRequest`, `ServiceRequestNote`, `ServiceRequestAttachment`
- Status flow: `Open → In Review → Approved → Converted → Closed / Rejected` (matching Zoho)
- Endpoints:
  - CRUD + status transitions (with validation)
  - `POST /service-requests/public` - Public form submission (rate limited)
  - `POST /service-requests/from-email` - Email-to-request parser [NEW]
  - `POST /service-requests/:id/convert-to-estimate`
  - `POST /service-requests/:id/convert-to-work-order`
  - `GET /service-requests/stats` - Dashboard counters
- Intake channels: Portal, Email parsing, Webform, Phone (manual), API, WhatsApp, SMS, AI Chatbot
- Auto-numbering: SR-2026-00001
- Priority: Emergency, High, Medium, Low (configurable)
- Categories: configurable hierarchy (HVAC > Repair > AC Unit)
- Auto-assignment rules: by territory, category, round-robin (matching Zoho)
- WebSocket events for real-time updates

#### Step 4.2: AI - Request Intelligence
- `POST /ai/requests/categorize` - Auto-categorize request from description text
- `POST /ai/requests/priority` - AI-suggested priority based on description + customer history
- Input: "My AC isn't cooling and it's 105 degrees" → Category: HVAC > AC > Not Cooling, Priority: Emergency

#### Step 4.3: Web - Request Management
- Kanban board (columns = statuses, drag-to-change) + Table view (switchable)
- Quick filters: My Requests, Unassigned, Overdue, Emergency
- Detail page: request info, customer sidebar, timeline, notes, attachments, conversion actions
- Creation form: customer lookup, category picker, priority, description, files, address
- AI categorization badge: "AI suggests: HVAC > AC Repair (92% confidence)" [NEW]
- Dashboard widget: request counts by status

#### Step 4.4: Mobile - Request Screens
- Request list (filterable), detail with actions
- Quick creation form
- Push notification on new assignment

**Deliverable:** Multi-channel request intake (all Zoho channels + AI categorization). Kanban + Table views.

---

### Phase 5: Estimates & Quotes (Days 19-23)

**Goal:** Full estimate lifecycle matching Zoho's 3 line-item types + customer approval workflow.

#### Step 5.1: Server - Estimates API
- Prisma: `Estimate`, `EstimateLineItem` (type: `service | part | travel` — matching Zoho's 3 categories)
- Status: `Draft → Sent → Viewed → Approved → Declined → Expired → Converted`
- Endpoints:
  - CRUD + line item CRUD + send + approve (public) + reject + duplicate + convert to WO
  - `GET /estimates/:id/pdf` - PDF generation with company branding
- Tax calculation (multiple rates, per-line-item), discounts (flat/%), terms, validity period
- Estimate templates (save and reuse)
- Auto-numbering: EST-2026-00001
- Expiry cron job
- Email notification on send/approve/reject
- Conversion rate tracking: how many estimates convert to WOs [NEW]

#### Step 5.2: AI - Estimate Intelligence
- `POST /ai/estimates/suggest` - Given a request description + historical data, suggest line items with pricing
- Suggest based on: similar past jobs, customer type, market rates

#### Step 5.3: Web - Estimate Builder
- List page with status filters + conversion rate metrics [NEW]
- Builder: customer select, line item editor (services + parts + travel charges), tax, discount, notes, validity
- Preview mode (what customer sees)
- "AI Suggest" button: auto-generates line items from request description [NEW]
- Customer approval page (public, tokenized): view, approve with signature, reject with reason, download PDF

#### Step 5.4: Mobile - Estimate Screens
- List, create (simplified), detail, send to customer
- Deep link from email for customer approval

**Deliverable:** Full estimate lifecycle with 3 line-item types (matching Zoho). AI-suggested estimates (beating Zoho).

---

### Phase 6: Work Orders (Days 24-28)

**Goal:** Complete WO lifecycle matching Zoho's full feature set + Blueprint engine.

#### Step 6.1: Server - Work Order API
- Prisma: `WorkOrder`, `WorkOrderLineItem`, `WorkOrderNote`, `WorkOrderPhoto`, `WorkOrderSignature`, `WorkOrderStatusHistory`, `CustomFieldValue`
- Status flow: `New → Scheduled → In Progress → On Hold → Completed → Verified → Closed / Cancelled` (matching Zoho + adding Verified)
- All Zoho WO features:
  - Line items (service/part/travel), custom fields, notes (internal + customer-facing), attachments, tags
  - Recurring work orders (daily/weekly/monthly/custom)
  - Split into child work orders
  - Convert to invoice
  - PDF service report generation
  - Cost tracking: estimated vs actual (labor + parts + travel)
- Blueprint integration: status transitions governed by configurable rules
- WebSocket events for real-time status updates

#### Step 6.2: Server - Blueprint Engine [NEW - matches Zoho's Blueprint feature]
- `POST /blueprints` - Create blueprint (visual state machine)
- Define states, transitions, guards, and actions per module (WorkOrder, Request, Estimate)
- Transition guards: required fields, approvals, conditions (e.g., "all checklist items must be completed")
- Before/after transition actions: send notification, update field, trigger webhook, call custom function
- Enforced on all status transitions — cannot bypass

#### Step 6.3: Web - Work Order Management
- List: Kanban + Table views, advanced filters, bulk actions, CSV/PDF export
- Detail page:
  - Header: WO#, status badge, priority, SLA timer, Blueprint-enforced actions
  - Customer + location, line items, assigned techs, appointments timeline
  - Notes thread, photo gallery (before/after), signature, status history
  - Cost breakdown (estimated vs actual)
  - Actions: Schedule, Assign, Complete, Invoice, Split, Print
- Creation: from request/estimate or fresh, customer + address, category, priority, line items, custom fields
- Blueprint state machine visualization on detail page [NEW]

#### Step 6.4: Web - Blueprint Editor [NEW]
- Visual drag-and-drop state machine designer
- Add states (boxes), connect with transitions (arrows)
- Configure guards per transition (required fields, conditions)
- Attach actions (email, webhook, field update)
- Apply blueprint to module (WorkOrder, Request, Estimate)

#### Step 6.5: Mobile - Work Order
- WO list (today's jobs highlighted), detail with all fields
- Status update buttons (Blueprint-enforced)
- Photo capture (before/after), notes, signature, time logging
- Offline-capable: cached for offline, syncs when online

**Deliverable:** Full WO lifecycle matching Zoho. Blueprint engine for configurable workflows (matching Zoho's Blueprint). Custom fields.

---

### Phase 7: Scheduling & Dispatch (Days 29-35)

**Goal:** Match all Zoho scheduling features + add AI (where Zoho is manual-only).

#### Step 7.1: Server - Scheduling API
- Prisma: `ServiceAppointment`, `AppointmentAssignment`, `Trip`, `AgentLocation`
- Service Appointment: CRUD + assign (multi-tech) + dispatch + Gantt data + calendar data + availability check
- Multi-technician appointments (crews), recurring appointments
- Scheduling engine:
  - `GET /scheduling/availability` - Available slots per tech considering: shifts, time-off, holidays, existing appointments, territories, skills
  - `POST /scheduling/auto-schedule` - Basic rule-based scheduling (skill + territory + availability)
  - `GET /scheduling/conflicts` - Detect double-bookings
  - `GET /scheduling/technician-workload` - Workload per tech
- Dispatch:
  - `POST /dispatch/dispatch` - Send tech (triggers push notification)
  - `GET /dispatch/live-map` - All active agent locations
  - `GET /dispatch/nearest-techs` - Find nearest available qualified techs
- Agent Location: `POST /agents/location` (batch GPS updates from mobile)
- Trips: start → arrive → end, with GPS tracking, distance, duration
- WebSocket: agent locations, appointment updates, dispatch events

#### Step 7.2: Web - Scheduling Dashboard (matching Zoho's Dispatch Console)
- **Gantt Chart View** (Zoho's primary scheduling view):
  - Technicians as rows, time as X-axis
  - Draggable appointment blocks (reschedule by dragging)
  - Drag between rows (reassign tech)
  - Color-coded by status
  - Zoom: day / week / month
  - Conflict highlighting (red)
  - Unassigned queue sidebar
- **Calendar Views:** Day, Week, Month (matching Zoho)
- **Dispatch Board:**
  - Left: Unscheduled WOs
  - Center: Live map with agent positions
  - Right: Selected agent's schedule + skills + availability
  - Drag WO onto agent on map
  - "Find Nearest" button for a WO location
- **Live Tracking Map:** Real-time agent positions (WebSocket), route visualization, ETA, status indicators

#### Step 7.3: Mobile - Field Agent Scheduling
- Daily schedule timeline (next job prominent)
- Trip management: Start Trip → Navigate (Google/Apple Maps) → Arrived
- Background location tracking (battery-efficient, every 30s when on-duty)
- Push notifications: new assignment, schedule change, dispatch alert
- Weekly schedule overview

**Deliverable:** Full scheduling matching Zoho's Gantt + dispatch console. Live map. Trip tracking. (AI scheduling added in Phase 17.)

---

### Phase 8: Mobile Field App - Offline Core (Days 36-42)

**Goal:** Offline-first mobile experience surpassing Zoho's "offline-capable" claim.

#### Step 8.1: Server - Sync API
- Delta sync: `POST /sync/pull` (changes since last sync), `POST /sync/push` (queued changes)
- Conflict resolution (server wins with client notification)
- Batch photo upload

#### Step 8.2: Mobile - Offline Architecture
- WatermelonDB setup: offline models for WOs, Customers, Appointments, Photos, Notes, Checklists
- Sync engine with auto-sync on connectivity restore
- Online/offline visual indicator
- All core field work available offline:
  - View assigned jobs, update status, add notes, capture photos, complete checklists, collect signatures
  - Queue everything for sync
- Photo management: camera integration, annotation, compression, background upload queue
- Barcode/QR scanner: scan parts/equipment, link to WO

#### Step 8.3: Mobile - Digital Checklists (matching Zoho's Job Sheets)
- Dynamic checklist from template
- Item types: checkbox, text, number, photo, dropdown
- Progress indicator, required items validation
- Cannot mark complete until all required items done

#### Step 8.4: Mobile - Signature Capture
- Signature pad component, clear/redo, save as image
- Attached to WO for customer sign-off

**Deliverable:** True offline-first mobile. All field work functions without internet. Exceeds Zoho's offline capability.

---

### Phase 9: Job Execution & Field Work (Days 43-49)

**Goal:** Complete job execution with timesheets, job sheets, and service reports.

#### Step 9.1: Server - Timesheets API
- Clock in/out, auto-calculate travel vs work time
- Admin approval workflow, overtime tracking
- Hours summary (daily/weekly/monthly), payroll export format
- Link timesheet hours to invoice labor calculations

#### Step 9.2: Server - Job Sheet Templates
- Template builder: create checklist templates with sections and item types
- Assign templates to WO categories
- Track completion per WO

#### Step 9.3: Server - Service Reports
- Auto-generate report from WO data (work performed, parts, photos, signatures, time)
- PDF generation with company branding
- Email to customer on completion

#### Step 9.4: Web - Job Execution Admin
- Timesheet management: weekly grid per tech, approve/reject, payroll export
- Job sheet template builder: drag-and-drop sections/items, required flags, photo requirements
- Service report viewer: preview, download PDF, email

#### Step 9.5: Mobile - Job Execution
- Clock in/out (one-tap), break timer
- Step-by-step checklist with photo per item, progress bar
- Pre/post work notes (text + voice-to-text)
- Auto-generated report on completion, customer signature finalizes

**Deliverable:** Full job execution flow matching Zoho's timesheets + job sheets + service reports.

---

### Phase 10: Invoicing & Payments (Days 50-56)

**Goal:** Professional invoicing matching Zoho Books integration + multi-currency + on-site payments.

#### Step 10.1: Server - Invoicing API
- Prisma: `Invoice`, `InvoiceLineItem`, `TaxRate`, `InvoiceTemplate`
- Status: `Draft → Sent → Viewed → Partially Paid → Paid → Overdue → Void`
- Line items from WO (auto-calculated: labor hours × rate + parts + travel)
- Multi-currency support with country-specific tax (matching Zoho's multi-currency) [KEY]
- Customizable PDF templates with company branding (logo, colors, terms)
- Recurring invoices for service agreements
- Overdue detection + automatic reminders
- Auto-numbering: INV-2026-00001
- Batch invoicing for property managers (from Jobber) [NEW]

#### Step 10.2: Server - Payments API
- Stripe integration: payment intents, webhooks, refunds
- Multiple methods: Card (Stripe), Cash, Check, Bank Transfer, PayPal
- Partial payment support, payment plans [NEW]
- Same-day settlement via Stripe Instant Payouts (from Housecall Pro) [NEW]
- Payment receipts (auto-generated)

#### Step 10.3: Web - Invoicing & Payments
- Invoice list (status filters, overdue highlight)
- Invoice builder: auto-populate from WO, line items, tax config, discount, branding preview
- Customer payment page (public, Stripe Elements)
- Payment dashboard: revenue chart, outstanding, overdue, recent payments
- Batch invoice generation for multiple WOs/contracts [NEW]

#### Step 10.4: Mobile - On-Site Payments
- Create invoice from completed WO
- Cash payment recording
- Stripe tap-to-pay (card reader)
- Generate and share receipt

**Deliverable:** Full invoicing matching Zoho Books integration. Multi-currency + on-site payments + batch invoicing.

---

### Phase 11: Inventory & Parts Management (Days 57-62)

**Goal:** Parts catalog + warehouse tracking matching Zoho's Services & Parts module.

#### Step 11.1: Server - Inventory API
- Parts: CRUD, categories, SKU/barcode, cost vs sell price
- Warehouses: including truck inventory per technician (mobile warehouse)
- Stock: adjustments, transfers, auto-deduct on WO completion
- Low stock alerts (configurable thresholds)
- Purchase orders for restocking
- Parts linked to WO line items

#### Step 11.2: Web - Inventory Management
- Parts catalog (search, categories, grid/list)
- Part detail: stock levels per warehouse, usage history
- Warehouse management, stock adjustment forms, transfer wizard
- Low stock dashboard, purchase order management

#### Step 11.3: Mobile - Inventory
- Parts lookup + barcode scan
- Record parts used on job (auto-deducts)
- View truck inventory
- Request parts transfer

**Deliverable:** Complete inventory matching Zoho. Truck-level inventory + barcode scanning.

---

### Phase 12: Asset Management & Scheduled Maintenance (Days 63-68)

**Goal:** Match Zoho's Asset module + Scheduled Maintenance + add IoT readiness.

#### Step 12.1: Server - Asset & Maintenance API
- Asset: CRUD, link to customer, model/serial/warranty/install date
- Maintenance plans: preventive schedules (every X days/weeks/months)
- Auto-create WOs from maintenance schedule (cron job) — matching Zoho's Scheduled Maintenance
- QR code per asset (scan to view)
- IoT sensor registration + data ingestion endpoint (for Phase 18)
- Asset lifecycle tracking (depreciation, warranty expiry alerts)

#### Step 12.2: Web - Asset Management
- Asset registry, detail (info, maintenance plan, history, QR code)
- Maintenance plan builder
- Due maintenance calendar
- IoT dashboard placeholder (populated in Phase 18)

#### Step 12.3: Mobile - Asset
- QR scan to view asset
- Log maintenance performed
- Link asset to current WO

**Deliverable:** Full asset management matching Zoho + scheduled maintenance auto-WO creation.

---

### Phase 13: SLA Management (Days 69-73)

**Goal:** SLA policies with escalation matching and exceeding Zoho's capabilities.

#### Step 13.1: Server - SLA API
- SLA policies: response time + resolution time targets per priority level
- Business hours consideration (don't count after-hours)
- Multi-level escalation: Level 1 (50% elapsed: email dispatcher), Level 2 (75%: SMS manager), Level 3 (breached: alert VP)
- SLA timer service (BullMQ): calculate deadlines, check approaching, trigger escalations, record breaches
- SLA pause/resume (waiting on customer/parts)
- Penalty/bonus calculations for outcome-based contracts [NEW]

#### Step 13.2: Web - SLA Dashboard
- Policy configuration (targets per priority, business hours, escalation rules)
- Compliance dashboard: compliance rate, active timers, breach trends, at-risk WOs
- SLA indicators on WO detail: countdown, green/yellow/red
- SLA reports: compliance by tech, category, customer, period

#### Step 13.3: Mobile - SLA
- Timer visible on job detail, color-coded urgency
- Push notification on approaching breach

**Deliverable:** SLA enforcement with escalation. Matching Zoho + adding penalty/bonus tracking.

---

### Phase 14: Service Agreements & Contracts (Days 74-77) [NEW]

**Goal:** Maintenance contracts as first-class entities (missing from Zoho FSM, borrowed from ServiceTitan).

#### Step 14.1: Server - Service Agreement API
- Contract: customer, terms (start/end/renewal), covered assets, value, billing schedule
- Auto-create scheduled maintenance WOs per contract
- Renewal reminders (30/60/90 days before expiry)
- Revenue tracking per contract
- Contract templates (Bronze/Silver/Gold service levels)

#### Step 14.2: Web - Contract Management
- Contract list, builder (select customer, assets, services, schedule, billing)
- Renewal dashboard, revenue per contract
- Contract comparison (Bronze vs Silver vs Gold)

#### Step 14.3: Mobile - Contract View
- View active contracts for a customer during service visit
- Record work against contract

**Deliverable:** Maintenance contracts with auto-scheduling and renewal tracking. Feature gap in Zoho FSM.

---

### Phase 15: Customer Portal (Days 78-82)

**Goal:** Self-service portal matching Zoho's customer portal + adding live tracking and chatbot.

#### Step 15.1: Server - Customer Portal APIs
- Scoped endpoints (customer sees only their data):
  - Submit request, view my requests/WOs/estimates/invoices/assets
  - Approve/reject estimates with digital signature
  - Pay invoices online
  - Live technician tracking (ETA + map)
  - Submit feedback/rating (1-5 stars + comment)
  - Chat with AI bot [NEW]
- Public WO tracking by number (no login required)
- Separate customer auth (simpler registration)

#### Step 15.2: Web - Customer Portal UI
- Separate themed portal:
  - Dashboard: active requests, upcoming appointments, recent invoices
  - Request service form (guided, simple)
  - Live job tracker: map with tech position + ETA
  - Estimates: view, approve (signature), reject
  - Invoices: view, pay (Stripe), download PDF
  - Service history, asset list
  - Feedback form (stars + comment)
  - AI chatbot widget [NEW]

#### Step 15.3: Mobile - Customer Portal
- Request, track, approve, pay, rate (separate navigation group)

**Deliverable:** Customer self-service matching Zoho portal + AI chatbot + live tracking.

---

### Phase 16: Worker Portal (Days 83-87)

**Goal:** Employee self-service (missing from Zoho FSM — competitive advantage).

#### Step 16.1: Server - Worker Portal API
- My schedule, timesheets (submit/view), performance metrics, earnings summary
- Leave requests (submit/cancel/view balance)
- Training materials / certifications tracker
- Availability preferences
- Admin: approve/reject leave requests

#### Step 16.2: Web - Worker Portal
- Dashboard: today's schedule, performance stats, upcoming leave
- My schedule (calendar), timesheet submission, performance page (charts, rating, comparison to team)
- Leave management: balance, request form, history
- Gamification: leaderboard, badges, achievements [NEW - from ServiceTitan]

#### Step 16.3: Mobile - Worker Portal
- Performance dashboard, leave requests, timesheets, availability

**Deliverable:** Full worker self-service (Zoho doesn't have this). Gamification from ServiceTitan.

---

### Phase 17: Communication Engine (Days 88-92)

**Goal:** Omni-channel notifications exceeding Zoho's Email + WhatsApp + Webforms.

#### Step 17.1: Server - Notification Engine
- Channels: Email (SendGrid), SMS (Twilio), Push (FCM/APNs), WhatsApp (Twilio), In-App (WebSocket)
- Template engine (Handlebars) with merge fields
- Queue-based sending (BullMQ), delivery tracking, retry logic
- Automated triggers for every workflow event (matching all of Zoho's triggers):
  - Request created → email customer
  - Estimate sent → email customer
  - Job scheduled → push to tech
  - Tech dispatched → SMS customer with ETA
  - Job completed → email service report
  - Invoice sent → email customer
  - Payment received → email receipt
  - SLA at risk → escalation emails/SMS
- Customer preferences (opt-in/out per channel)
- Notification templates CRUD (admin can customize all messages)

#### Step 17.2: Server - Webform Builder [NEW - matching Zoho's Webforms]
- `POST /webforms` - Create embeddable form
- Form builder: fields, validation, styling
- Generates embed code (iframe or JS snippet)
- Submissions create service requests automatically

#### Step 17.3: Server - Review Collection [NEW - from Housecall Pro]
- After job completion (configurable delay), auto-send review request
- Internal rating capture + link to Google/Yelp review pages
- Aggregate rating tracking per technician

#### Step 17.4: Web - Communication Admin
- Notification bell + center, preference settings
- Template editor (WYSIWYG for emails)
- Communication log (all sent messages, delivery status)
- Webform builder UI [NEW]
- Review dashboard: ratings per tech, trends [NEW]

#### Step 17.5: Mobile - Notifications
- Push handling with deep linking
- In-app notification list
- Notification preferences

**Deliverable:** Omni-channel comms matching Zoho + SMS + auto review collection + webform builder.

---

### Phase 18: Pricebook & Settings (Days 93-96) [NEW]

**Goal:** Dynamic pricing (from ServiceTitan) + company settings + industry templates.

#### Step 18.1: Server - Pricebook API
- Price items: per service/part with good/better/best tiers (from ServiceTitan)
- Price rules: customer-specific, volume discounts, seasonal pricing
- Suggested pricing from AI (based on market + history) — added in Phase 22

#### Step 18.2: Server - Settings & Branding
- Company settings: name, logo, address, phone, email, website
- Branding: primary color, invoice logo, email header, portal theme
- Locale: timezone, date format, currency, number format
- Industry templates: pre-built configurations for HVAC, Plumbing, Electrical, Cleaning, IT [NEW]

#### Step 18.3: Web - Pricebook & Settings
- Pricebook: manage price items with tier pricing, bulk edit
- Settings pages: company info, branding, locale, industry template selector
- Integration settings page (configured in Phase 25)

**Deliverable:** Dynamic pricing system + full company settings + industry templates.

---

### Phase 19: AI - Intelligent Scheduling & Routing (Days 97-103)

**Goal:** AI-driven scheduling that makes Zoho's manual Gantt approach obsolete.

#### Step 19.1: AI Service - Scheduling Models
- **Smart Assignment:** Input: WO (skills, location, priority, SLA) + available techs. Model: OR-Tools CP solver. Objective: minimize travel while meeting SLA + balancing workload.
  - Endpoint: `POST /ai/scheduling/assign` → top 3 recommendations with scores
- **Route Optimization:** Input: tech's daily jobs. Model: OR-Tools VRP with Time Windows. Output: optimized job order with ETAs.
  - Endpoint: `POST /ai/scheduling/optimize-route`
- **Day Re-optimization:** Triggered by emergency/cancellation. Re-solves remaining jobs.
  - Endpoint: `POST /ai/scheduling/reoptimize`
- **Demand Forecast:** Prophet/LSTM predicting daily job volumes by category/territory.
  - Endpoint: `GET /ai/scheduling/demand-forecast`

#### Step 19.2: Server + Web + Mobile Integration
- "AI Suggest" button: shows top 3 techs with match scores
- Route optimization: current vs optimized comparison on map
- Demand forecast chart on dashboard
- Mobile: "Optimize Route" button, AI-suggested next job

**Deliverable:** AI scheduling that auto-assigns best tech and optimizes routes. Zoho cannot do this.

---

### Phase 20: AI - Predictive Maintenance (Days 104-109)

**Goal:** IoT-driven failure prediction (Zoho has zero predictive capability).

#### Step 20.1: AI Models
- **Failure Prediction:** LSTM/Prophet on sensor time-series → probability of failure within 7/14/30 days
- **Anomaly Detection:** Autoencoder/Isolation Forest on sensor streams
- **Health Scoring:** Composite 0-100 score per asset
- **Maintenance Optimization:** Recommend optimal timing based on usage

#### Step 20.2: Integration
- Ingest IoT data (HTTP batch or MQTT)
- Asset health dashboard with color-coded scores, at-risk alerts
- Auto-create WO from high-risk prediction
- Mobile: health indicator on job detail, push alert for equipment attention

**Deliverable:** Predictive maintenance from IoT data. Complete competitive differentiation.

---

### Phase 21: AI - Customer Support Chatbot (Days 110-115)

**Goal:** 24/7 AI chatbot (Zoho has none).

#### Step 21.1: AI - RAG Chatbot
- Vector store (Qdrant): company knowledge base, FAQs, service docs
- LLM (GPT-4/Claude): conversational AI with function calling
- Capabilities: answer FAQs, create requests, check WO status, provide ETA, help with invoices, escalate to human
- Intent classification + sentiment analysis
- Conversation memory per session

#### Step 21.2: Integration
- Chat widget on customer portal (streaming responses)
- "Talk to Human" → transfers to dispatcher
- Admin: knowledge base management, chat analytics, test responses
- Mobile: chat screen for customers

**Deliverable:** AI chatbot handling 40-50% of support queries. Zoho has nothing comparable.

---

### Phase 22: AI - Document Processing & Smart Analytics (Days 116-123)

**Goal:** Document AI + analytics intelligence (both missing from Zoho).

#### Step 22.1: AI - Document Processing
- OCR + LLM: parse vendor invoices → structured data
- LLM: auto-generate service reports from WO data
- LLM: auto-generate estimate suggestions from request descriptions
- LLM: parse incoming emails into structured requests

#### Step 22.2: AI - Smart Analytics
- Revenue forecasting (Prophet/LSTM)
- KPI anomaly detection (Isolation Forest)
- Natural language insight generation ("This month response times improved 12%...")
- Customer churn prediction (Gradient Boosting)
- Technician performance scoring (composite ML model)
- Natural language query: "Show me SLA compliance by region last month" → chart

#### Step 22.3: Integration
- Web: invoice parsing upload, "AI Generate" buttons on estimates/reports
- AI Insights dashboard: executive summary, forecast chart, anomaly alerts, churn list
- "Ask AI" text input for natural language queries
- Mobile: photo-to-parse, AI report on completion, executive summary card

**Deliverable:** Document AI + predictive analytics + NL queries. Massive Zoho gap.

---

### Phase 23: AI - Image Recognition (Days 124-129)

**Goal:** Computer vision for field QA (Zoho has nothing).

#### Step 23.1: AI - Vision Models
- Damage/issue detection (YOLOv8)
- Part identification from photo
- Before/after quality comparison
- Equipment identification via OCR on nameplates

#### Step 23.2: Integration
- Web: annotated photos on WO, part ID from upload, quality report
- Mobile: camera AI mode, before/after comparison, part scan

**Deliverable:** Vision-assisted field work. Quality verification without supervisor visits.

---

### Phase 24: Reports & Dashboards (Days 130-135)

**Goal:** 50+ reports exceeding Zoho's 40+ with AI insights and NL queries.

#### Step 24.1: Server - Reports API
- 50+ standard reports: revenue, jobs, technician performance, customer satisfaction, SLA compliance, inventory, financial, scheduling efficiency, first-time fix rate, contract value
- All reports: date range, group by, comparison periods, drill-down
- Custom report builder: select metrics + dimensions + filters + chart type
- Scheduled email delivery (daily/weekly/monthly)
- Export: CSV, PDF, Excel

#### Step 24.2: Web - Dashboards & Reports
- **Admin Dashboard:** Revenue KPIs, job overview, SLA gauge, utilization, satisfaction, top customers, activity feed, AI insight card
- **Dispatcher Dashboard:** Today's appointments, unassigned WOs, tech availability map, SLA at-risk
- Custom report builder UI, saved reports, scheduled delivery config
- Each report: interactive charts with drill-down

#### Step 24.3: Mobile - Reports
- Personal stats dashboard, simple revenue overview, KPI cards

**Deliverable:** 50+ reports (beating Zoho's 40+) + custom builder + AI insights + scheduled delivery.

---

### Phase 25: Integrations (Days 136-141)

**Goal:** Open integration ecosystem (beating Zoho's ecosystem lock-in).

#### Step 25.1: Server - Integration Framework
- OAuth/API key setup per provider
- **Payments:** Stripe (primary), PayPal, Square
- **Calendar:** Google Calendar, Outlook (bidirectional sync)
- **Accounting:** QuickBooks (two-way sync — from FieldEdge), Xero
- **Maps:** Google Maps, Mapbox
- **Communication:** SendGrid, Twilio (SMS + WhatsApp), FCM/APNs
- **Storage:** AWS S3, Google Cloud Storage
- **Outgoing Webhooks:** register URL, select events, retry logic, delivery log

#### Step 25.2: Web - Integration UI
- Integration marketplace (grid with logos, connect/disconnect)
- Calendar sync, accounting connection wizard
- Webhook management: create, test, delivery history

**Deliverable:** Open integrations beating Zoho's ecosystem lock-in.

---

### Phase 26: Testing, Security & Launch (Days 142-150)

**Goal:** Production-ready with enterprise-grade security exceeding Zoho.

#### Step 26.1: Testing
- Server: Jest unit (>80% coverage) + Supertest E2E (full workflow: request→estimate→WO→invoice→payment)
- Web: Vitest + RTL + Playwright E2E (login, WO management, scheduling, portal)
- Mobile: Jest + Detox E2E (job execution offline, push notifications)
- AI: pytest + model accuracy benchmarks
- Load test: k6 targeting 1000 concurrent users

#### Step 26.2: Security Hardening (exceeding Zoho)
- OWASP Top 10 audit
- Input validation on all endpoints (Zod/class-validator)
- Rate limiting on public endpoints
- Security headers (Helmet.js), CSRF, CSP
- File upload validation (type, size, content)
- Dependency vulnerability scan
- GDPR: data export + deletion endpoints + consent management
- SOC 2 readiness checklist
- Penetration testing

#### Step 26.3: Performance
- DB: query optimization, connection pooling, indexes
- Web: code splitting, lazy loading, image optimization, service worker
- Mobile: Hermes, FastImage, FlashList, batch sync
- AI: ONNX Runtime optimization, response caching

#### Step 26.4: Production Deployment
- Docker images → registry
- PostgreSQL + Redis: managed services
- SSL, DNS, monitoring (Prometheus + Grafana), logging (ELK), error tracking (Sentry)
- CI/CD: lint → test → build → deploy staging → manual promote to production

**Deliverable:** Production-ready. Enterprise security exceeding Zoho. Monitoring in place.

---

## 7. Workflow Summary

### Development Rule (Every Phase)

```
SERVER API (NestJS) → WEB (React) → MOBILE (Expo) → AI (FastAPI) → TEST → NEXT PHASE
```

### Complete Zoho-Beating Flow

```
Phase 1:  Foundation (all 4 projects)
Phase 2:  Auth + Custom RBAC (beats Zoho's fixed roles)
Phase 3:  CRM + AI 360° profiles (beats Zoho's basic contacts)
Phase 4:  Requests + AI categorization (beats Zoho's manual intake)
Phase 5:  Estimates + AI suggestions (beats Zoho's template-only)
Phase 6:  Work Orders + Blueprint engine (matches Zoho's Blueprint)
Phase 7:  Scheduling + Gantt + Dispatch (matches Zoho's console)
Phase 8:  Offline Mobile (exceeds Zoho's offline claims)
Phase 9:  Job Execution + Timesheets + Reports (matches Zoho)
Phase 10: Invoicing + Multi-currency + On-site pay (matches Zoho Books)
Phase 11: Inventory (matches Zoho)
Phase 12: Assets + Scheduled Maintenance (matches Zoho)
Phase 13: SLA Management (matches + extends Zoho)
Phase 14: Service Agreements [NEW - Zoho gap]
Phase 15: Customer Portal + Live Tracking (matches + extends)
Phase 16: Worker Portal [NEW - Zoho gap]
Phase 17: Communication + Webforms + Reviews (matches + extends)
Phase 18: Pricebook + Settings + Industry Templates [NEW]
Phase 19: AI Scheduling (BEATS Zoho - they can't do this)
Phase 20: AI Predictive Maintenance (BEATS Zoho)
Phase 21: AI Chatbot (BEATS Zoho)
Phase 22: AI Documents + Analytics (BEATS Zoho)
Phase 23: AI Vision (BEATS Zoho)
Phase 24: Reports 50+ (BEATS Zoho's 40+)
Phase 25: Open Integrations (BEATS Zoho's ecosystem lock-in)
Phase 26: Security + Launch (BEATS Zoho's basic security)
```

### Feature Comparison Scorecard

| Category | Zoho FSM | FieldForce Pro | Winner |
|----------|----------|----------------|--------|
| CRM & Contacts | Full | Full + AI 360° | **Us** |
| Request Intake | 5 channels | 8 channels + AI | **Us** |
| Estimates | Full | Full + AI suggest | **Us** |
| Work Orders | Full + Blueprint | Full + Blueprint | Tie |
| Scheduling | Manual Gantt | AI-driven + Gantt | **Us** |
| Mobile App | Offline capable | Offline-first + AR + Voice | **Us** |
| Invoicing | Zoho Books | Multi-currency + AI + batch | **Us** |
| Inventory | Basic | Full + truck stock + barcode | **Us** |
| Assets | Registry + maintenance | + IoT + predictive | **Us** |
| SLAs | Basic | Full + penalty/bonus | **Us** |
| Contracts | None | Full service agreements | **Us** |
| Customer Portal | Basic | + Live tracking + chatbot | **Us** |
| Worker Portal | None | Full self-service | **Us** |
| Communications | Email + WhatsApp | Omni-channel + AI bot | **Us** |
| Pricing | Fixed | Dynamic pricebook | **Us** |
| Reports | 40+ standard | 50+ + AI + NL queries | **Us** |
| AI Features | Minimal | 6 AI modules across system | **Us** |
| Security | Basic RBAC | Custom RBAC + MFA + biometric | **Us** |
| Integrations | Zoho ecosystem | Open API + any CRM/ERP | **Us** |
| Customization | Deluge scripting | Visual Blueprint builder | **Us** |

### Key Metrics

| Metric | Target |
|--------|--------|
| API Response (p95) | < 200ms |
| Web Load (LCP) | < 2.5s |
| Mobile Launch | < 2s |
| AI Scheduling | < 3s |
| Offline Sync | < 5s |
| Test Coverage | > 80% |
| Uptime SLA | 99.9% |
| Concurrent Users | 1,000+ |

---

**Document Version:** 2.0
**Updated:** February 12, 2026
**Based on:** Deep analysis of Zoho FSM, ServiceTitan, Housecall Pro, Jobber, FieldEdge
**Total Phases:** 26
**Total Estimated Timeline:** ~150 working days
