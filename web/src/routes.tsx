import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, useLocation, type RouteObject } from 'react-router-dom';

import { useAuthStore } from '@/store/auth.store';
import { useMe } from '@/hooks/use-auth';
import AppLayout from '@/components/layout/AppLayout';

// Lazy-loaded pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const VerifyMagicLinkPage = lazy(() => import('@/pages/auth/VerifyMagicLinkPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const LiveMapDashboard = lazy(() => import('@/pages/dashboard/LiveMapDashboard'));
const DashboardBuilderPage = lazy(() => import('@/pages/dashboard/DashboardBuilderPage'));
const UserListPage = lazy(() => import('@/pages/users/UserListPage'));
const UserDetailPage = lazy(() => import('@/pages/users/UserDetailPage'));
const UserFormPage = lazy(() => import('@/pages/users/UserFormPage'));
const GeneralSettingsPage = lazy(() => import('@/pages/settings/GeneralSettingsPage'));
const RolesPermissionsPage = lazy(() => import('@/pages/settings/RolesPermissionsPage'));
const ContactListPage = lazy(() => import('@/pages/contacts/ContactListPage'));
const ContactDetailPage = lazy(() => import('@/pages/contacts/ContactDetailPage'));
const ContactFormPage = lazy(() => import('@/pages/contacts/ContactFormPage'));
const CompanyListPage = lazy(() => import('@/pages/companies/CompanyListPage'));
const CompanyDetailPage = lazy(() => import('@/pages/companies/CompanyDetailPage'));
const CompanyFormPage = lazy(() => import('@/pages/companies/CompanyFormPage'));
const ServiceLocationListPage = lazy(() => import('@/pages/service-locations/ServiceLocationListPage'));
const ServiceLocationDetailPage = lazy(() => import('@/pages/service-locations/ServiceLocationDetailPage'));
const ServiceLocationFormPage = lazy(() => import('@/pages/service-locations/ServiceLocationFormPage'));
const AssetListPage = lazy(() => import('@/pages/assets/AssetListPage'));
const AssetDetailPage = lazy(() => import('@/pages/assets/AssetDetailPage'));
const AssetFormPage = lazy(() => import('@/pages/assets/AssetFormPage'));
const MaintenancePlanListPage = lazy(() => import('@/pages/maintenance-plans/MaintenancePlanListPage'));
const MaintenancePlanDetailPage = lazy(() => import('@/pages/maintenance-plans/MaintenancePlanDetailPage'));
const MaintenancePlanFormPage = lazy(() => import('@/pages/maintenance-plans/MaintenancePlanFormPage'));
const ServicesCatalogPage = lazy(() => import('@/pages/catalog/ServicesCatalogPage'));
const ServiceFormPage = lazy(() => import('@/pages/catalog/ServiceFormPage'));
const PartsCatalogPage = lazy(() => import('@/pages/catalog/PartsCatalogPage'));
const PartFormPage = lazy(() => import('@/pages/catalog/PartFormPage'));
const RequestListPage = lazy(() => import('@/pages/service-requests/RequestListPage'));
const RequestDetailPage = lazy(() => import('@/pages/service-requests/RequestDetailPage'));
const RequestFormPage = lazy(() => import('@/pages/service-requests/RequestFormPage'));
const EstimateListPage = lazy(() => import('@/pages/estimates/EstimateListPage'));
const EstimateDetailPage = lazy(() => import('@/pages/estimates/EstimateDetailPage'));
const EstimateBuilderPage = lazy(() => import('@/pages/estimates/EstimateBuilderPage'));
const WorkOrderListPage = lazy(() => import('@/pages/work-orders/WorkOrderListPage'));
const WorkOrderDetailPage = lazy(() => import('@/pages/work-orders/WorkOrderDetailPage'));
const WorkOrderFormPage = lazy(() => import('@/pages/work-orders/WorkOrderFormPage'));
const DispatchBoardPage = lazy(() => import('@/pages/scheduling/DispatchBoardPage'));
const AppointmentFormPage = lazy(() => import('@/pages/scheduling/AppointmentFormPage'));
const AppointmentDetailPage = lazy(() => import('@/pages/scheduling/AppointmentDetailPage'));
const JobSheetTemplateListPage = lazy(() => import('@/pages/job-sheets/JobSheetTemplateListPage'));
const JobSheetBuilderPage = lazy(() => import('@/pages/job-sheets/JobSheetBuilderPage'));
const JobSheetDashboardPage = lazy(() => import('@/pages/job-sheets/JobSheetDashboardPage'));
const JobSheetListPage = lazy(() => import('@/pages/job-sheets/JobSheetListPage'));
const JobSheetFormPage = lazy(() => import('@/pages/job-sheets/JobSheetFormPage'));
const JobSheetDetailPage = lazy(() => import('@/pages/job-sheets/JobSheetDetailPage'));
const TimesheetListPage = lazy(() => import('@/pages/timesheets/TimesheetListPage'));
const TimesheetDetailPage = lazy(() => import('@/pages/timesheets/TimesheetDetailPage'));
const TripHistoryPage = lazy(() => import('@/pages/trips/TripHistoryPage'));
const LiveAgentTrackingPage = lazy(() => import('@/pages/tracking/LiveAgentTrackingPage'));
const InvoiceListPage = lazy(() => import('@/pages/invoices/InvoiceListPage'));
const InvoiceDetailPage = lazy(() => import('@/pages/invoices/InvoiceDetailPage'));
const InvoiceFormPage = lazy(() => import('@/pages/invoices/InvoiceFormPage'));
const ServiceReportViewer = lazy(() => import('@/pages/service-reports/ServiceReportViewer'));
const PaymentListPage = lazy(() => import('@/pages/payments/PaymentListPage'));
const PaymentDetailPage = lazy(() => import('@/pages/payments/PaymentDetailPage'));
const PaymentFormPage = lazy(() => import('@/pages/payments/PaymentFormPage'));
const PaymentGatewaySettingsPage = lazy(() => import('@/pages/settings/PaymentGatewaySettingsPage'));
const CustomerPaymentSettingsPage = lazy(() => import('@/pages/settings/CustomerPaymentSettingsPage'));
const EmailSmsTemplateManagementPage = lazy(() => import('@/pages/settings/EmailSmsTemplateManagementPage'));
const NotificationPreferencesPage = lazy(() => import('@/pages/settings/NotificationPreferencesPage'));
const SecuritySettingsPage = lazy(() => import('@/pages/security/SecuritySettingsPage'));
const CustomReportBuilderPage = lazy(() => import('@/pages/reports/CustomReportBuilderPage'));
const AgreementListPage = lazy(() => import('@/pages/agreements/AgreementListPage'));
const AgreementDetailPage = lazy(() => import('@/pages/agreements/AgreementDetailPage'));
const AgreementFormPage = lazy(() => import('@/pages/agreements/AgreementFormPage'));
const BlueprintListPage = lazy(() => import('@/pages/blueprints/BlueprintListPage'));
const BlueprintEditorPage = lazy(() => import('@/pages/blueprints/BlueprintEditorPage'));
const CommunicationListPage = lazy(() => import('@/pages/communications/CommunicationListPage'));
const PricebookListPage = lazy(() => import('@/pages/pricebook/PricebookListPage'));
const CustomFieldListPage = lazy(() => import('@/pages/customization/CustomFieldListPage'));
const TemplateListPage = lazy(() => import('@/pages/customization/TemplateListPage'));
const WorkflowRuleListPage = lazy(() => import('@/pages/customization/WorkflowRuleListPage'));
const WebhookListPage = lazy(() => import('@/pages/customization/WebhookListPage'));
const ReviewListPage = lazy(() => import('@/pages/reviews/ReviewListPage'));
const ReviewDetailPage = lazy(() => import('@/pages/reviews/ReviewDetailPage'));
const ReviewFormPage = lazy(() => import('@/pages/reviews/ReviewFormPage'));
const CommunicationDetailPage = lazy(() => import('@/pages/communications/CommunicationDetailPage'));
const PricebookFormPage = lazy(() => import('@/pages/pricebook/PricebookFormPage'));
const CustomFieldFormPage = lazy(() => import('@/pages/customization/CustomFieldFormPage'));
const TemplateBuilderPage = lazy(() => import('@/pages/customization/TemplateBuilderPage'));
const WorkflowRuleFormPage = lazy(() => import('@/pages/customization/WorkflowRuleFormPage'));
const WebhookFormPage = lazy(() => import('@/pages/customization/WebhookFormPage'));
const AuditLogListPage = lazy(() => import('@/pages/security/AuditLogListPage'));
const MobileUsageLogs = lazy(() => import('@/pages/admin/MobileUsageLogs'));
const ReportListPage = lazy(() => import('@/pages/reports/ReportListPage'));
const ReportDetailPage = lazy(() => import('@/pages/reports/ReportDetailPage'));
const AgentListPage = lazy(() => import('@/pages/workforce/AgentListPage'));
const CalendarViewPage = lazy(() => import('@/pages/scheduling/CalendarViewPage'));
const MapViewPage = lazy(() => import('@/pages/scheduling/MapViewPage'));
const SLAComplianceDashboard = lazy(() => import('@/pages/agreements/SLAComplianceDashboard'));
const EquipmentHealthDashboardPage = lazy(() => import('@/pages/maintenance/EquipmentHealthDashboardPage'));
const DocumentUploadPage = lazy(() => import('@/pages/documents/DocumentUploadPage'));
const NLAnalyticsPage = lazy(() => import('@/pages/analytics/NLAnalyticsPage'));
const VisionDashboardPage = lazy(() => import('@/pages/vision/VisionDashboardPage'));
const VoiceNotesPage = lazy(() => import('@/pages/voice/VoiceNotesPage'));
const WorkflowTemplateListPage = lazy(() => import('@/pages/workflow/WorkflowTemplateListPage'));
const WorkflowTemplateFormPage = lazy(() => import('@/pages/workflow/WorkflowTemplateFormPage'));
const WorkflowTemplateDetailPage = lazy(() => import('@/pages/workflow/WorkflowTemplateDetailPage'));
const DocumentApprovalListPage = lazy(() => import('@/pages/workflow/DocumentApprovalListPage'));
const ApprovalDashboardPage = lazy(() => import('@/pages/workflow/ApprovalDashboardPage'));
const EstimatePublicSignPage = lazy(() => import('@/pages/estimates/EstimatePublicSignPage'));
const EstimateApprovalPage = lazy(() => import('@/pages/estimates/EstimateApprovalPage'));
const SignupFromMagicLinkPage = lazy(() => import('@/pages/auth/SignupFromMagicLinkPage'));
const InvoicePortalPage = lazy(() => import('@/pages/invoices/InvoicePortalPage'));
const SubscriptionMagicLinksPage = lazy(() => import('@/pages/super-admin/SubscriptionMagicLinksPage'));
const DashboardRouter = lazy(() => import('@/pages/dashboard/DashboardRouter'));
const ApiKeysPage = lazy(() => import('@/pages/integrations/ApiKeysPage'));
const IntegrationGuidePage = lazy(() => import('@/pages/integrations/IntegrationGuidePage'));
const LandingPage = lazy(() => import('@/pages/landing/LandingPage'));
const SuperAdminDashboardPage = lazy(() => import('@/pages/super-admin/SuperAdminDashboardPage'));
const TenantDetailPage = lazy(() => import('@/pages/super-admin/TenantDetailPage'));
const PricingPlansPage = lazy(() => import('@/pages/super-admin/PricingPlansPage'));

