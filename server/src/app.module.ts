import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { SharedModule } from './shared/shared.module';
import { EmailModule } from './shared/email.module';
import { DatabaseModule } from './database/database.module';
import { AppJwtModule } from './JWT_MODULE/jwt.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './USERS/users.module';
import { TenantsModule } from './TENANTS/tenants.module';
import { UserRolesModule } from './USER_ROLES/user_roles.module';
import { LoginSessionsModule } from './LOGIN_SESSIONS/login_sessions.module';
import { PermissionsModule } from './PERMISSIONS/permissions.module';
import { RolesModule } from './ROLES/roles.module';
import { RolePermissionModule } from './ROLE_PERMISSION/role_permission.module';
import { UserDocumentsModule } from './USER_DOCUMENTS/user_documents.module';
import { ContactsModule } from './CONTACTS/contacts.module';
import { CompaniesModule } from './COMPANIES/companies.module';
import { ServiceLocationsModule } from './SERVICE_LOCATIONS/service_locations.module';
import { AssetsModule } from './ASSETS/assets.module';
import { AssetMaintenancePlansModule } from './ASSET_MAINTENANCE_PLANS/asset_maintenance_plans.module';
import { ServiceRequestsModule } from './SERVICE_REQUESTS/service_requests.module';
import { ServicesCatalogModule } from './SERVICES_CATALOG/services_catalog.module';
import { PartsCatalogModule } from './PARTS_CATALOG/parts_catalog.module';
import { EstimatesModule } from './ESTIMATES/estimates.module';
import { EstimateLineItemsModule } from './ESTIMATE_LINE_ITEMS/estimate_line_items.module';
import { WorkOrdersModule } from './WORK_ORDERS/work_orders.module';
import { WorkOrderLineItemsModule } from './WORK_ORDER_LINE_ITEMS/work_order_line_items.module';
import { WorkOrderNotesModule } from './WORK_ORDER_NOTES/work_order_notes.module';
import { WorkOrderAttachmentsModule } from './WORK_ORDER_ATTACHMENTS/work_order_attachments.module';
import { ServiceAppointmentsModule } from './SERVICE_APPOINTMENTS/service_appointments.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermissionGuard } from './shared/guards/permission.guard';
import { IPWhitelistGuard } from './auth/guards/ip-whitelist.guard';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { TransformInterceptor } from './shared/interceptors/transform.interceptor';
import { AuditInterceptor } from './shared/interceptors/audit.interceptor';
import { JobSheetTemplatesModule } from './JOB_SHEET_TEMPLATES/job_sheet_templates.module';
import { JobSheetInstancesModule } from './JOB_SHEET_INSTANCES/job_sheet_instances.module';
import { JobSheetItemsModule } from './JOB_SHEET_ITEMS/job_sheet_items.module';
import { TimesheetsModule } from './TIMESHEETS/timesheets.module';
import { TripsModule } from './TRIPS/trips.module';
import { AgentLocationsModule } from './AGENT_LOCATIONS/agent_locations.module';
import { InvoicesModule } from './INVOICES/invoices.module';
import { InvoiceLineItemsModule } from './INVOICE_LINE_ITEMS/invoice_line_items.module';
import { PaymentsModule } from './PAYMENTS/payments.module';
import { PaymentGatewaysModule } from './PAYMENT_GATEWAYS/payment_gateways.module';
import { NotificationsModule } from './NOTIFICATIONS/notifications.module';
import { CommunicationModule } from './COMMUNICATION/communication.module';
import { WebformsModule } from './WEBFORMS/webforms.module';
import { ReportsModule } from './REPORTS/reports.module';
import { DashboardsModule } from './DASHBOARDS/dashboards.module';
import { ReviewsModule } from './REVIEWS/reviews.module';
import { AuditLogsModule } from './AUDIT_LOGS/audit_logs.module';
import { ServiceAgreementsModule } from './SERVICE_AGREEMENTS/service_agreements.module';
import { BlueprintDefinitionsModule } from './BLUEPRINT_DEFINITIONS/blueprint_definitions.module';
import { BlueprintStatesModule } from './BLUEPRINT_STATES/blueprint_states.module';
import { BlueprintTransitionsModule } from './BLUEPRINT_TRANSITIONS/blueprint_transitions.module';
import { PricebookModule } from './PRICEBOOK/pricebook.module';
import { SettingsModule } from './SETTINGS/settings.module';
import { CustomFieldsModule } from './CUSTOM_FIELDS/custom_fields.module';
import { TemplatesModule } from './TEMPLATES/templates.module';
import { WorkflowRulesModule } from './WORKFLOW_RULES/workflow_rules.module';
import { WebhooksModule } from './WEBHOOKS/webhooks.module';
import { AutoAssignmentModule } from './AUTO_ASSIGNMENT/auto-assignment.module';
import { MFAModule } from './MFA/mfa.module';
import { IPWhitelistModule } from './IP_WHITELIST/ip-whitelist.module';
import { SCHEDULINGModule } from './SCHEDULING/scheduling.module';
import { IoTDataModule } from './IOT_DATA/iot_data.module';
import { ChatbotSessionsModule } from './CHATBOT_SESSIONS/chatbot_sessions.module';
import { DocumentsModule } from './DOCUMENTS/documents.module';
import { WorkflowModule } from './WORKFLOW/workflow.module';
import { WorkOrderTechnicianSessionsModule } from './WORK_ORDER_TECHNICIAN_SESSIONS/work_order_technician_sessions.module';
import { SlaTimersModule } from './SLA_TIMERS/sla_timers.module';
import { OnboardingModule } from './ONBOARDING/onboarding.module';
import { AttachmentsModule } from './ATTACHMENTS/attachments.module';
import { FeedbackModule } from './FEEDBACK/feedback.module';
import { AiModule } from './AI/ai.module';
import { ApiKeysModule } from './API_KEYS/api_keys.module';
import { SuperAdminModule } from './SUPER_ADMIN/super_admin.module';
import { MagicLinksModule } from './MAGIC_LINKS/magic_links.module';
import { SubscriptionPlansModule } from './SUBSCRIPTION_PLANS/subscription_plans.module';
import { WhatsAppChannelsModule } from './WHATSAPP_CHANNELS/whatsapp_channels.module';
import { SlaModule } from './SLA_MODULE/sla.module';
import { LookupsModule } from './LOOKUPS/lookups.module';
import { EmailChannelsModule } from './EMAIL_CHANNELS/email_channels.module';
import { TerritoriesModule } from './TERRITORIES/territories.module';
import { ServiceReportsModule } from './SERVICE_REPORTS/service_reports.module';
import { ActivityLogsModule } from './ACTIVITY_LOGS/activity_logs.module';
import { NotesModule } from './NOTES/notes.module';
import { TenantModulesModule } from './TENANT_MODULES/tenant_modules.module';
import { FieldPermissionsModule } from './FIELD_PERMISSIONS/field_permissions.module';
import { DispatchConsoleLayoutsModule } from './DISPATCH_CONSOLE_LAYOUTS/dispatch_console_layouts.module';
import { ModuleMappingsModule } from './MODULE_MAPPINGS/module_mappings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    ScheduleModule.forRoot(),
    SharedModule,
    EmailModule,
    DatabaseModule,
    AppJwtModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    UserRolesModule,
    LoginSessionsModule,
    PermissionsModule,
    RolesModule,
    RolePermissionModule,
    UserDocumentsModule,
    ActivityLogsModule,
    NotesModule,
    ContactsModule,
    CompaniesModule,
    ServiceLocationsModule,
    AssetsModule,
    AssetMaintenancePlansModule,
    ServiceRequestsModule,
    ServicesCatalogModule,
    PartsCatalogModule,
    EstimatesModule,
    EstimateLineItemsModule,
    WorkOrdersModule,
    WorkOrderLineItemsModule,
    WorkOrderNotesModule,
    WorkOrderAttachmentsModule,
    ServiceAppointmentsModule,
    JobSheetTemplatesModule,
    JobSheetInstancesModule,
    JobSheetItemsModule,
    TimesheetsModule,
    TripsModule,
    AgentLocationsModule,
    InvoicesModule,
    InvoiceLineItemsModule,
    PaymentsModule,
    PaymentGatewaysModule,
    NotificationsModule,
    CommunicationModule,
    WebformsModule,
    ReportsModule,
    DashboardsModule,
    ReviewsModule,
    AuditLogsModule,
    ServiceAgreementsModule,
    BlueprintDefinitionsModule,
    BlueprintStatesModule,
    BlueprintTransitionsModule,
    PricebookModule,
    SettingsModule,
    CustomFieldsModule,
    TemplatesModule,
    WorkflowRulesModule,
    WebhooksModule,
    AutoAssignmentModule,
    MFAModule,
    IPWhitelistModule,
    SCHEDULINGModule,
    IoTDataModule,
    ChatbotSessionsModule,
    DocumentsModule,
    WorkflowModule,
    WorkOrderTechnicianSessionsModule,
    SlaTimersModule,
    OnboardingModule,
    AttachmentsModule,
    FeedbackModule,
    AiModule,
    ApiKeysModule,
    SuperAdminModule,
    MagicLinksModule,
    SubscriptionPlansModule,
    WhatsAppChannelsModule,
    SlaModule,
    LookupsModule,
    EmailChannelsModule,
    TerritoriesModule,
    ServiceReportsModule,
    TenantModulesModule,
    FieldPermissionsModule,
    DispatchConsoleLayoutsModule,
    ModuleMappingsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: IPWhitelistGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
