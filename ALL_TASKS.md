# FSM (Field Service Management) - Complete Implementation Task List

> **Instructions:** Check off tasks as they are completed by changing `[ ]` to `[x]`.
> Each phase is broken into Server, Web, Mobile, and AI sub-sections with granular sub-tasks.
> Tasks already completed based on existing code are pre-checked.
>
> **Last Updated:** 2026-02-16

---

## Progress Overview

| # | Phase | Server | Web | Mobile | AI | Status |
|---|-------|--------|-----|--------|----|--------|
| 1 | Project Setup & Foundation | Done | Done | Done | Done | Complete |
| 2 | Authentication & Multi-Tenancy | Done | Done | Done | - | Complete |
| 3 | Roles, Permissions & User Management | Done | Done | Done | - | Complete |
| 4 | Customer & Contact Management | Done | Done | Not Started | - | Partial |
| 5 | Asset Management | Done | Done | Done | Not Started | Partial |
| 6 | Services & Parts Catalog | Done | Done | Not Started | - | Partial |
| 7 | Service Requests | Done | Done | Not Started | Not Started | Partial |
| 8 | Estimates | Done | Done | Done | Not Started | Partial |
| 9 | Work Orders | Done | Done | Not Started | - | Partial |
| 10 | Service Appointments & Scheduling | Done | Done | Done | Not Started | Partial |
| 11 | Job Sheets (Checklists) | Done | Done | Not Started | Not Started | Partial |
| 12 | Timesheets, Trips & Location Tracking | Done | Done | Not Started | Done | Partial |
| 13 | Invoicing & Payments | Done | Done | Not Started | - | Partial |
| 14 | Service Agreements & Contracts | Done | Done | Not Started | - | Partial |
| 15 | Blueprints (Visual State Machine Engine) | Done | Done | - | - | Complete |
| 16 | Communication & Notifications | Done | Done | Not Started | - | Partial |
| 17 | Webforms & Customer Portal | Done | Done | - | - | Production Ready |
| 18 | Pricebook & Settings | Done | Done | Not Started | - | Partial |
| 19 | Customization | Done | Done | - | - | Partial |
| 20 | Reports & Dashboards | Done | Done | Not Started | Not Started | Partial |
| 21 | Reviews & Feedback | Done | Done | Not Started | - | Partial |
| 22 | Audit Logs & Security | Done | Done | - | - | Partial |
| 23 | AI - Smart Scheduling & Route Optimization | Done | Done | - | Done | Complete |
| 24 | AI - Predictive Maintenance & IoT | Done | Done | - | Done | Complete |
| 25 | AI - Chatbot, Document AI & Analytics | Done | Done | - | Done | Complete |
| 26 | AI - Computer Vision & Voice | - | Done | Not Started | Done | Partial |

---

## Phase 1: Project Setup & Foundation

### Server

- [x] Initialize NestJS project with TypeScript configuration
- [x] Set up Sequelize ORM with PostgreSQL connection
- [x] Configure Redis connection
- [x] Create `database/database.module.ts`
- [x] Create `database/database.providers.ts`
- [x] Create `shared/shared.module.ts`
- [x] Create `shared/config/config.service.ts`
- [x] Create `shared/constants/constants.ts`
- [x] Create `shared/constants/keynames.ts`
- [x] Create `shared/decorator/` directory with base decorators
- [x] Create `shared/dto/data-response.dto.ts`
- [x] Create `shared/dto/page-meta.dto.ts`
- [x] Create `shared/dto/page-options.dto.ts`
- [x] Create `shared/dto/page.dto.ts`
- [x] Create `shared/pipes/file-size.pipe.ts`
- [x] Create `shared/pipes/validate-image.pipe.ts`
- [x] Create `shared/guards/` directory
- [x] Create `shared/helpers/error-message.ts`
- [x] Create `shared/filters/http-exception.filter.ts`
- [x] Create `shared/interceptors/transform.interceptor.ts`
- [x] Create `shared/interfaces/jwt-payload.interface.ts`
- [x] Set up `db/config.ts` and initial migration structure
- [x] Configure Swagger documentation (`swagger.ts`)
- [x] Configure CORS in `main.ts`
- [x] Configure ValidationPipe in `main.ts`
- [x] Configure body-parser in `main.ts`
- [x] Set up `app.module.ts` with global module imports

### Web

- [x] Initialize React project with Vite
- [x] Configure TypeScript (`tsconfig.json`)
- [x] Set up ESLint (`.eslintrc.cjs`)
- [x] Set up Prettier (`.prettierrc`)
- [x] Install and configure Ant Design 5
- [x] Install and configure Zustand state management
- [x] Install and configure TanStack Query
- [x] Install and configure React Router
- [x] Create `components/layout/AppLayout.tsx`
- [x] Create `components/layout/Sidebar.tsx`
- [x] Create `components/layout/Header.tsx`
- [x] Create `components/layout/Breadcrumb.tsx`
- [x] Create `components/common/PageHeader.tsx`
- [x] Create `components/common/DataTable.tsx`
- [x] Create `components/common/StatusBadge.tsx`
- [x] Create `components/common/ConfirmDialog.tsx`
- [x] Create `components/common/SearchInput.tsx`
- [x] Create `components/common/FileUpload.tsx`
- [x] Set up `api/axios-instance.ts` with JWT interceptors
- [x] Set up `api/index.ts` barrel export
- [x] Create `types/api.types.ts`
- [x] Create `types/models.types.ts`
- [x] Create `types/enums.ts`
- [x] Create `utils/constants.ts`
- [x] Create `utils/format-date.ts`
- [x] Create `utils/format-currency.ts`
- [x] Create `utils/permissions.ts`
- [x] Create `store/ui.store.ts`
- [x] Create `store/notification.store.ts`
- [x] Set up `routes.tsx` with React Router configuration
- [x] Create `App.tsx` root component
- [x] Create `main.tsx` entry point
- [x] Set up i18n with `public/locales/en/common.json`

### Mobile

- [x] Initialize Expo project with Expo Router
- [x] Configure `app.json` and `eas.json`
- [x] Set up Babel configuration (`babel.config.js`)
- [x] Set up Prettier (`.prettierrc`)
- [x] Set up WatermelonDB schema (`src/db/schema.ts`)
- [x] Create WatermelonDB model: `src/db/models/WorkOrder.ts`
- [x] Create WatermelonDB model: `src/db/models/Appointment.ts`
- [x] Create WatermelonDB model: `src/db/models/Contact.ts`
- [x] Create WatermelonDB model: `src/db/models/JobSheet.ts`
- [x] Create WatermelonDB model: `src/db/models/Timesheet.ts`
- [x] Create WatermelonDB model: `src/db/models/Trip.ts`
- [x] Create WatermelonDB model index: `src/db/models/index.ts`
- [x] Create WatermelonDB sync: `src/db/sync.ts`
- [x] Create tab navigation layout: `app/(tabs)/_layout.tsx`
- [x] Create root layout: `app/_layout.tsx`
- [x] Create index entry: `app/index.tsx`
- [x] Set up MMKV storage via `src/store/auth.store.ts`
- [x] Create `src/store/sync.store.ts`
- [x] Create `src/api/api-client.ts`
- [x] Create `src/api/endpoints.ts`
- [x] Create `src/types/models.ts`
- [x] Create `src/theme/index.ts`
- [x] Create `src/utils/constants.ts`
- [x] Create `src/utils/format.ts`
- [x] Create `src/utils/permissions.ts`
- [x] Create `src/hooks/use-location.ts`
- [x] Create `src/hooks/use-offline.ts`
- [x] Create `src/hooks/use-notifications.ts`
- [x] Create `src/components/StatusBadge.tsx`
- [x] Create `src/components/JobCard.tsx`
- [x] Create `src/components/PhotoCapture.tsx`
- [x] Create `src/components/ChecklistItem.tsx`
- [x] Create `src/components/OfflineIndicator.tsx`
- [x] Create `src/components/MapNavigation.tsx`
- [x] Create `src/components/SignaturePad.tsx`
- [x] Create tab screens: `app/(tabs)/home.tsx`
- [x] Create tab screens: `app/(tabs)/map.tsx`
- [x] Create tab screens: `app/(tabs)/schedule.tsx`
- [x] Create tab screens: `app/(tabs)/notifications.tsx`
- [x] Create tab screens: `app/(tabs)/profile.tsx`

### AI