const SuperAdminProfilePage = lazy(() => import('@/pages/super-admin/SuperAdminProfilePage'));
const AuditLogsPage = lazy(() => import('@/pages/super-admin/AuditLogsPage'));
const SuperAdminApiKeysPage = lazy(() => import('@/pages/super-admin/ApiKeysPage'));
const AnalyticsDashboardPage = lazy(() => import('@/pages/super-admin/AnalyticsDashboardPage'));
const SystemHealthPage = lazy(() => import('@/pages/super-admin/SystemHealthPage'));
const MagicLinkVerifyPage = lazy(() => import('@/pages/auth/MagicLinkVerifyPage'));
const OnboardingSetupPage = lazy(() => import('@/pages/onboarding/OnboardingSetupPage'));
const UserOnboardingPage = lazy(() => import('@/pages/onboarding/UserOnboardingPage'));
const MyJobsPage = lazy(() => import('@/pages/technician/MyJobsPage'));
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage'));
const WhatsAppChannelSettingsPage = lazy(() => import('@/pages/settings/WhatsAppChannelSettingsPage'));
const SlaConfigPage = lazy(() => import('@/pages/slas/SlaConfigPage'));
const EmailChannelSettingsPage = lazy(() => import('@/pages/settings/EmailChannelSettingsPage'));
const TerritoriesListPage = lazy(() => import('@/pages/territories/TerritoriesList'));

