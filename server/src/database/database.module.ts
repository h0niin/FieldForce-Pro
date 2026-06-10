import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { StartupMigrationsService } from './startup-migrations.service';
import { LookupSeederService } from './lookup-seeder.service';
import { AppConfigService } from '../shared/config/config.service';
import { User } from '../USERS/users.entity';
import { Tenant } from '../TENANTS/tenants.entity';
import { Role } from '../ROLES/roles.entity';
import { Permission } from '../PERMISSIONS/permissions.entity';
import { RolePermission } from '../ROLE_PERMISSION/role_permission.entity';
import { UserRole } from '../USER_ROLES/user_roles.entity';
import { LoginSession } from '../LOGIN_SESSIONS/login_sessions.entity';
import { UserDocument } from '../USER_DOCUMENTS/user_documents.entity';
import { Contact } from '../CONTACTS/contacts.entity';
import { Company } from '../COMPANIES/companies.entity';
import { ServiceLocation } from '../SERVICE_LOCATIONS/service_locations.entity';
import { Asset } from '../ASSETS/assets.entity';
import { AssetMaintenancePlan } from '../ASSET_MAINTENANCE_PLANS/asset_maintenance_plans.entity';
import { ServicesCatalog } from '../SERVICES_CATALOG/services_catalog.entity';
import { PartsCatalog } from '../PARTS_CATALOG/parts_catalog.entity';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';
import { Estimate } from '../ESTIMATES/estimates.entity';
import { EstimateLineItem } from '../ESTIMATE_LINE_ITEMS/estimate_line_items.entity';
import { WorkOrder } from '../WORK_ORDERS/work_orders.entity';
import { WorkOrderLineItem } from '../WORK_ORDER_LINE_ITEMS/work_order_line_items.entity';
import { WorkOrderNote } from '../WORK_ORDER_NOTES/work_order_notes.entity';
import { WorkOrderAttachment } from '../WORK_ORDER_ATTACHMENTS/work_order_attachments.entity';
import { ServiceAppointment } from '../SERVICE_APPOINTMENTS/service_appointments.entity';
import { ServiceAppointmentTrip } from '../SERVICE_APPOINTMENTS/service_appointment_trips.entity';
import { JobSheetTemplate } from '../JOB_SHEET_TEMPLATES/job_sheet_templates.entity';
import { JobSheetInstance } from '../JOB_SHEET_INSTANCES/job_sheet_instances.entity';
import { JobSheetItem } from '../JOB_SHEET_ITEMS/job_sheet_items.entity';
import { Timesheet } from '../TIMESHEETS/timesheets.entity';
import { Trip } from '../TRIPS/trips.entity';
import { AgentLocation } from '../AGENT_LOCATIONS/agent_locations.entity';
import { Invoice } from '../INVOICES/invoices.entity';
import { InvoiceLineItem } from '../INVOICE_LINE_ITEMS/invoice_line_items.entity';
import { Payment } from '../PAYMENTS/payments.entity';
import { PaymentGateway } from '../PAYMENT_GATEWAYS/payment_gateways.entity';
import { Notification } from '../NOTIFICATIONS/notifications.entity';
import { Communication } from '../COMMUNICATION/communication.entity';
import { Webform } from '../WEBFORMS/webforms.entity';
import { Dashboard } from '../DASHBOARDS/dashboards.entity';
import { Review } from '../REVIEWS/reviews.entity';
import { AuditLog } from '../AUDIT_LOGS/audit_logs.entity';
import { ServiceAgreement } from '../SERVICE_AGREEMENTS/service_agreements.entity';
import { BlueprintDefinition } from '../BLUEPRINT_DEFINITIONS/blueprint_definitions.entity';
import { BlueprintState } from '../BLUEPRINT_STATES/blueprint_states.entity';
import { BlueprintTransition } from '../BLUEPRINT_TRANSITIONS/blueprint_transitions.entity';
import { Pricebook } from '../PRICEBOOK/pricebook.entity';
import { Setting } from '../SETTINGS/settings.entity';
import { CustomField } from '../CUSTOM_FIELDS/custom_fields.entity';
import { Template } from '../TEMPLATES/templates.entity';
import { WorkflowRule } from '../WORKFLOW_RULES/workflow_rules.entity';
import { Webhook } from '../WEBHOOKS/webhooks.entity';
import { ChatbotSession } from '../CHATBOT_SESSIONS/chatbot_sessions.entity';
import { ParsedDocument } from '../DOCUMENTS/documents.entity';
import { SCHEDULING } from '../SCHEDULING/scheduling.entity';
import { WorkflowTemplate } from '../WORKFLOW/WORKFLOW_TEMPLATES/workflow_templates.entity';
import { WorkflowApprover } from '../WORKFLOW/WORKFLOW_APPROVERS/workflow_approvers.entity';
import { DocumentApproval } from '../WORKFLOW/WORKFLOW_DOCUMENT_APPROVALS/document_approvals.entity';
import { ApprovalHistory } from '../WORKFLOW/WORKFLOW_APPROVAL_HISTORY/approval_history.entity';
import { IPWhitelist } from '../IP_WHITELIST/ip-whitelist.entity';
import { WorkOrderTechnicianSession } from '../WORK_ORDER_TECHNICIAN_SESSIONS/work_order_technician_sessions.entity';
import { SlaTimer } from '../SLA_TIMERS/sla_timers.entity';
import { RequestAttachment } from '../ATTACHMENTS/request_attachments.entity';
import { EstimateAttachment } from '../ATTACHMENTS/estimate_attachments.entity';
import { GlobalAttachment } from '../ATTACHMENTS/global_attachments.entity';
import { Note } from '../NOTES/notes.entity';
import { SubscriptionMagicLink } from '../SUBSCRIPTION_MAGIC_LINKS/subscription_magic_links.entity';
import { RequestAuditLog } from '../SERVICE_REQUESTS/request_audit_log.entity';
import { TechnicianFeedback } from '../FEEDBACK/technician_feedback.entity';
import { CustomerSatisfaction } from '../FEEDBACK/customer_satisfaction.entity';
import { MagicLink } from '../MAGIC_LINKS/magic_links.entity';
import { ApiKey } from '../API_KEYS/api_keys.entity';
import { SubscriptionPlan } from '../SUBSCRIPTION_PLANS/subscription_plans.entity';
import { SuperAdminApiKey } from '../SUPER_ADMIN/SUPER_ADMIN_API_KEYS/super_admin_api_keys.entity';
import { SuperAdminAuditLog } from '../SUPER_ADMIN/SUPER_ADMIN_AUDIT_LOGS/super_admin_audit_logs.entity';
import { ServiceRequestTechnician } from '../SERVICE_REQUESTS/service_request_technician.entity';
import { WhatsAppChannel } from '../WHATSAPP_CHANNELS/whatsapp_channels.entity';
import { WhatsAppConversation } from '../WHATSAPP_CHANNELS/whatsapp_conversations.entity';
import { Category } from '../CATEGORIES/categories.entity';
import { SubCategory } from '../SUB_CATEGORIES/sub_categories.entity';
import { Priority } from '../PRIORITIES/priorities.entity';
import { Location } from '../LOCATIONS/locations.entity';
import { SlaPolicy } from '../SLA_MODULE/sla_policies.entity';
import { ServiceRequestSla } from '../SLA_MODULE/service_request_slas.entity';
import { SlaAuditLog } from '../SLA_MODULE/sla_audit_logs.entity';
import { WorkingCalendar } from '../SLA_MODULE/working_calendars.entity';
import { SlaEscalation } from '../SLA_MODULE/sla_escalations.entity';
import { SlaPauseTrigger } from '../SLA_MODULE/sla_pause_triggers.entity';
import { EmailChannel } from '../EMAIL_CHANNELS/email_channels.entity';
import { EmailThread } from '../EMAIL_CHANNELS/email_threads.entity';
import { Territory } from '../TERRITORIES/territories.entity';
import { ServiceReport } from '../SERVICE_REPORTS/service_reports.entity';
import { TenantModule } from '../TENANT_MODULES/tenant_modules.entity';
import { FieldPermission } from '../FIELD_PERMISSIONS/field_permissions.entity';
import { DispatchConsoleLayout } from '../DISPATCH_CONSOLE_LAYOUTS/dispatch_console_layouts.entity';
import { ModuleMapping } from '../MODULE_MAPPINGS/module_mappings.entity';
import { CompanyType } from '../COMPANY_TYPES/company_types.entity';
import { ServiceRequestNote } from '../SERVICE_REQUEST_NOTES/service_request_notes.entity';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useFactory: (configService: AppConfigService) => ({
        dialect: 'postgres',
        host: configService.dbHost,
        port: configService.dbPort,
        username: configService.dbUsername,
        password: configService.dbPassword,
        database: configService.dbName,
        models: [
          SubscriptionPlan, User, Tenant, Role, Permission, RolePermission, UserRole,
          LoginSession, UserDocument, Contact, Company, ServiceLocation,
          Asset, AssetMaintenancePlan,
          ServicesCatalog, PartsCatalog,
          ServiceRequest,
          Estimate, EstimateLineItem,
          WorkOrder, WorkOrderLineItem, WorkOrderNote, WorkOrderAttachment,
          ServiceAppointment, ServiceAppointmentTrip,
          JobSheetTemplate, JobSheetInstance, JobSheetItem,
          Timesheet, Trip, AgentLocation,
          Invoice, InvoiceLineItem, Payment, PaymentGateway,
          Notification, Communication, Webform,
          Dashboard, Review, AuditLog,
          ServiceAgreement,
          BlueprintDefinition, BlueprintState, BlueprintTransition,
          Pricebook, Setting, CustomField, Template, WorkflowRule, Webhook,
          ChatbotSession, ParsedDocument, SCHEDULING,
          WorkflowTemplate, WorkflowApprover, DocumentApproval, ApprovalHistory,
          IPWhitelist,
          WorkOrderTechnicianSession,
          SlaTimer, Note, GlobalAttachment,
          RequestAttachment, EstimateAttachment, RequestAuditLog, TechnicianFeedback, CustomerSatisfaction,
          SubscriptionMagicLink,
          ApiKey, MagicLink, SuperAdminApiKey, SuperAdminAuditLog, ServiceRequestTechnician,
          WhatsAppChannel, WhatsAppConversation,
          Category, SubCategory, Priority, Location,
          SlaPolicy, ServiceRequestSla, SlaAuditLog,
          WorkingCalendar, SlaEscalation, SlaPauseTrigger,
          EmailChannel, EmailThread, Territory, ServiceReport,
          TenantModule, FieldPermission, DispatchConsoleLayout, ModuleMapping,
          CompanyType, ServiceRequestNote,
        ],
        autoLoadModels: true,
        synchronize: !configService.isProduction,
        sync: { alter: { drop: false } },
        logging: false,
        define: {
          underscored: true,
        },
        // Keep TCP connections alive so the OS/network doesn't silently drop
        // idle pool connections (prevents ECONNRESET on the next query).
        dialectOptions: {
          keepAlive: true,
          keepAliveInitialDelayMillis: 10000,
          statement_timeout: 60000,  // Increased to 60s for remote DB
          idle_in_transaction_session_timeout: 60000,
          query_timeout: 60000,
          connectionTimeoutMillis: 60000,
        },
        // Pool tuning: evict stale connections before they cause errors.
        pool: {
          max: 20,       // Increased pool size
          min: 5,        // Keep more connections warm
          acquire: 120000,  // Increased to 120s for remote DB
          idle: 30000,      // Increased idle timeout
          evict: 10000,     // More frequent eviction checks
        },
        retryAttempts: 5,    // More retries for remote DB
        retryDelay: 5000,    // Longer delay between retries
      }),
      inject: [AppConfigService],
    }),
    SequelizeModule.forFeature([Priority, Category, SubCategory, ServiceLocation, Tenant]),
  ],
  providers: [StartupMigrationsService, LookupSeederService],
  exports: [StartupMigrationsService, LookupSeederService],
})
export class DatabaseModule { }