- [x] Initialize FastAPI project (`app/main.py`)
- [x] Create `app/config.py` for environment configuration
- [x] Create `app/dependencies.py` for dependency injection
- [x] Set up Celery worker (`app/tasks/celery_app.py`)
- [x] Create `app/tasks/__init__.py`
- [x] Create `app/tasks/analysis_tasks.py`
- [x] Create `app/tasks/scheduling_tasks.py`
- [x] Create `app/tasks/training_tasks.py`
- [x] Create Dockerfile for AI service
- [x] Create `.env.example`
- [x] Create `requirements.txt`
- [x] Create `pyproject.toml`
- [x] Set up `app/schemas/__init__.py`
- [x] Create `app/schemas/common.py`
- [x] Create `app/schemas/requests.py`
- [x] Create `app/schemas/responses.py`
- [x] Set up `app/services/__init__.py`
- [x] Create `app/services/llm_client.py`
- [x] Create `app/services/model_registry.py`
- [x] Create `app/services/vector_store.py`
- [x] Set up `app/api/__init__.py`
- [x] Create `app/api/analytics.py` (stub)
- [x] Create `app/api/chatbot.py` (stub)
- [x] Create `app/api/documents.py` (stub)
- [x] Create `app/api/predictions.py` (stub)
- [x] Create `app/api/scheduling.py` (stub)
- [x] Create `app/api/vision.py` (stub)
- [x] Create `app/api/voice.py` (stub)
- [x] Set up `app/models/__init__.py`
- [x] Create `app/models/scheduler/__init__.py`
- [x] Create `app/models/scheduler/vrp_solver.py` (stub)
- [x] Create `app/models/scheduler/demand_model.py` (stub)
- [x] Create `app/models/maintenance/__init__.py`
- [x] Create `app/models/maintenance/health_scorer.py` (stub)
- [x] Create `app/models/maintenance/lstm_predictor.py` (stub)
- [x] Create `app/models/nlp/__init__.py`
- [x] Create `app/models/nlp/chatbot_engine.py` (stub)
- [x] Create `app/models/nlp/nl_query.py` (stub)
- [x] Create `app/models/nlp/sentiment.py` (stub)
- [x] Create `app/models/document/__init__.py`
- [x] Create `app/models/document/ocr_engine.py` (stub)
- [x] Create `app/models/document/report_generator.py` (stub)
- [x] Create `app/models/vision/__init__.py`
- [x] Create `app/models/vision/work_verifier.py` (stub)
- [x] Create `app/models/vision/equipment_detector.py` (stub)
- [x] Create `data/models/.gitkeep`
- [x] Create `data/training/.gitkeep`
- [x] Create `tests/__init__.py`
- [x] Create `tests/conftest.py`
- [x] Create `tests/test_chatbot.py`
- [x] Create `tests/test_predictions.py`
- [x] Create `tests/test_scheduling.py`
- [ ] Configure Docker Compose for all services (Server + Web + AI + PostgreSQL + Redis)

---

## Phase 2: Authentication & Multi-Tenancy

### Server

#### TENANTS/ Module
- [x] Create `TENANTS/tenants.entity.ts` (Tenant model)
- [x] Create `TENANTS/dto/tenants.dto.ts` (create/update DTOs)
- [x] Create `TENANTS/tenants.provider.ts` (Sequelize provider)
- [x] Create `TENANTS/tenants.service.ts` (CRUD + settings logic)
- [x] Create `TENANTS/tenants.controller.ts` (REST endpoints)
- [x] Create `TENANTS/tenants.module.ts`
- [x] Register TENANTS module in `app.module.ts`

#### USERS/ Module
- [x] Create `USERS/users.entity.ts` (User model)
- [x] Create `USERS/dto/users.dto.ts` (base DTO)
- [x] Create `USERS/dto/users_create.dto.ts` (create DTO with password)
- [x] Create `USERS/dto/users_update.dto.ts` (update DTO)
- [x] Create `USERS/users.provider.ts` (Sequelize provider)
- [x] Create `USERS/users.service.ts` (CRUD + password hashing with bcrypt)
- [x] Create `USERS/users.controller.ts` (REST endpoints)
- [x] Create `USERS/users.module.ts`
- [x] Register USERS module in `app.module.ts`

#### auth/ Module
- [x] Create `auth/auth.service.ts` (login, register, JWT, refresh tokens, password reset)
- [x] Create `auth/auth.controller.ts` (auth REST endpoints)
- [x] Create `auth/dto/auth.dto.ts` (login, register, refresh DTOs)
- [x] Create `auth/auth.module.ts`
- [x] Register auth module in `app.module.ts`

#### auth/guards/
- [x] Create `auth/guards/jwt-auth.guard.ts` (JwtAuthGuard)
- [x] Create `auth/guards/local-auth.guard.ts` (LocalAuthGuard)

#### auth/strategies/
- [x] Create `auth/strategies/jwt.strategy.ts` (JwtStrategy)
- [x] Create `auth/strategies/local.strategy.ts` (LocalStrategy)

#### JWT_MODULE/
- [x] Create `JWT_MODULE/jwt.module.ts` (global JWT with async factory)
- [x] Register JWT_MODULE in `app.module.ts`

#### LOGIN_SESSIONS/
- [x] Create `LOGIN_SESSIONS/login_sessions.entity.ts`
- [x] Create `LOGIN_SESSIONS/login_sessions.provider.ts`
- [x] Create `LOGIN_SESSIONS/login_sessions.module.ts`
- [x] Register LOGIN_SESSIONS module in `app.module.ts`

#### Shared Middleware & Decorators
- [x] Create `shared/middleware/tenant.middleware.ts`
- [x] Create `shared/decorator/public.decorator.ts` (@Public)
- [x] Create `shared/decorator/tenant.decorator.ts` (@TenantId)
- [x] Create `shared/decorator/current-user.decorator.ts` (@CurrentUser)
- [x] Create `shared/guards/tenant.guard.ts`

### Web

- [x] Create `pages/auth/LoginPage.tsx`
- [x] Create `pages/auth/RegisterPage.tsx`
- [x] Create `pages/auth/ForgotPasswordPage.tsx`
- [x] Create `api/auth.api.ts` (login, register, forgot password API calls)
- [x] Create `hooks/use-auth.ts` (auth hook with TanStack Query)
- [x] Create `store/auth.store.ts` (JWT token management in Zustand)
- [ ] Implement protected route wrapper component
- [ ] Implement tenant context provider

### Mobile

- [x] Create auth layout: `app/(auth)/_layout.tsx`
- [x] Create login screen: `app/(auth)/login.tsx`
- [x] Create forgot password screen: `app/(auth)/forgot-password.tsx`
- [x] Implement secure token storage with MMKV in `src/store/auth.store.ts`
- [x] Implement biometric login option (Face ID / fingerprint)
- [ ] Implement auto-refresh token logic

---

## Phase 3: Roles, Permissions & User Management

### Server

#### PERMISSIONS/ Module
- [x] Create `PERMISSIONS/permissions.entity.ts` (Permission model)
- [x] Create `PERMISSIONS/dto/permissions.dto.ts` (create/update DTOs)
- [x] Create `PERMISSIONS/permissions.provider.ts` (Sequelize provider)
- [x] Create `PERMISSIONS/permissions.service.ts` (CRUD logic)
- [x] Create `PERMISSIONS/permissions.controller.ts` (REST endpoints)
- [x] Create `PERMISSIONS/permissions.module.ts`
- [x] Register PERMISSIONS module in `app.module.ts`

#### ROLES/ Module
- [x] Create `ROLES/roles.entity.ts` (Role model with customizable permissions)
- [x] Create `ROLES/dto/roles.dto.ts` (create/update DTOs)
- [x] Create `ROLES/roles.provider.ts` (Sequelize provider)
- [x] Create `ROLES/roles.service.ts` (CRUD with permission assignment)
- [x] Create `ROLES/roles.controller.ts` (REST endpoints)
- [x] Create `ROLES/roles.module.ts`
- [x] Register ROLES module in `app.module.ts`

#### ROLE_PERMISSION/ Module
- [x] Create `ROLE_PERMISSION/role_permission.entity.ts` (mapping model)
- [x] Create `ROLE_PERMISSION/role_permission.provider.ts` (Sequelize provider)
- [x] Create `ROLE_PERMISSION/role_permission.service.ts` (mapping logic)
- [x] Create `ROLE_PERMISSION/role_permission.module.ts`
- [x] Register ROLE_PERMISSION module in `app.module.ts`

#### USER_ROLES/ Module
- [x] Create `USER_ROLES/user_roles.entity.ts` (user-role assignment model)
- [x] Create `USER_ROLES/user_roles.provider.ts` (Sequelize provider)
- [x] Create `USER_ROLES/user_roles.service.ts` (user-role assignment + bulk assign)
- [x] Create `USER_ROLES/user_roles.module.ts`
- [x] Register USER_ROLES module in `app.module.ts`
- [x] Add bulk assign endpoint to USER_ROLES controller

#### USER_DOCUMENTS/ Module
- [x] Create `USER_DOCUMENTS/user_documents.entity.ts` (certifications, licenses, ID uploads)
- [x] Create `USER_DOCUMENTS/dto/user_documents.dto.ts`
- [x] Create `USER_DOCUMENTS/user_documents.provider.ts`
- [x] Create `USER_DOCUMENTS/user_documents.service.ts`
- [x] Create `USER_DOCUMENTS/user_documents.controller.ts`
- [x] Create `USER_DOCUMENTS/user_documents.module.ts`
- [x] Register USER_DOCUMENTS module in `app.module.ts`

#### Shared Guards
- [x] Create `shared/guards/permission.guard.ts` (RBAC enforcement)
- [x] Create `shared/decorator/permission.decorator.ts` (@Permissions decorator)

### Web

- [x] Create `pages/settings/RolesPermissionsPage.tsx` (roles & permissions settings)
- [x] Create `pages/users/UserListPage.tsx` (user management with invite, assign roles)
- [x] Create `pages/users/UserFormPage.tsx` (user create/edit form)
- [x] Create `pages/users/UserDetailPage.tsx` (user detail view)
- [x] Create `api/users.api.ts` (users API calls)
- [x] Create `hooks/use-users.ts` (users hook with TanStack Query)
- [x] Create `api/roles.api.ts` (roles API calls)
- [x] Create `hooks/use-roles.ts` (roles hook with TanStack Query)
- [x] Create `api/permissions.api.ts` (permissions API calls)
- [x] Create `hooks/use-permissions.ts` (permissions hook with TanStack Query)
- [x] Create `api/user-documents.api.ts` (user documents API calls)
- [x] Create `hooks/use-user-documents.ts` (user documents hook with TanStack Query)
- [x] Implement permission-based UI rendering utility
- [x] Add role assignment modal to user management page
- [x] Add user document upload to user detail page

### Mobile