function SuspenseWrapper({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

function PrivateRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isError, isFetching } = useMe();

  // If not authenticated at all, redirect immediately
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If confirmed error and done fetching (session expired / invalid), redirect
  if (isError && !isFetching) {
    return <Navigate to="/login" replace />;
  }

  // Render immediately if authenticated (from persisted store).
  // useMe() runs in background to validate the session.
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function OpenRoute({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function SuperAdminRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.is_super_admin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function TechnicianGuard({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  const roles: unknown[] = Array.isArray(user?.roles) ? (user.roles as unknown[]) : [];
  const isTechnician =
    !user?.is_super_admin &&
    roles.some((r) => (typeof r === 'string' ? r : (r as { name?: string })?.name) === 'Technician');

  if (!isTechnician) return <>{children}</>;

  const path = location.pathname;
  const allowed =
    path === '/dashboard' ||
    path === '/work-orders/my-jobs' ||
    path.startsWith('/work-orders/') ||
    path === '/scheduling/calendar' ||
    path === '/timesheets' ||
    path.startsWith('/timesheets/') ||
    path === '/notifications' ||
    path === '/profile' ||
    path.startsWith('/profile/');

  if (!allowed) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/landing" replace />,
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <SuspenseWrapper>
          <LoginPage />
        </SuspenseWrapper>
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <SuspenseWrapper>
          <RegisterPage />
        </SuspenseWrapper>
      </PublicRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <PublicRoute>
        <SuspenseWrapper>
          <ForgotPasswordPage />
        </SuspenseWrapper>
      </PublicRoute>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <PublicRoute>
        <SuspenseWrapper>
          <ResetPasswordPage />
        </SuspenseWrapper>
      </PublicRoute>
    ),
  },
  {
    path: '/auth/verify',
    element: (
      <PublicRoute>
        <SuspenseWrapper>
          <VerifyMagicLinkPage />
        </SuspenseWrapper>
      </PublicRoute>
    ),
  },
  {
    element: (
      <PrivateRoute>
        <TechnicianGuard>
          <AppLayout />
        </TechnicianGuard>
      </PrivateRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: (
          <SuspenseWrapper>
            <DashboardRouter />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'dashboard/live-map',
        element: (
          <SuspenseWrapper>
            <LiveMapDashboard />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'dashboard/builder',
        element: (
          <SuspenseWrapper>
            <DashboardBuilderPage />
          </SuspenseWrapper>
        ),
      },
      // Users
      {
        path: 'users',
        element: (
          <SuspenseWrapper>
            <UserListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'users/create',
        element: (
          <SuspenseWrapper>
            <UserFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'users/:id',
        element: (
          <SuspenseWrapper>
            <UserDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'users/:id/edit',
        element: (
          <SuspenseWrapper>
            <UserFormPage />
          </SuspenseWrapper>
        ),
      },
      // Contacts
      {
        path: 'contacts',
        element: (
          <SuspenseWrapper>
            <ContactListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'contacts/new',
        element: (
          <SuspenseWrapper>
            <ContactFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'contacts/:id',
        element: (
          <SuspenseWrapper>
            <ContactDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'contacts/:id/edit',
        element: (
          <SuspenseWrapper>
            <ContactFormPage />
          </SuspenseWrapper>
        ),
      },
      // Companies
      {
        path: 'companies',
        element: (
          <SuspenseWrapper>
            <CompanyListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'companies/new',
        element: (
          <SuspenseWrapper>
            <CompanyFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'companies/:id',
        element: (
          <SuspenseWrapper>
            <CompanyDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'companies/:id/edit',
        element: (
          <SuspenseWrapper>
            <CompanyFormPage />
          </SuspenseWrapper>
        ),
      },
      // Service Locations
      {
        path: 'service-locations',
        element: (
          <SuspenseWrapper>
            <ServiceLocationListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'service-locations/new',
        element: (
          <SuspenseWrapper>
            <ServiceLocationFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'service-locations/:id',
        element: (
          <SuspenseWrapper>
            <ServiceLocationDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'service-locations/:id/edit',
        element: (
          <SuspenseWrapper>
            <ServiceLocationFormPage />
          </SuspenseWrapper>
        ),
      },
      // Assets
      {
        path: 'assets',
        element: (
          <SuspenseWrapper>
            <AssetListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'assets/new',
        element: (
          <SuspenseWrapper>
            <AssetFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'assets/:id',
        element: (
          <SuspenseWrapper>
            <AssetDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'assets/:id/edit',
        element: (
          <SuspenseWrapper>
            <AssetFormPage />
          </SuspenseWrapper>
        ),
      },
      // Maintenance Plans
      {
        path: 'maintenance-plans',
        element: (
          <SuspenseWrapper>
            <MaintenancePlanListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'maintenance-plans/new',
        element: (
          <SuspenseWrapper>
            <MaintenancePlanFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'maintenance-plans/:id',
        element: (
          <SuspenseWrapper>
            <MaintenancePlanDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'maintenance-plans/:id/edit',
        element: (
          <SuspenseWrapper>
            <MaintenancePlanFormPage />
          </SuspenseWrapper>
        ),
      },
      // Services Catalog
      {
        path: 'catalog/services',
        element: (
          <SuspenseWrapper>
            <ServicesCatalogPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'catalog/services/new',
        element: (
          <SuspenseWrapper>
            <ServiceFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'catalog/services/:id/edit',
        element: (
          <SuspenseWrapper>
            <ServiceFormPage />
          </SuspenseWrapper>
        ),
      },
      // Parts Catalog
      {
        path: 'catalog/parts',
        element: (
          <SuspenseWrapper>
            <PartsCatalogPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'catalog/parts/new',
        element: (
          <SuspenseWrapper>
            <PartFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'catalog/parts/:id/edit',
        element: (
          <SuspenseWrapper>
            <PartFormPage />
          </SuspenseWrapper>
        ),
      },
      // Service Requests
      {
        path: 'service-requests',
        element: (
          <SuspenseWrapper>
            <RequestListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'service-requests/new',
        element: (
          <SuspenseWrapper>
            <RequestFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'service-requests/:id',
        element: (
          <SuspenseWrapper>
            <RequestDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'service-requests/:id/edit',
        element: (
          <SuspenseWrapper>
            <RequestFormPage />
          </SuspenseWrapper>
        ),
      },
      // SLAs
      {
        path: 'slas',
        element: (
          <SuspenseWrapper>
            <SlaConfigPage />
          </SuspenseWrapper>
        ),
      },
      // Estimates
      {
        path: 'estimates',
        element: (
          <SuspenseWrapper>
            <EstimateListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'estimates/new',
        element: (
          <SuspenseWrapper>
            <EstimateBuilderPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'estimates/new/builder',
        element: (
          <SuspenseWrapper>
            <EstimateBuilderPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'estimates/:id',
        element: (
          <SuspenseWrapper>
            <EstimateDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'estimates/:id/edit',
        element: (
          <SuspenseWrapper>
            <EstimateBuilderPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'estimates/:id/builder',
        element: (
          <SuspenseWrapper>
            <EstimateBuilderPage />
          </SuspenseWrapper>
        ),
      },
      // Work Orders
      {
        path: 'work-orders',
        element: (
          <SuspenseWrapper>
            <WorkOrderListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'work-orders/new',
        element: (
          <SuspenseWrapper>
            <WorkOrderFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'work-orders/my-jobs',
        element: (
          <SuspenseWrapper>
            <MyJobsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'work-orders/:id',
        element: (
          <SuspenseWrapper>
            <WorkOrderDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'work-orders/:id/edit',
        element: (
          <SuspenseWrapper>
            <WorkOrderFormPage />
          </SuspenseWrapper>
        ),
      },
      // Scheduling
      {
        path: 'scheduling',
        element: (
          <SuspenseWrapper>
            <DispatchBoardPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'scheduling/new',
        element: (
          <SuspenseWrapper>
            <AppointmentFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'scheduling/:id',
        element: (
          <SuspenseWrapper>
            <AppointmentDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'scheduling/:id/edit',
        element: (
          <SuspenseWrapper>
            <AppointmentFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'scheduling/calendar',
        element: (
          <SuspenseWrapper>
            <CalendarViewPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'scheduling/map',
        element: (
          <SuspenseWrapper>
            <MapViewPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'scheduling/territories',
        element: (
          <SuspenseWrapper>
            <TerritoriesListPage />
          </SuspenseWrapper>
        ),
      },
      // Predictive Maintenance
      {
        path: 'maintenance/health-dashboard',
        element: (
          <SuspenseWrapper>
            <EquipmentHealthDashboardPage />
          </SuspenseWrapper>
        ),
      },
      // Service Reports
      {
        path: 'service-reports/:id/viewer',
        element: (
          <SuspenseWrapper>
            <ServiceReportViewer />
          </SuspenseWrapper>
        ),
      },
      // Document AI
      {
        path: 'documents/ai',
        element: (
          <SuspenseWrapper>
            <DocumentUploadPage />
          </SuspenseWrapper>
        ),
      },
      // AI Analytics
      {
        path: 'analytics/ai',
        element: (
          <SuspenseWrapper>
            <NLAnalyticsPage />
          </SuspenseWrapper>
        ),
      },
      // Vision AI
      {
        path: 'vision',
        element: (
          <SuspenseWrapper>
            <VisionDashboardPage />
          </SuspenseWrapper>
        ),
      },
      // Voice Notes
      {
        path: 'voice-notes',
        element: (
          <SuspenseWrapper>
            <VoiceNotesPage />
          </SuspenseWrapper>
        ),
      },
      // Job Sheets
      {
        path: 'job-sheets',
        element: (
          <SuspenseWrapper>
            <JobSheetListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'job-sheets/:id/edit',
        element: (
          <SuspenseWrapper>
            <JobSheetFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'job-sheets/:id',
        element: (
          <SuspenseWrapper>
            <JobSheetDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'job-sheets/templates',
        element: (
          <SuspenseWrapper>
            <JobSheetTemplateListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'job-sheets/templates/new',
        element: (
          <SuspenseWrapper>
            <JobSheetBuilderPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'job-sheets/templates/:id/edit',
        element: (
          <SuspenseWrapper>
            <JobSheetBuilderPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'job-sheets/dashboard',
        element: (
          <SuspenseWrapper>
            <JobSheetDashboardPage />
          </SuspenseWrapper>
        ),
      },
      // Timesheets
      {
        path: 'timesheets',
        element: (
          <SuspenseWrapper>
            <TimesheetListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'timesheets/:id',
        element: (
          <SuspenseWrapper>
            <TimesheetDetailPage />
          </SuspenseWrapper>
        ),
      },
      // Notifications
      {
        path: 'notifications',
        element: (
          <SuspenseWrapper>
            <NotificationsPage />
          </SuspenseWrapper>
        ),
      },
      // Trips
      {
        path: 'trips/history',
        element: (
          <SuspenseWrapper>
            <TripHistoryPage />
          </SuspenseWrapper>
        ),
      },
      // Agent Tracking
      {
        path: 'tracking/live',
        element: (
          <SuspenseWrapper>
            <LiveAgentTrackingPage />
          </SuspenseWrapper>
        ),
      },
      // Invoices
      {
        path: 'invoices',
        element: (
          <SuspenseWrapper>
            <InvoiceListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'invoices/new',
        element: (
          <SuspenseWrapper>
            <InvoiceFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'invoices/:id',
        element: (
          <SuspenseWrapper>
            <InvoiceDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'invoices/:id/edit',
        element: (
          <SuspenseWrapper>
            <InvoiceFormPage />
          </SuspenseWrapper>
        ),
      },
      // Payments
      {
        path: 'payments',
        element: (
          <SuspenseWrapper>
            <PaymentListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'payments/new',
        element: (
          <SuspenseWrapper>
            <PaymentFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'payments/:id',
        element: (
          <SuspenseWrapper>
            <PaymentDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'payments/:id/edit',
        element: (
          <SuspenseWrapper>
            <PaymentFormPage />
          </SuspenseWrapper>
        ),
      },
      // Service Agreements
      {
        path: 'agreements',
        element: (
          <SuspenseWrapper>
            <AgreementListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'agreements/new',
        element: (
          <SuspenseWrapper>
            <AgreementFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'agreements/:id',
        element: (
          <SuspenseWrapper>
            <AgreementDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'agreements/:id/edit',
        element: (
          <SuspenseWrapper>
            <AgreementFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'agreements/sla-compliance',
        element: (
          <SuspenseWrapper>
            <SLAComplianceDashboard />
          </SuspenseWrapper>
        ),
      },
      // Blueprints
      {
        path: 'blueprints',
        element: (
          <SuspenseWrapper>
            <BlueprintListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'blueprints/:id',
        element: (
          <SuspenseWrapper>
            <BlueprintEditorPage />
          </SuspenseWrapper>
        ),
      },
      // Communications
      {
        path: 'communications',
        element: (
          <SuspenseWrapper>
            <CommunicationListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'communications/:id',
        element: (
          <SuspenseWrapper>
            <CommunicationDetailPage />
          </SuspenseWrapper>
        ),
      },
      // Super Admin
      {
        path: 'admin/tenants',
        element: (
          <SuperAdminRoute>
            <SuspenseWrapper>
              <SuperAdminDashboardPage />
            </SuspenseWrapper>
          </SuperAdminRoute>
        ),
      },
      {
        path: 'admin/tenants/:id',
        element: (
          <SuperAdminRoute>
            <SuspenseWrapper>
              <TenantDetailPage />
            </SuspenseWrapper>
          </SuperAdminRoute>
        ),
      },
      {
        path: 'admin/pricing',
        element: (
          <SuperAdminRoute>
            <SuspenseWrapper>
              <PricingPlansPage />
            </SuspenseWrapper>
          </SuperAdminRoute>
        ),
      },

      {
        path: 'admin/platform-health',
        element: (
          <SuperAdminRoute>
            <SuspenseWrapper>
              <SystemHealthPage />
            </SuspenseWrapper>
          </SuperAdminRoute>
        ),
      },
      {
        path: 'admin/audit-logs',
        element: (
          <SuperAdminRoute>
            <SuspenseWrapper>
              <AuditLogsPage />
            </SuspenseWrapper>
          </SuperAdminRoute>
        ),
      },
      {
        path: 'admin/api-keys',
        element: (
          <SuperAdminRoute>
            <SuspenseWrapper>
              <SuperAdminApiKeysPage />
            </SuspenseWrapper>
          </SuperAdminRoute>
        ),
      },
      {
        path: 'admin/analytics',
        element: (
          <SuperAdminRoute>
            <SuspenseWrapper>
              <AnalyticsDashboardPage />
            </SuspenseWrapper>
          </SuperAdminRoute>
        ),
      },
      {
        path: 'admin/profile',
        element: (
          <SuperAdminRoute>
            <SuspenseWrapper>
              <SuperAdminProfilePage />
            </SuspenseWrapper>
          </SuperAdminRoute>
        ),
      },
      {
        path: 'admin/magic-links',
        element: (
          <SuperAdminRoute>
            <SuspenseWrapper>
              <SubscriptionMagicLinksPage />
            </SuspenseWrapper>
          </SuperAdminRoute>
        ),
      },
      // API Key Management (Company Admin)
      {
        path: 'integrations/api-keys',
        element: (
          <SuspenseWrapper>
            <ApiKeysPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'integrations/guide',
        element: (
          <SuspenseWrapper>
            <IntegrationGuidePage />
          </SuspenseWrapper>
        ),
      },
      // Pricebook
      {
        path: 'pricebook',
        element: (
          <SuspenseWrapper>
            <PricebookListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'pricebook/new',
        element: (
          <SuspenseWrapper>
            <PricebookFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'pricebook/:id/edit',
        element: (
          <SuspenseWrapper>
            <PricebookFormPage />
          </SuspenseWrapper>
        ),
      },
      // Customization - Custom Fields
      {
        path: 'customization/custom-fields',
        element: (
          <SuspenseWrapper>
            <CustomFieldListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'customization/custom-fields/new',
        element: (
          <SuspenseWrapper>
            <CustomFieldFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'customization/custom-fields/:id/edit',
        element: (
          <SuspenseWrapper>
            <CustomFieldFormPage />
          </SuspenseWrapper>
        ),
      },
      // Customization - Templates
      {
        path: 'customization/templates',
        element: (
          <SuspenseWrapper>
            <TemplateListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'customization/templates/new',
        element: (
          <SuspenseWrapper>
            <TemplateBuilderPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'customization/templates/:id/edit',
        element: (
          <SuspenseWrapper>
            <TemplateBuilderPage />
          </SuspenseWrapper>
        ),
      },
      // Customization - Workflow Rules
      {
        path: 'customization/workflow-rules',
        element: (
          <SuspenseWrapper>
            <WorkflowRuleListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'customization/workflow-rules/new',
        element: (
          <SuspenseWrapper>
            <WorkflowRuleFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'customization/workflow-rules/:id/edit',
        element: (
          <SuspenseWrapper>
            <WorkflowRuleFormPage />
          </SuspenseWrapper>
        ),
      },
      // Customization - Webhooks
      {
        path: 'customization/webhooks',
        element: (
          <SuspenseWrapper>
            <WebhookListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'customization/webhooks/new',
        element: (
          <SuspenseWrapper>
            <WebhookFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'customization/webhooks/:id/edit',
        element: (
          <SuspenseWrapper>
            <WebhookFormPage />
          </SuspenseWrapper>
        ),
      },
      // Reviews
      {
        path: 'reviews',
        element: (
          <SuspenseWrapper>
            <ReviewListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'reviews/new',
        element: (
          <SuspenseWrapper>
            <ReviewFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'reviews/:id',
        element: (
          <SuspenseWrapper>
            <ReviewDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'reviews/:id/edit',
        element: (
          <SuspenseWrapper>
            <ReviewFormPage />
          </SuspenseWrapper>
        ),
      },
      // Security
      {
        path: 'security/audit-logs',
        element: (
          <SuspenseWrapper>
            <AuditLogListPage />
          </SuspenseWrapper>
        ),
      },
      // Mobile Usage Logs (admin)
      {
        path: 'admin/mobile-logs',
        element: (
          <SuspenseWrapper>
            <MobileUsageLogs />
          </SuspenseWrapper>
        ),
      },
      // Reports
      {
        path: 'reports',
        element: (
          <SuspenseWrapper>
            <ReportListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'reports/:reportId',
        element: (
          <SuspenseWrapper>
            <ReportDetailPage />
          </SuspenseWrapper>
        ),
      },
      // Workforce
      {
        path: 'workforce',
        element: (
          <SuspenseWrapper>
            <AgentListPage />
          </SuspenseWrapper>
        ),
      },
      // Workflow & Approvals
      {
        path: 'workflow/templates',
        element: (
          <SuspenseWrapper>
            <WorkflowTemplateListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'workflow/templates/new',
        element: (
          <SuspenseWrapper>
            <WorkflowTemplateFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'workflow/templates/:id',
        element: (
          <SuspenseWrapper>
            <WorkflowTemplateDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'workflow/templates/:id/edit',
        element: (
          <SuspenseWrapper>
            <WorkflowTemplateFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'workflow/document-approvals',
        element: (
          <SuspenseWrapper>
            <DocumentApprovalListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'workflow/dashboard',
        element: (
          <SuspenseWrapper>
            <ApprovalDashboardPage />
          </SuspenseWrapper>
        ),
      },
      // Settings
      {
        path: 'settings',
        element: (
          <SuspenseWrapper>
            <GeneralSettingsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'settings/roles',
        element: (
          <SuspenseWrapper>
            <RolesPermissionsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'settings/payment-gateways',
        element: (
          <SuspenseWrapper>
            <PaymentGatewaySettingsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'settings/customer-payment',
        element: (
          <SuspenseWrapper>
            <CustomerPaymentSettingsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'settings/email-sms-templates',
        element: (
          <SuspenseWrapper>
            <EmailSmsTemplateManagementPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'settings/notifications',
        element: (
          <SuspenseWrapper>
            <NotificationPreferencesPage />
          </SuspenseWrapper>
        ),
      },
      // WhatsApp Channel
      {
        path: 'settings/channels/whatsapp',
        element: (
          <SuspenseWrapper>
            <WhatsAppChannelSettingsPage />
          </SuspenseWrapper>
        ),
      },
      // Email Channel
      {
        path: 'settings/channels/email',
        element: (
          <SuspenseWrapper>
            <EmailChannelSettingsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'security/settings',
        element: (
          <SuspenseWrapper>
            <SecuritySettingsPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'reports/builder',
        element: (
          <SuspenseWrapper>
            <CustomReportBuilderPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },
  {
    path: '/auth/magic',
    element: (
      <OpenRoute>
        <SuspenseWrapper>
          <MagicLinkVerifyPage />
        </SuspenseWrapper>
      </OpenRoute>
    ),
  },
  {
    path: '/onboarding/setup',
    element: (
      <PrivateRoute>
        <SuspenseWrapper>
          <OnboardingSetupPage />
        </SuspenseWrapper>
      </PrivateRoute>
    ),
  },
  {
    path: '/onboarding/user-setup',
    element: (
      <PrivateRoute>
        <SuspenseWrapper>
          <UserOnboardingPage />
        </SuspenseWrapper>
      </PrivateRoute>
    ),
  },
  {
    path: '/estimate/sign/:token',
    element: (
      <OpenRoute>
        <SuspenseWrapper>
          <EstimatePublicSignPage />
        </SuspenseWrapper>
      </OpenRoute>
    ),
  },
  {
    path: '/estimate/approve/:token',
    element: (
      <OpenRoute>
        <SuspenseWrapper>
          <EstimateApprovalPage />
        </SuspenseWrapper>
      </OpenRoute>
    ),
  },
  {
    path: '/invoice/view/:token',
    element: (
      <OpenRoute>
        <SuspenseWrapper>
          <InvoicePortalPage />
        </SuspenseWrapper>
      </OpenRoute>
    ),
  },
  {
    path: '/signup',
    element: (
      <OpenRoute>
        <SuspenseWrapper>
          <SignupFromMagicLinkPage />
        </SuspenseWrapper>
      </OpenRoute>
    ),
  },
  {
    path: '/landing',
    element: (
      <OpenRoute>
        <SuspenseWrapper>
          <LandingPage />
        </SuspenseWrapper>
      </OpenRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
];