- [x] Implement role-based navigation (show/hide tabs based on role)
- [x] Create user profile screen with document list
- [x] Create document upload screen
- [x] Create document viewer screen

---

## Phase 4: Customer & Contact Management

### Server

#### CONTACTS/ Module
- [x] Create `CONTACTS/contacts.entity.ts` (Contact model)
- [x] Create `CONTACTS/dto/contacts.dto.ts` (create/update/search DTOs)
- [x] Create `CONTACTS/contacts.provider.ts` (Sequelize provider)
- [x] Create `CONTACTS/contacts.service.ts` (CRUD, search, paginated, service history)
- [x] Create `CONTACTS/contacts.controller.ts` (REST endpoints)
- [x] Create `CONTACTS/contacts.module.ts`
- [x] Register CONTACTS module in `app.module.ts`

#### COMPANIES/ Module
- [x] Create `COMPANIES/companies.entity.ts` (Company model)
- [x] Create `COMPANIES/dto/companies.dto.ts` (create/update DTOs)
- [x] Create `COMPANIES/companies.provider.ts` (Sequelize provider)
- [x] Create `COMPANIES/companies.service.ts` (CRUD, linked contacts)
- [x] Create `COMPANIES/companies.controller.ts` (REST endpoints)
- [x] Create `COMPANIES/companies.module.ts`
- [x] Register COMPANIES module in `app.module.ts`

#### SERVICE_LOCATIONS/ Module
- [x] Create `SERVICE_LOCATIONS/service_locations.entity.ts` (ServiceLocation model)
- [x] Create `SERVICE_LOCATIONS/dto/service_locations.dto.ts` (create/update DTOs)
- [x] Create `SERVICE_LOCATIONS/service_locations.provider.ts` (Sequelize provider)
- [x] Create `SERVICE_LOCATIONS/service_locations.service.ts` (CRUD, geocoding, multiple per customer)
- [x] Create `SERVICE_LOCATIONS/service_locations.controller.ts` (REST endpoints)
- [x] Create `SERVICE_LOCATIONS/service_locations.module.ts`
- [x] Register SERVICE_LOCATIONS module in `app.module.ts`

### Web

- [x] Create `api/contacts.api.ts` (contacts API calls)
- [x] Create `hooks/use-contacts.ts` (contacts hook with TanStack Query)
- [x] Enhance `pages/contacts/ContactListPage.tsx` (search, filters, pagination with DataTable)
- [x] Create `pages/contacts/ContactDetailPage.tsx` (service history timeline)
- [x] Create `pages/contacts/ContactFormPage.tsx` (create/edit form)
- [x] Create `api/companies.api.ts` (companies API calls)
- [x] Create `hooks/use-companies.ts` (companies hook with TanStack Query)
- [x] Enhance `pages/companies/CompanyListPage.tsx` (list with filters)
- [x] Create `pages/companies/CompanyDetailPage.tsx` (linked contacts view)
- [x] Create `pages/companies/CompanyFormPage.tsx` (create/edit form)
- [x] Create `api/service-locations.api.ts` (service locations API calls)
- [x] Create `hooks/use-service-locations.ts` (service locations hook)
- [x] Create service location management component with map picker
- [x] Integrate contact/company/location routes in `routes.tsx`

### Mobile

- [x] Create contact search screen
- [x] Create contact detail view screen
- [x] Implement quick-call action on contact
- [x] Implement quick-navigate to service location
- [x] Set up customer history offline caching with WatermelonDB
- [x] Create company detail screen
- [x] Create service location detail screen

---

## Phase 5: Asset Management

### Server

#### ASSETS/ Module
- [x] Create `ASSETS/assets.entity.ts` (Asset model with warranty tracking)
- [x] Create `ASSETS/dto/assets.dto.ts` (create/update/search DTOs)
- [x] Create `ASSETS/assets.provider.ts` (Sequelize provider)
- [x] Create `ASSETS/assets.service.ts` (CRUD, service history, warranty tracking)
- [x] Create `ASSETS/assets.controller.ts` (REST endpoints)
- [x] Create `ASSETS/assets.module.ts`
- [x] Register ASSETS module in `app.module.ts`

#### ASSET_MAINTENANCE_PLANS/ Module
- [x] Create `ASSET_MAINTENANCE_PLANS/asset_maintenance_plans.entity.ts`
- [x] Create `ASSET_MAINTENANCE_PLANS/dto/asset_maintenance_plans.dto.ts`
- [x] Create `ASSET_MAINTENANCE_PLANS/asset_maintenance_plans.provider.ts`
- [x] Create `ASSET_MAINTENANCE_PLANS/asset_maintenance_plans.service.ts` (CRUD, recurring schedule, auto-create WO)
- [x] Create `ASSET_MAINTENANCE_PLANS/asset_maintenance_plans.controller.ts`
- [x] Create `ASSET_MAINTENANCE_PLANS/asset_maintenance_plans.module.ts`
- [x] Register ASSET_MAINTENANCE_PLANS module in `app.module.ts`

### Web

- [x] Create `api/assets.api.ts` (assets API calls)
- [x] Create `hooks/use-assets.ts` (assets hook with TanStack Query)
- [x] Enhance `pages/assets/AssetListPage.tsx` (asset registry with search and filters)
- [x] Create `pages/assets/AssetDetailPage.tsx` (info, service history, maintenance plan)
- [x] Create `pages/assets/AssetFormPage.tsx` (create/edit form)
- [x] Create `api/maintenance-plans.api.ts` (maintenance plans API calls)
- [x] Create `hooks/use-maintenance-plans.ts` (maintenance plans hook)
- [x] Create maintenance plan scheduler component
- [x] Integrate asset routes in `routes.tsx`

### Mobile

- [x] Create asset lookup screen (search by name)
- [x] Implement barcode/serial number scanning for asset lookup
- [x] Create asset detail screen with service history
- [x] Create asset service history on-site view

### AI

- [x] Implement equipment health scoring model class (baseline)
- [x] Create health scoring API endpoint integration
- [x] Write tests for equipment health scoring model

---

## Phase 6: Services & Parts Catalog

### Server

#### SERVICES_CATALOG/ Module
- [x] Create `SERVICES_CATALOG/services_catalog.entity.ts` (Service model with pricing, tax, duration)
- [x] Create `SERVICES_CATALOG/dto/services_catalog.dto.ts` (create/update DTOs)
- [x] Create `SERVICES_CATALOG/services_catalog.provider.ts` (Sequelize provider)
- [x] Create `SERVICES_CATALOG/services_catalog.service.ts` (CRUD, pricing, tax, duration)
- [x] Create `SERVICES_CATALOG/services_catalog.controller.ts` (REST endpoints)
- [x] Create `SERVICES_CATALOG/services_catalog.module.ts`
- [x] Register SERVICES_CATALOG module in `app.module.ts`

#### PARTS_CATALOG/ Module
- [x] Create `PARTS_CATALOG/parts_catalog.entity.ts` (Part model with SKU, stock tracking)
- [x] Create `PARTS_CATALOG/dto/parts_catalog.dto.ts` (create/update DTOs)
- [x] Create `PARTS_CATALOG/parts_catalog.provider.ts` (Sequelize provider)
- [x] Create `PARTS_CATALOG/parts_catalog.service.ts` (CRUD, SKU, stock tracking, reorder alerts)
- [x] Create `PARTS_CATALOG/parts_catalog.controller.ts` (REST endpoints)
- [x] Create `PARTS_CATALOG/parts_catalog.module.ts`
- [x] Register PARTS_CATALOG module in `app.module.ts`

### Web

- [x] Create `api/services-catalog.api.ts` (services catalog API calls)
- [x] Create `hooks/use-services-catalog.ts` (services catalog hook)
- [x] Create `pages/catalog/ServicesCatalogPage.tsx` (services management)
- [x] Create `pages/catalog/ServiceFormPage.tsx` (service create/edit form)
- [x] Create `api/parts-catalog.api.ts` (parts catalog API calls)
- [x] Create `hooks/use-parts-catalog.ts` (parts catalog hook)
- [x] Create `pages/catalog/PartsCatalogPage.tsx` (parts inventory with stock levels)
- [x] Create `pages/catalog/PartFormPage.tsx` (part create/edit form)
- [ ] Implement reorder level alert notification component
- [x] Integrate catalog routes in `routes.tsx`

### Mobile

- [x] Create services catalog browse screen
- [x] Create parts catalog browse screen
- [x] Implement check parts availability before job feature
- [x] Create parts detail screen with stock information

---

## Phase 7: Service Requests

### Server

#### SERVICE_REQUESTS/ Module
- [x] Create `SERVICE_REQUESTS/service_requests.entity.ts` (ServiceRequest model)
- [x] Create `SERVICE_REQUESTS/dto/service_requests.dto.ts` (create/update/triage DTOs)
- [x] Create `SERVICE_REQUESTS/service_requests.provider.ts` (Sequelize provider)
- [x] Create `SERVICE_REQUESTS/service_requests.service.ts` (CRUD, multi-channel intake, triage, assign, convert to WO)
- [x] Create `SERVICE_REQUESTS/service_requests.controller.ts` (REST endpoints)
- [x] Create `SERVICE_REQUESTS/service_requests.module.ts`
- [x] Register SERVICE_REQUESTS module in `app.module.ts`
- [x] Implement integration with WEBFORMS/ for external intake
- [x] Implement auto-assignment rules (round-robin)
- [x] Implement auto-assignment rules (territory-based)
- [x] Implement auto-assignment rules (skill-based)

### Web

- [x] Create `api/service-requests.api.ts` (service requests API calls)
- [x] Create `hooks/use-service-requests.ts` (service requests hook)
- [x] Enhance `pages/service-requests/RequestListPage.tsx` (request inbox with status filters)
- [x] Create `pages/service-requests/RequestDetailPage.tsx` (triage actions)
- [x] Create `pages/service-requests/RequestFormPage.tsx` (create/edit form)
- [ ] Implement convert-to-WO flow
- [ ] Implement convert-to-estimate flow
- [x] Integrate service request routes in `routes.tsx`

### Mobile

- [x] Create request list screen for dispatchers
- [x] Create quick request creation screen
- [x] Create request detail screen

### AI

- [x] Implement NLP auto-categorization model for request descriptions
- [x] Create auto-categorization API endpoint integration
- [x] Implement priority suggestion based on sentiment analysis
- [x] Create priority suggestion API endpoint integration
- [x] Write tests for NLP request categorization
- [x] Write tests for priority suggestion

---

## Phase 8: Estimates

### Server

#### ESTIMATES/ Module
- [x] Create `ESTIMATES/estimates.entity.ts` (Estimate model with expiry)
- [x] Create `ESTIMATES/dto/estimates.dto.ts` (create/update/send/approve/reject DTOs)
- [x] Create `ESTIMATES/estimates.provider.ts` (Sequelize provider)
- [x] Create `ESTIMATES/estimates.service.ts` (CRUD, send, approve, reject, convert to WO, expiry)
- [x] Create `ESTIMATES/estimates.controller.ts` (REST endpoints)
- [x] Create `ESTIMATES/estimates.module.ts`
- [x] Register ESTIMATES module in `app.module.ts`

#### ESTIMATE_LINE_ITEMS/ Module
- [x] Create `ESTIMATE_LINE_ITEMS/estimate_line_items.entity.ts` (service/part/travel with tax/discount)
- [x] Create `ESTIMATE_LINE_ITEMS/dto/estimate_line_items.dto.ts`
- [x] Create `ESTIMATE_LINE_ITEMS/estimate_line_items.provider.ts`
- [x] Create `ESTIMATE_LINE_ITEMS/estimate_line_items.service.ts`
- [x] Create `ESTIMATE_LINE_ITEMS/estimate_line_items.controller.ts`
- [x] Create `ESTIMATE_LINE_ITEMS/estimate_line_items.module.ts`
- [x] Register ESTIMATE_LINE_ITEMS module in `app.module.ts`

#### PDF & Email
- [x] Implement PDF generation for estimates (HTML-based, ready for Puppeteer)
- [x] Implement email delivery of estimates (Placeholder service ready)

### Web

- [x] Create `api/estimates.api.ts` (estimates API calls)
- [x] Create `hooks/use-estimates.ts` (estimates hook)
- [x] Enhance `pages/estimates/EstimateListPage.tsx` (list with status filters)
- [x] Create `pages/estimates/EstimateDetailPage.tsx` (preview with PDF download)
- [x] Create `pages/estimates/EstimateFormPage.tsx` (create/edit form)
- [x] Create `pages/estimates/EstimateBuilderPage.tsx` (line items with drag-and-drop ordering)
- [x] Implement customer approval tracking view
- [x] Implement convert approved estimate to work order flow
- [x] Integrate estimate routes in `routes.tsx`

### Mobile

- [x] Create estimate list screen
- [x] Create estimate creation screen (on-site)
- [x] Create estimate view screen
- [x] Implement customer signature for approval

### AI

- [x] Implement AI estimate generation from request description model
- [x] Create AI estimate generation API endpoint
- [x] Write tests for AI estimate generation

---

## Phase 9: Work Orders

### Server

#### WORK_ORDERS/ Module
- [x] Create `WORK_ORDERS/work_orders.entity.ts` (full lifecycle model)
- [x] Create `WORK_ORDERS/dto/work_orders.dto.ts` (create/update/status transition DTOs)
- [x] Create `WORK_ORDERS/work_orders.provider.ts` (Sequelize provider)
- [x] Create `WORK_ORDERS/work_orders.service.ts` (full lifecycle CRUD, status transitions, recurring)
- [x] Create `WORK_ORDERS/work_orders.controller.ts` (REST endpoints)
- [x] Create `WORK_ORDERS/work_orders.module.ts`
- [x] Register WORK_ORDERS module in `app.module.ts`

#### WORK_ORDER_LINE_ITEMS/ Module
- [x] Create `WORK_ORDER_LINE_ITEMS/work_order_line_items.entity.ts` (service/part/travel)
- [x] Create `WORK_ORDER_LINE_ITEMS/dto/work_order_line_items.dto.ts`
- [x] Create `WORK_ORDER_LINE_ITEMS/work_order_line_items.provider.ts`
- [x] Create `WORK_ORDER_LINE_ITEMS/work_order_line_items.service.ts`
- [x] Create `WORK_ORDER_LINE_ITEMS/work_order_line_items.controller.ts`
- [x] Create `WORK_ORDER_LINE_ITEMS/work_order_line_items.module.ts`
- [x] Register WORK_ORDER_LINE_ITEMS module in `app.module.ts`

#### WORK_ORDER_NOTES/ Module
- [x] Create `WORK_ORDER_NOTES/work_order_notes.entity.ts` (internal/external notes)
- [x] Create `WORK_ORDER_NOTES/dto/work_order_notes.dto.ts`
- [x] Create `WORK_ORDER_NOTES/work_order_notes.provider.ts`
- [x] Create `WORK_ORDER_NOTES/work_order_notes.service.ts`
- [x] Create `WORK_ORDER_NOTES/work_order_notes.controller.ts`
- [x] Create `WORK_ORDER_NOTES/work_order_notes.module.ts`
- [x] Register WORK_ORDER_NOTES module in `app.module.ts`

#### WORK_ORDER_ATTACHMENTS/ Module
- [x] Create `WORK_ORDER_ATTACHMENTS/work_order_attachments.entity.ts` (photos, documents)
- [x] Create `WORK_ORDER_ATTACHMENTS/dto/work_order_attachments.dto.ts`
- [x] Create `WORK_ORDER_ATTACHMENTS/work_order_attachments.provider.ts`
- [x] Create `WORK_ORDER_ATTACHMENTS/work_order_attachments.service.ts`
- [x] Create `WORK_ORDER_ATTACHMENTS/work_order_attachments.controller.ts`
- [x] Create `WORK_ORDER_ATTACHMENTS/work_order_attachments.module.ts`
- [x] Register WORK_ORDER_ATTACHMENTS module in `app.module.ts`

#### Status Transition
- [x] Implement status transition validation engine (Blueprint-based)

### Web

- [x] Create `api/work-orders.api.ts` (work orders API calls)
- [x] Create `hooks/use-work-orders.ts` (work orders hook)
- [x] Enhance `pages/work-orders/WorkOrderListPage.tsx` (advanced filters)
- [x] Create `pages/work-orders/WorkOrderDetailPage.tsx` (tabbed detail view)
- [x] Create `pages/work-orders/WorkOrderFormPage.tsx` (form with line item builder)
- [ ] Create `pages/work-orders/WorkOrderRecurringSetup.tsx` (recurring WO configuration)
- [x] Create work order notes component
- [x] Create work order attachments component
- [x] Integrate work order routes in `routes.tsx`

### Mobile

- [x] Enhance work order list screen (`app/(tabs)/home.tsx`) - today's jobs view
- [x] Enhance `app/work-order/[id].tsx` (all tabs: details, notes, attachments, line items)
- [x] Implement status updates from field
- [x] Implement photo/attachment upload from camera
- [x] Create work order notes screen
- [x] Create work order line items screen

---
 
## Phase 10: Service Appointments & Scheduling

### Server

#### SERVICE_APPOINTMENTS/ Module
- [x] Create `SERVICE_APPOINTMENTS/service_appointments.entity.ts`
- [x] Create `SERVICE_APPOINTMENTS/dto/service_appointments.dto.ts` (create/assign/reschedule DTOs)
- [x] Create `SERVICE_APPOINTMENTS/service_appointments.provider.ts`
- [x] Create `SERVICE_APPOINTMENTS/service_appointments.service.ts` (CRUD, assign, reschedule, multi-tech, recurring)
- [x] Create `SERVICE_APPOINTMENTS/service_appointments.controller.ts`
- [x] Create `SERVICE_APPOINTMENTS/service_appointments.module.ts`
- [x] Register SERVICE_APPOINTMENTS module in `app.module.ts`

#### SCHEDULING/ Module
- [x] Create `SCHEDULING/scheduling.entity.ts` (if needed for persisted scheduling data)
- [x] Create `SCHEDULING/dto/scheduling.dto.ts` (Gantt data, calendar data DTOs)
- [x] Create `SCHEDULING/scheduling.service.ts` (availability, conflict detection, auto-assign)
- [x] Create `SCHEDULING/scheduling.controller.ts` (REST endpoints)
- [x] Create `SCHEDULING/scheduling.module.ts`
- [x] Register SCHEDULING module in `app.module.ts`
- [x] Implement skill-based availability calculation
- [x] Implement territory-based availability calculation
- [x] Implement shift-based availability calculation
- [x] Implement time-off availability calculation
- [x] Implement conflict detection logic

### Web

- [x] Create `api/appointments.api.ts` (appointments API calls)
- [x] Create `hooks/use-appointments.ts` (appointments hook)
- [x] Create `api/scheduling.api.ts` (scheduling API calls)
- [x] Create `hooks/use-scheduling.ts` (scheduling hook)
- [x] Enhance `pages/scheduling/DispatchBoardPage.tsx` (Gantt chart with Apache ECharts + @dnd-kit drag-drop)
- [x] Create `pages/scheduling/CalendarViewPage.tsx` (day/week/month calendar)
- [x] Create `pages/scheduling/MapViewPage.tsx` (live agent locations with Mapbox GL)
- [x] Implement auto-assign with skill/territory/availability UI
- [x] Implement conflict detection alert components
- [x] Integrate scheduling routes in `routes.tsx`

### Mobile

- [x] Enhance `app/(tabs)/schedule.tsx` (daily schedule view)
- [x] Create `app/appointment/[id].tsx` (appointment detail)
- [x] Implement accept/reject appointment actions
- [x] Implement navigation to job site (deep link to Maps app)
- [x] Enhance `app/appointment/start-trip.tsx`
- [x] Enhance `app/appointment/on-site.tsx`
- [x] Enhance `app/appointment/signature.tsx`
- [x] Enhance `app/appointment/complete.tsx`

### AI

- [x] Implement OR-Tools VRP solver for optimal scheduling
- [x] Create VRP solver API endpoint integration
- [x] Implement travel time estimation with traffic data
- [x] Create travel time API endpoint integration
- [x] Write tests for VRP solver
- [x] Write tests for travel time estimation

---

## Phase 11: Job Sheets (Checklists)

### Server

#### JOB_SHEET_TEMPLATES/ Module
- [x] Create `JOB_SHEET_TEMPLATES/job_sheet_templates.entity.ts`
- [x] Create `JOB_SHEET_TEMPLATES/dto/job_sheet_templates.dto.ts`
- [x] Create `JOB_SHEET_TEMPLATES/job_sheet_templates.provider.ts`
- [x] Create `JOB_SHEET_TEMPLATES/job_sheet_templates.service.ts`
- [x] Create `JOB_SHEET_TEMPLATES/job_sheet_templates.controller.ts`
- [x] Create `JOB_SHEET_TEMPLATES/job_sheet_templates.module.ts`
- [x] Register JOB_SHEET_TEMPLATES module in `app.module.ts`

#### JOB_SHEET_INSTANCES/ Module
- [x] Create `JOB_SHEET_INSTANCES/job_sheet_instances.entity.ts`
- [x] Create `JOB_SHEET_INSTANCES/dto/job_sheet_instances.dto.ts`
- [x] Create `JOB_SHEET_INSTANCES/job_sheet_instances.provider.ts`
- [x] Create `JOB_SHEET_INSTANCES/job_sheet_instances.service.ts`
- [x] Create `JOB_SHEET_INSTANCES/job_sheet_instances.controller.ts`
- [x] Create `JOB_SHEET_INSTANCES/job_sheet_instances.module.ts`
- [x] Register JOB_SHEET_INSTANCES module in `app.module.ts`

#### JOB_SHEET_ITEMS/ Module
- [x] Create `JOB_SHEET_ITEMS/job_sheet_items.entity.ts` (checkbox, text, photo, signature types)
- [x] Create `JOB_SHEET_ITEMS/dto/job_sheet_items.dto.ts`
- [x] Create `JOB_SHEET_ITEMS/job_sheet_items.provider.ts`
- [x] Create `JOB_SHEET_ITEMS/job_sheet_items.service.ts`
- [x] Create `JOB_SHEET_ITEMS/job_sheet_items.controller.ts`
- [x] Create `JOB_SHEET_ITEMS/job_sheet_items.module.ts`
- [x] Register JOB_SHEET_ITEMS module in `app.module.ts`

### Web

- [x] Create `api/job-sheets.api.ts` (job sheets API calls)
- [x] Create `hooks/use-job-sheets.ts` (job sheets hook)
- [x] Create `pages/job-sheets/JobSheetBuilderPage.tsx` (visual drag-and-drop job sheet builder with 10 item types)
- [x] Create `pages/job-sheets/JobSheetTemplateListPage.tsx` (template list)
- [x] Create `pages/job-sheets/JobSheetTemplateFormPage.tsx` (template form)
- [x] Create `pages/job-sheets/JobSheetDashboardPage.tsx` (completion monitoring dashboard)
- [x] Integrate job sheet routes in `routes.tsx`

### Mobile

- [x] Enhance `app/work-order/checklist/[id].tsx` (step-by-step checklist completion)
- [x] Implement photo capture per checklist item
- [x] Implement customer signature capture at end of job sheet
- [x] Implement offline checklist completion with WatermelonDB sync

### AI

- [x] Implement computer vision verification model for completed work (YOLOv8)
- [x] Create vision verification API endpoint integration
- [x] Write tests for computer vision work verification

---

## Phase 12: Timesheets, Trips & Location Tracking

### Server

#### TIMESHEETS/ Module
- [x] Create `TIMESHEETS/timesheets.entity.ts` (clock in/out, manual entry)
- [x] Create `TIMESHEETS/dto/timesheets.dto.ts` (create/update/approve DTOs)
- [x] Create `TIMESHEETS/timesheets.provider.ts`
- [x] Create `TIMESHEETS/timesheets.service.ts` (clock in/out, manual entry, approval workflow)
- [x] Create `TIMESHEETS/timesheets.controller.ts`
- [x] Create `TIMESHEETS/timesheets.module.ts`
- [x] Register TIMESHEETS module in `app.module.ts`

#### TRIPS/ Module
- [x] Create `TRIPS/trips.entity.ts` (start/end trip, distance, route)
- [x] Create `TRIPS/dto/trips.dto.ts`
- [x] Create `TRIPS/trips.provider.ts`
- [x] Create `TRIPS/trips.service.ts` (start/end trip, distance calculation, route storage)
- [x] Create `TRIPS/trips.controller.ts`
- [x] Create `TRIPS/trips.module.ts`
- [x] Register TRIPS module in `app.module.ts`

#### AGENT_LOCATIONS/ Module
- [x] Create `AGENT_LOCATIONS/agent_locations.entity.ts` (live GPS data)
- [x] Create `AGENT_LOCATIONS/dto/agent_locations.dto.ts`
- [x] Create `AGENT_LOCATIONS/agent_locations.provider.ts`
- [x] Create `AGENT_LOCATIONS/agent_locations.service.ts` (live GPS updates, proximity search)
- [x] Create `AGENT_LOCATIONS/agent_locations.controller.ts`
- [x] Create `AGENT_LOCATIONS/agent_locations.module.ts`
- [x] Register AGENT_LOCATIONS module in `app.module.ts`

#### REALTIME/ Gateway
- [ ] Create `REALTIME/realtime.gateway.ts` (Socket.IO for live location broadcasting)
- [ ] Create `REALTIME/realtime.module.ts`
- [ ] Register REALTIME module in `app.module.ts`

### Web

- [x] Create `api/timesheets.api.ts` (timesheets API calls)
- [x] Create `hooks/use-timesheets.ts` (timesheets hook)
- [x] Create `pages/timesheets/TimesheetListPage.tsx` (management with approval)
- [x] Create `pages/timesheets/TimesheetDetailPage.tsx`
- [x] Create `api/trips.api.ts` (trips API calls)
- [x] Create `hooks/use-trips.ts` (trips hook)
- [x] Create `pages/trips/TripHistoryPage.tsx` (route visualization with AI insights)
- [x] Create `api/agent-locations.api.ts` (agent locations API calls)
- [x] Create `hooks/use-agent-locations.ts` (agent locations hook)
- [x] Create `pages/tracking/LiveAgentTrackingPage.tsx` (live agent tracking map with AI optimization)
- [x] Create mileage/fuel reports component
- [x] Integrate timesheet/trip/tracking routes in `routes.tsx`

### Mobile

- [x] Enhance `app/timesheet/index.tsx` (clock in/out buttons)
- [x] Implement background GPS tracking service
- [x] Implement trip auto-logging (start/end based on movement)
- [x] Implement navigation integration (deep link to Google Maps / Apple Maps)
- [x] Create trip history screen
- [x] Create manual timesheet entry screen


## Phase 13: Invoicing & Payments

### Server

#### INVOICES/ Module
- [x] Create `INVOICES/invoices.entity.ts` (Invoice model)
- [x] Create `INVOICES/dto/invoices.dto.ts` (create/send/void DTOs)
- [x] Create `INVOICES/invoices.provider.ts`
- [x] Create `INVOICES/invoices.service.ts` (CRUD, send, void, PDF generate, batch invoicing)
- [x] Create `INVOICES/invoices.controller.ts`
- [x] Create `INVOICES/invoices.module.ts`
- [x] Register INVOICES module in `app.module.ts`

#### INVOICE_LINE_ITEMS/ Module
- [x] Create `INVOICE_LINE_ITEMS/invoice_line_items.entity.ts` (auto-populate from WO)
- [x] Create `INVOICE_LINE_ITEMS/dto/invoice_line_items.dto.ts`
- [x] Create `INVOICE_LINE_ITEMS/invoice_line_items.provider.ts`
- [x] Create `INVOICE_LINE_ITEMS/invoice_line_items.service.ts`
- [x] Create `INVOICE_LINE_ITEMS/invoice_line_items.controller.ts`
- [x] Create `INVOICE_LINE_ITEMS/invoice_line_items.module.ts`
- [x] Register INVOICE_LINE_ITEMS module in `app.module.ts`

#### PAYMENTS/ Module
- [x] Create `PAYMENTS/payments.entity.ts` (record, refund, history)
- [x] Create `PAYMENTS/dto/payments.dto.ts`
- [x] Create `PAYMENTS/payments.provider.ts`
- [x] Create `PAYMENTS/payments.service.ts` (record, refund, history)
- [x] Create `PAYMENTS/payments.controller.ts`
- [x] Create `PAYMENTS/payments.module.ts`
- [x] Register PAYMENTS module in `app.module.ts`

#### PAYMENT_GATEWAYS/ Module
- [x] Create `PAYMENT_GATEWAYS/payment_gateways.entity.ts` (Stripe/Razorpay config)
- [x] Create `PAYMENT_GATEWAYS/dto/payment_gateways.dto.ts`
- [x] Create `PAYMENT_GATEWAYS/payment_gateways.provider.ts`
- [x] Create `PAYMENT_GATEWAYS/payment_gateways.service.ts` (Stripe/Razorpay config, webhooks)
- [x] Create `PAYMENT_GATEWAYS/payment_gateways.controller.ts`
- [x] Create `PAYMENT_GATEWAYS/payment_gateways.module.ts`
- [x] Register PAYMENT_GATEWAYS module in `app.module.ts`

#### Auto-Invoice
- [x] Implement auto-invoice generation from completed work orders

### Web

- [x] Create `api/invoices.api.ts` (invoices API calls)
- [x] Create `hooks/use-invoices.ts` (invoices hook)
- [x] Enhance `pages/invoices/InvoiceListPage.tsx` (status filters)
- [x] Create `pages/invoices/InvoiceDetailPage.tsx` (PDF preview)
- [x] Create `pages/invoices/InvoiceFormPage.tsx` (create/edit form)
- [x] Implement batch invoice generation UI
- [x] Create `api/payments.api.ts` (payments API calls)
- [x] Create `hooks/use-payments.ts` (payments hook)
- [x] Enhance `pages/payments/PaymentListPage.tsx` (payment recording)
- [x] Create `pages/payments/PaymentFormPage.tsx`
- [x] Create `pages/payments/PaymentDetailPage.tsx`
- [x] Create `pages/settings/PaymentGatewaySettingsPage.tsx` (gateway configuration)
- [x] Integrate invoice/payment routes in `routes.tsx`

### Mobile

- [x] Create on-site payment collection screen (Stripe Terminal integration)
- [x] Create invoice view screen
- [x] Implement send invoice to customer (email/SMS)
- [x] Create payment receipt screen

---

## Phase 14: Service Agreements & Contracts

### Server

#### SERVICE_AGREEMENTS/ Module
- [x] Create `SERVICE_AGREEMENTS/service_agreements.entity.ts`
- [x] Create `SERVICE_AGREEMENTS/dto/service_agreements.dto.ts` (create/renew/cancel DTOs)
- [x] Create `SERVICE_AGREEMENTS/service_agreements.provider.ts`
- [x] Create `SERVICE_AGREEMENTS/service_agreements.service.ts` (CRUD, renew, cancel, SLA monitoring)
- [x] Create `SERVICE_AGREEMENTS/service_agreements.controller.ts`
- [x] Create `SERVICE_AGREEMENTS/service_agreements.module.ts`
- [x] Register SERVICE_AGREEMENTS module in `app.module.ts`

#### SLA & Recurring
- [x] Implement SLA breach detection scheduler (cron job)
- [ ] Implement auto-WO creation for recurring agreements

### Web

- [x] Create `api/service-agreements.api.ts` (service agreements API calls)
- [x] Create `hooks/use-service-agreements.ts` (service agreements hook)
- [x] Create `pages/agreements/AgreementListPage.tsx` (service agreement management)
- [x] Create `pages/agreements/AgreementDetailPage.tsx`
- [x] Create `pages/agreements/AgreementFormPage.tsx`
- [x] Create `pages/agreements/SLAComplianceDashboard.tsx` (SLA compliance dashboard)
- [ ] Implement agreement renewal workflow UI
- [x] Integrate agreement routes in `routes.tsx`

### Mobile

- [x] Create active agreements view for customer on-site
- [x] Create agreement detail screen

---

## Phase 15: Blueprints (Visual State Machine Engine)

### Server

#### BLUEPRINT_DEFINITIONS/ Module
- [x] Create `BLUEPRINT_DEFINITIONS/blueprint_definitions.entity.ts`
- [x] Create `BLUEPRINT_DEFINITIONS/dto/blueprint_definitions.dto.ts`
- [x] Create `BLUEPRINT_DEFINITIONS/blueprint_definitions.provider.ts`
- [x] Create `BLUEPRINT_DEFINITIONS/blueprint_definitions.service.ts`
- [x] Create `BLUEPRINT_DEFINITIONS/blueprint_definitions.controller.ts`
- [x] Create `BLUEPRINT_DEFINITIONS/blueprint_definitions.module.ts`
- [x] Register BLUEPRINT_DEFINITIONS module in `app.module.ts`

#### BLUEPRINT_STATES/ Module
- [x] Create `BLUEPRINT_STATES/blueprint_states.entity.ts`
- [x] Create `BLUEPRINT_STATES/dto/blueprint_states.dto.ts`
- [x] Create `BLUEPRINT_STATES/blueprint_states.provider.ts`
- [x] Create `BLUEPRINT_STATES/blueprint_states.service.ts`
- [x] Create `BLUEPRINT_STATES/blueprint_states.controller.ts`
- [x] Create `BLUEPRINT_STATES/blueprint_states.module.ts`
- [x] Register BLUEPRINT_STATES module in `app.module.ts`

#### BLUEPRINT_TRANSITIONS/ Module
- [x] Create `BLUEPRINT_TRANSITIONS/blueprint_transitions.entity.ts`
- [x] Create `BLUEPRINT_TRANSITIONS/dto/blueprint_transitions.dto.ts`
- [x] Create `BLUEPRINT_TRANSITIONS/blueprint_transitions.provider.ts`
- [x] Create `BLUEPRINT_TRANSITIONS/blueprint_transitions.service.ts`
- [x] Create `BLUEPRINT_TRANSITIONS/blueprint_transitions.controller.ts`
- [x] Create `BLUEPRINT_TRANSITIONS/blueprint_transitions.module.ts`
- [x] Register BLUEPRINT_TRANSITIONS module in `app.module.ts`

#### Blueprint Engine
- [x] Implement blueprint execution engine (validate transitions at runtime)
- [x] Implement transition guard evaluation
- [x] Implement required field validation on transitions
- [x] Implement webhook triggers on transitions

### Web

- [x] Create `api/blueprints.api.ts` (blueprints API calls)
- [x] Create `hooks/use-blueprints.ts` (blueprints hook)
- [x] Create `pages/blueprints/BlueprintListPage.tsx` (blueprint list)
- [x] Create `pages/blueprints/BlueprintEditorPage.tsx` (visual drag-and-drop state machine designer)
- [x] Implement transition configuration panel (guards, required fields, webhooks)
- [x] Implement blueprint testing/simulation mode
- [x] Integrate blueprint routes in `routes.tsx`

---

## Phase 16: Communication & Notifications

### Server

#### NOTIFICATIONS/ Module
- [x] Create `NOTIFICATIONS/notifications.entity.ts`
- [x] Create `NOTIFICATIONS/dto/notifications.dto.ts`
- [x] Create `NOTIFICATIONS/notifications.provider.ts`
- [x] Create `NOTIFICATIONS/notifications.service.ts` (scheduler: SLA warnings, reminders, payment due)
- [x] Create `NOTIFICATIONS/notifications.controller.ts`
- [x] Create `NOTIFICATIONS/notifications.module.ts`
- [x] Register NOTIFICATIONS module in `app.module.ts`

#### COMMUNICATION/ Module
- [x] Create `COMMUNICATION/communication.entity.ts`
- [x] Create `COMMUNICATION/dto/communication.dto.ts`
- [x] Create `COMMUNICATION/communication.provider.ts`
- [x] Create `COMMUNICATION/communication.service.ts` (email, SMS, WhatsApp, in-app)
- [x] Create `COMMUNICATION/communication.controller.ts`
- [x] Create `COMMUNICATION/communication.module.ts`
- [x] Register COMMUNICATION module in `app.module.ts`

#### FIREBASE/ Module
- [ ] Create `FIREBASE/firebase.service.ts` (FCM push notifications)
- [ ] Create `FIREBASE/firebase.module.ts`
- [ ] Register FIREBASE module in `app.module.ts`

#### Multi-Channel Delivery
- [x] Implement multi-channel notification delivery engine (Email service ready)
- [x] Implement email channel adapter (Placeholder ready for SMTP)
- [ ] Implement SMS channel adapter
- [ ] Implement WhatsApp channel adapter
- [x] Implement in-app channel adapter (Via NOTIFICATIONS module)
- [ ] Implement FCM push notification channel adapter

### Web

- [x] Create `api/notifications.api.ts` (notifications API calls)
- [x] Create `hooks/use-notifications.ts` (notifications hook)
- [x] Create notification center component (bell icon with feed)
- [x] Create `api/communications.api.ts` (communications API calls)
- [x] Create `hooks/use-communications.ts` (communications hook)
- [x] Create `pages/communications/CommunicationListPage.tsx` (communication history)
- [x] Create `pages/communications/CommunicationDetailPage.tsx` (communication detail view)
- [x] Create `pages/settings/EmailSmsTemplateManagementPage.tsx` (template management)
- [x] Create `pages/settings/NotificationPreferencesPage.tsx` (notification preferences)
- [x] Integrate communication routes in `routes.tsx`

### Mobile

- [x] Enhance `app/(tabs)/notifications.tsx` (push notification handling)
- [x] Create in-app notification feed screen
- [x] Implement quick reply to messages 
- [x] Configure FCM push notification handling in `app/_layout.tsx`

---

## Phase 17: Webforms & Customer Portal

### Server

#### WEBFORMS/ Module
- [x] Create `WEBFORMS/webforms.entity.ts`
- [x] Create `WEBFORMS/dto/webforms.dto.ts` (create/update DTOs)
- [x] Create `WEBFORMS/webforms.provider.ts`
- [x] Create `WEBFORMS/webforms.service.ts` (CRUD, embed code, submission handler -> creates service request)
- [x] Create `WEBFORMS/webforms.controller.ts`
- [x] Create `WEBFORMS/webforms.module.ts`
- [x] Register WEBFORMS module in `app.module.ts`

#### Customer Portal API
- [x] Create customer portal public endpoint: service request tracking
- [x] Create customer portal public endpoint: payment history
- [x] Create customer portal public endpoint: service history
- [x] Create customer portal public endpoint: make payment
- [x] Create customer portal authentication (token-based)

### Web

- [x] Create `api/webforms.api.ts` (webforms API calls)
- [x] Create `hooks/use-webforms.ts` (webforms hook)
- [x] Create `pages/webforms/WebformListPage.tsx` (webform list)
- [x] Create `pages/webforms/WebformDetailPage.tsx` (webform detail view)
- [x] Create `pages/webforms/WebformFormPage.tsx` (create/edit webform)
- [ ] Create `pages/webforms/WebformBuilderPage.tsx` (drag-and-drop fields, styling)
- [x] Create embed code generator component (in WebformDetailPage)
- [x] Create `pages/portal/PortalDashboardPage.tsx` (customer portal dashboard)
- [x] Create `pages/portal/CustomerTrackingPage.tsx` (service request tracking)
- [x] Create `pages/portal/CustomerPaymentsPage.tsx` (payment history and make payment)
- [x] Create `pages/portal/CustomerHistoryPage.tsx` (service history)
- [x] Integrate webform and portal routes in `routes.tsx`

---

## Phase 18: Pricebook & Settings

### Server

#### PRICEBOOK/ Module
- [x] Create `PRICEBOOK/pricebook.entity.ts` (good/better/best tiers)
- [x] Create `PRICEBOOK/dto/pricebook.dto.ts`
- [x] Create `PRICEBOOK/pricebook.provider.ts`
- [x] Create `PRICEBOOK/pricebook.service.ts` (CRUD, tiered pricing)
- [x] Create `PRICEBOOK/pricebook.controller.ts`
- [x] Create `PRICEBOOK/pricebook.module.ts`
- [x] Register PRICEBOOK module in `app.module.ts`

#### SETTINGS/ Module
- [x] Create `SETTINGS/settings.entity.ts` (company branding, locale, currency, tax config)
- [x] Create `SETTINGS/dto/settings.dto.ts`
- [x] Create `SETTINGS/settings.provider.ts`
- [x] Create `SETTINGS/settings.service.ts` (company branding, locale, currency, tax config)
- [x] Create `SETTINGS/settings.controller.ts`
- [x] Create `SETTINGS/settings.module.ts`
- [x] Register SETTINGS module in `app.module.ts`

### Web

- [x] Create `api/pricebook.api.ts` (pricebook API calls)
- [x] Create `hooks/use-pricebook.ts` (pricebook hook)
- [x] Create `pages/pricebook/PricebookListPage.tsx` (tiered pricing management)
- [x] Create `pages/pricebook/PricebookFormPage.tsx` (create/edit pricebook item)
- [ ] Enhance `pages/settings/GeneralSettingsPage.tsx` (logo, branding, locale, currency, tax rates)
- [x] Create `api/settings.api.ts` (settings API calls)
- [x] Create `hooks/use-settings.ts` (settings hook)
- [x] Integrate pricebook routes in `routes.tsx`

### Mobile

- [x] Create pricebook presentation screen for customers on-site
- [x] Create tiered pricing comparison view
- [x] Implement pricebook offline caching

---

## Phase 19: Customization

### Server

#### CUSTOM_FIELDS/ Module
- [x] Create `CUSTOM_FIELDS/custom_fields.entity.ts` (15+ field types, per-module)
- [x] Create `CUSTOM_FIELDS/dto/custom_fields.dto.ts`
- [x] Create `CUSTOM_FIELDS/custom_fields.provider.ts`
- [x] Create `CUSTOM_FIELDS/custom_fields.service.ts` (CRUD per module, field type validation)
- [x] Create `CUSTOM_FIELDS/custom_fields.controller.ts`
- [x] Create `CUSTOM_FIELDS/custom_fields.module.ts`
- [x] Register CUSTOM_FIELDS module in `app.module.ts`

#### TEMPLATES/ Module
- [x] Create `TEMPLATES/templates.entity.ts` (invoice, estimate, email, report)
- [x] Create `TEMPLATES/dto/templates.dto.ts`
- [x] Create `TEMPLATES/templates.provider.ts`
- [x] Create `TEMPLATES/templates.service.ts` (CRUD, template rendering)
- [x] Create `TEMPLATES/templates.controller.ts`
- [x] Create `TEMPLATES/templates.module.ts`
- [x] Register TEMPLATES module in `app.module.ts`

#### WORKFLOW_RULES/ Module
- [x] Create `WORKFLOW_RULES/workflow_rules.entity.ts` (event-triggered automation)
- [x] Create `WORKFLOW_RULES/dto/workflow_rules.dto.ts`
- [x] Create `WORKFLOW_RULES/workflow_rules.provider.ts`
- [x] Create `WORKFLOW_RULES/workflow_rules.service.ts` (event-triggered automation engine)
- [x] Create `WORKFLOW_RULES/workflow_rules.controller.ts`
- [x] Create `WORKFLOW_RULES/workflow_rules.module.ts`
- [x] Register WORKFLOW_RULES module in `app.module.ts`

#### WEBHOOKS/ Module
- [x] Create `WEBHOOKS/webhooks.entity.ts` (outbound webhook subscriptions)
- [x] Create `WEBHOOKS/dto/webhooks.dto.ts`
- [x] Create `WEBHOOKS/webhooks.provider.ts`
- [x] Create `WEBHOOKS/webhooks.service.ts` (outbound webhook delivery)
- [x] Create `WEBHOOKS/webhooks.controller.ts`
- [x] Create `WEBHOOKS/webhooks.module.ts`
- [x] Register WEBHOOKS module in `app.module.ts`

### Web

- [x] Create `api/custom-fields.api.ts` (custom fields API calls)
- [x] Create `hooks/use-custom-fields.ts` (custom fields hook)
- [x] Create `pages/customization/CustomFieldListPage.tsx` (custom field manager)
- [x] Create `pages/customization/CustomFieldFormPage.tsx` (custom field form)
- [x] Create `api/templates.api.ts` (templates API calls)
- [x] Create `hooks/use-templates.ts` (templates hook)
- [x] Create `pages/customization/TemplateListPage.tsx` (template list)
- [x] Create `pages/customization/TemplateFormPage.tsx` (template form)
- [x] Create `pages/customization/TemplateBuilderPage.tsx` (visual template builder with variable insertion and live preview)
- [x] Create `api/workflow-rules.api.ts` (workflow rules API calls)
- [x] Create `hooks/use-workflow-rules.ts` (workflow rules hook)
- [x] Create `pages/customization/WorkflowRuleListPage.tsx` (workflow rule list)
- [x] Create `pages/customization/WorkflowRuleFormPage.tsx` (workflow rule form)
- [x] Create `api/webhooks.api.ts` (webhooks API calls)
- [x] Create `hooks/use-webhooks.ts` (webhooks hook)
- [x] Create `pages/customization/WebhookListPage.tsx` (webhook list)
- [x] Create `pages/customization/WebhookFormPage.tsx` (webhook form)
- [x] Integrate customization routes in `routes.tsx`

---

## Phase 20: Reports & Dashboards

### Server

#### REPORTS/ Module
- [x] Create `REPORTS/reports.entity.ts` (report definitions, saved reports)
- [x] Create `REPORTS/dto/reports.dto.ts`
- [x] Create `REPORTS/reports.service.ts` (40+ standard reports, custom queries, export PDF/CSV/Excel)
- [x] Create `REPORTS/reports.controller.ts`
- [x] Create `REPORTS/reports.module.ts`
- [x] Register REPORTS module in `app.module.ts`
- [x] Implement PDF export for reports (PDF service ready)
- [x] Implement CSV export for reports
- [x] Implement Excel export for reports

#### DASHBOARDS/ Module
- [x] Create `DASHBOARDS/dashboards.entity.ts` (user dashboards, widget config)
- [x] Create `DASHBOARDS/dto/dashboards.dto.ts`
- [x] Create `DASHBOARDS/dashboards.provider.ts`
- [x] Create `DASHBOARDS/dashboards.service.ts` (CRUD user dashboards, widget configuration)
- [x] Create `DASHBOARDS/dashboards.controller.ts`
- [x] Create `DASHBOARDS/dashboards.module.ts`
- [x] Register DASHBOARDS module in `app.module.ts`

### Web

- [x] Create `api/reports.api.ts` (reports API calls)
- [x] Create `hooks/use-reports.ts` (reports hook)
- [x] Enhance `pages/reports/ReportListPage.tsx` (report catalog with filters)
- [x] Create `pages/reports/ReportDetailPage.tsx` (report view with export)
- [x] Create `pages/reports/CustomReportBuilderPage.tsx` (custom report builder)
- [x] Create `api/dashboards.api.ts` (dashboards API calls)
- [x] Create `hooks/use-dashboards.ts` (dashboards hook)
- [x] Enhance `pages/dashboard/DashboardPage.tsx` (real data-driven widgets)
- [x] Create dashboard widget library (charts, KPIs, tables)
- [x] Implement export functionality (PDF/CSV/Excel download)
- [x] Integrate report routes in `routes.tsx`

### Mobile

- [x] Create key metrics dashboard screen (simplified)
- [x] Create report view screen (mobile-optimized)

### AI

- [ ] Implement NL query engine for natural language report queries
- [ ] Create NL query API endpoint integration
- [ ] Implement anomaly detection in KPIs
- [ ] Create anomaly detection API endpoint integration
- [ ] Implement AI narrative report generation
- [ ] Create AI report generation API endpoint integration
- [ ] Write tests for NL query engine
- [ ] Write tests for anomaly detection
- [ ] Write tests for AI report generation

---

## Phase 21: Reviews & Feedback

### Server

#### REVIEWS/ Module
- [x] Create `REVIEWS/reviews.entity.ts`
- [x] Create `REVIEWS/dto/reviews.dto.ts` (create/update DTOs)
- [x] Create `REVIEWS/reviews.provider.ts`
- [x] Create `REVIEWS/reviews.service.ts` (CRUD, auto-solicit post-service, Google/Yelp integration)
- [x] Create `REVIEWS/reviews.controller.ts`
- [x] Create `REVIEWS/reviews.module.ts`
- [x] Register REVIEWS module in `app.module.ts`
- [ ] Implement auto-solicit review email/SMS after service completion
- [ ] Implement Google review integration
- [ ] Implement Yelp review integration

### Web

- [x] Create `api/reviews.api.ts` (reviews API calls)
- [x] Create `hooks/use-reviews.ts` (reviews hook)
- [x] Create `pages/reviews/ReviewListPage.tsx` (review management list)
- [x] Create `pages/reviews/ReviewDetailPage.tsx` (review detail view)
- [x] Create `pages/reviews/ReviewFormPage.tsx` (review form)
- [ ] Create `pages/reviews/ReviewSettingsPage.tsx` (review solicitation settings)
- [x] Create customer satisfaction analytics component (charts/graphs)
- [x] Integrate review routes in `routes.tsx`

### Mobile

- [x] Create post-service review prompt screen (shown to customer)
- [x] Create review submission screen
- [x] Create review confirmation screen

---

## Phase 22: Audit Logs & Security

### Server

#### AUDIT_LOGS/ Module
- [x] Create `AUDIT_LOGS/audit_logs.entity.ts`
- [x] Create `AUDIT_LOGS/dto/audit_logs.dto.ts` (search/filter DTOs)
- [x] Create `AUDIT_LOGS/audit_logs.provider.ts`
- [x] Create `AUDIT_LOGS/audit_logs.service.ts` (search, filter, export)
- [x] Create `AUDIT_LOGS/audit_logs.controller.ts`
- [x] Create `AUDIT_LOGS/audit_logs.module.ts`
- [x] Register AUDIT_LOGS module in `app.module.ts`

#### Audit Interceptor
- [x] Create automatic audit logging interceptor (`shared/interceptors/audit.interceptor.ts`)
- [x] Register audit interceptor globally

#### MFA Support
- [x] Implement authenticator app MFA (TOTP)
- [x] Implement SMS-based MFA
- [x] Implement hardware key MFA (WebAuthn/FIDO2)

#### IP Whitelisting
- [x] Implement IP whitelisting guard
- [x] Create IP whitelist management endpoints

### Web

- [x] Create `api/audit-logs.api.ts` (audit logs API calls)
- [x] Create `hooks/use-audit-logs.ts` (audit logs hook)
- [x] Create `pages/security/AuditLogListPage.tsx` (search and filters)
- [x] Create `pages/security/SecuritySettingsPage.tsx` (MFA, password policy, IP restrictions)
- [x] Implement MFA setup wizard component
- [x] Implement IP whitelist management component
- [x] Integrate security routes in `routes.tsx`

---

## Phase 23: AI - Smart Scheduling & Route Optimization

### AI

- [x] Implement OR-Tools VRP solver with time windows
- [x] Implement OR-Tools VRP solver with skills constraints
- [x] Implement OR-Tools VRP solver with territory constraints
- [x] Implement real-time route optimization with traffic data integration
- [x] Implement demand forecasting model (Prophet)
- [x] Implement schedule optimization recommendation engine
- [x] Create VRP solver API endpoints with full constraints
- [x] Create demand forecasting API endpoints
- [x] Create schedule optimization API endpoints
- [x] Write comprehensive tests for VRP solver
- [x] Write tests for demand forecasting model
- [x] Write tests for schedule optimization

### Server

- [x] Enhance SCHEDULING/ module with AI integration endpoint: get optimized schedule
- [x] Enhance SCHEDULING/ module with AI integration endpoint: get route optimization
- [x] Enhance SCHEDULING/ module with AI integration endpoint: get demand forecast
- [x] Create scheduler for periodic AI optimization runs

### Web

- [x] Create AI scheduling suggestions panel on dispatch board
- [x] Implement "Optimize" button for auto-scheduling (calls AI endpoint)
- [x] Create demand forecast visualization component (charts)
- [x] Create AI recommendation acceptance/rejection UI
- [x] Integrate AI scheduling features into existing scheduling pages

---

## Phase 24: AI - Predictive Maintenance & IoT

### AI

- [x] Implement LSTM model for equipment failure prediction
- [x] Implement Prophet model for equipment failure prediction
- [x] Implement equipment health scoring algorithm (advanced)
- [x] Implement IoT data ingestion pipeline
- [x] Implement automated WO creation on predicted failures
- [x] Create prediction API endpoints
- [x] Create health scoring API endpoints
- [x] Create IoT data ingestion API endpoints
- [x] Write tests for LSTM failure prediction
- [x] Write tests for Prophet failure prediction
- [x] Write tests for health scoring algorithm
- [x] Write tests for IoT data pipeline

### Server

- [x] Create IoT webhook receiver endpoints (accept sensor data)
- [x] Create IoT data storage and processing service
- [x] Implement health score calculation scheduler (cron job)
- [x] Implement automated WO creation trigger on failure prediction
- [x] Register IoT endpoints in app.module.ts

### Web

- [x] Create `pages/maintenance/EquipmentHealthDashboardPage.tsx`
- [x] Create predictive maintenance alerts component
- [x] Create IoT sensor data visualization component (real-time charts)
- [x] Create equipment health score display component
- [x] Create predicted failure timeline component
- [x] Integrate predictive maintenance routes in `routes.tsx`

---

## Phase 25: AI - Chatbot, Document AI & Analytics

### AI

- [x] Implement RAG-powered chatbot with LangChain + Qdrant
- [x] Implement chatbot context management and memory
- [x] Implement chatbot knowledge base ingestion pipeline
- [x] Implement PaddleOCR for invoice parsing
- [x] Implement PaddleOCR for document parsing (general)
- [x] Implement LLM report generation engine
- [x] Implement NL-to-SQL analytics engine
- [x] Implement sentiment analysis on customer communications
- [x] Create chatbot API endpoints
- [x] Create document parsing API endpoints
- [x] Create NL-to-SQL API endpoints
- [x] Create sentiment analysis API endpoints
- [x] Write tests for RAG chatbot
- [x] Write tests for document parsing (OCR)
- [x] Write tests for NL-to-SQL engine
- [x] Write tests for sentiment analysis

### Server

- [x] Create chatbot session management endpoints (create, list, get history)
- [x] Create chatbot session entity and service
- [x] Create document upload and parse endpoints
- [x] Create document entity for storing parsed results
- [x] Register chatbot and document endpoints in app.module.ts

### Web

- [x] Create chatbot widget component (floating, expandable)
- [x] Create chatbot for customer portal (public-facing)
- [x] Create chatbot for internal use (employee-facing)
- [x] Create document upload page with AI extraction preview
- [x] Create parsed document review and correction UI
- [x] Create NL analytics query bar component
- [x] Create NL query results display component
- [x] Integrate chatbot and document routes in `routes.tsx`

---

## Phase 26: AI - Computer Vision & Voice

### AI

- [x] Implement YOLOv8 work verification model (training pipeline)
- [x] Implement YOLOv8 work verification inference service
- [x] Implement equipment identification model (training pipeline)
- [x] Implement equipment identification inference service
- [x] Implement Whisper voice-to-text transcription service
- [x] Implement before/after comparison AI model
- [x] Create work verification API endpoints
- [x] Create equipment identification API endpoints
- [x] Create voice transcription API endpoints
- [x] Create before/after comparison API endpoints
- [x] Write tests for YOLOv8 work verification
- [x] Write tests for equipment identification
- [x] Write tests for Whisper voice transcription
- [x] Write tests for before/after comparison

### Mobile

- [x] Create camera-based work verification screen
- [x] Implement photo capture for before/after comparison
- [x] Create voice notes recording screen
- [x] Implement auto-transcription display for voice notes
- [x] Implement barcode scanning screen
- [x] Implement QR code scanning screen
- [x] Create verification result display screen 

### Web

- [x] Create vision verification dashboard page
- [x] Create work verification review screen (approve/reject AI results)
- [x] Create before/after comparison viewer component
- [x] Create voice note playback component with transcription display
- [x] Create voice note list view
- [x] Integrate vision and voice routes in `routes.tsx`

---

## Notes

- **Server modules** follow the pattern: entity -> DTOs -> provider -> service -> controller -> module -> register in app.module.ts
- **Web pages** follow the pattern: API file -> hook file -> list page -> detail page -> form page -> integrate routes
- **Mobile screens** are individual tasks per screen file
- **AI models** follow the pattern: model class implementation -> API endpoint integration -> testing
- Dependencies between phases should be respected (e.g., Phase 9 Work Orders depends on Phase 7 Service Requests)
- All server modules use Sequelize with PostgreSQL
- All web state management uses Zustand + TanStack Query
- All mobile offline data uses WatermelonDB
- AI services communicate with the server via REST APIs
