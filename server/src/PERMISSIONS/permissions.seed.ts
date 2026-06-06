/**
 * Seed data for all system permissions.
 * Each module gets 5 standard actions: create, read, update, delete, manage.
 */

interface SeedPermission {
  name: string;
  module: string;
  action: string;
  description: string;
}

const ACTIONS = ['create', 'read', 'update', 'delete', 'manage'] as const;

const MODULES: { module: string; label: string }[] = [
  // Core
  { module: 'dashboard', label: 'Dashboard' },
  { module: 'users', label: 'Users' },
  { module: 'roles', label: 'Roles' },
  { module: 'permissions', label: 'Permissions' },
  { module: 'tenants', label: 'Tenants' },
  { module: 'settings', label: 'Settings' },

  // Customer
  { module: 'contacts', label: 'Contacts' },
  { module: 'companies', label: 'Companies' },
  { module: 'service_locations', label: 'Service Locations' },

  // Operations
  { module: 'service_requests', label: 'Service Requests' },
  { module: 'estimates', label: 'Estimates' },
  { module: 'work_orders', label: 'Work Orders' },
  { module: 'service_appointments', label: 'Service Appointments' },
  { module: 'scheduling', label: 'Scheduling' },

  // Job Management
  { module: 'job_sheets', label: 'Job Sheets' },
  { module: 'timesheets', label: 'Timesheets' },
  { module: 'trips', label: 'Trips' },
  { module: 'agent_locations', label: 'Agent Locations' },

  // Financial
  { module: 'invoices', label: 'Invoices' },
  { module: 'payments', label: 'Payments' },
  { module: 'payment_gateways', label: 'Payment Gateways' },
  { module: 'service_agreements', label: 'Service Agreements' },
  { module: 'pricebook', label: 'Pricebook' },

  // Catalog
  { module: 'services_catalog', label: 'Services Catalog' },
  { module: 'parts_catalog', label: 'Parts Catalog' },
  { module: 'asset_maintenance_plans', label: 'Maintenance Plans' },
  { module: 'assets', label: 'Assets' },

  // Communication
  { module: 'notifications', label: 'Notifications' },
  { module: 'communications', label: 'Communications' },
  { module: 'webforms', label: 'Webforms' },
  { module: 'reviews', label: 'Reviews' },

  // Automation
  { module: 'blueprint_definitions', label: 'Blueprints' },
  { module: 'blueprint_states', label: 'Blueprint States' },
  { module: 'blueprint_transitions', label: 'Blueprint Transitions' },
  { module: 'custom_fields', label: 'Custom Fields' },
  { module: 'templates', label: 'Templates' },
  { module: 'workflow_rules', label: 'Workflow Rules' },
  { module: 'workflow_templates', label: 'Workflow Templates' },
  { module: 'workflow_approvals', label: 'Workflow Approvals' },
  { module: 'webhooks', label: 'Webhooks' },

  // Reports
  { module: 'reports', label: 'Reports' },
  { module: 'dashboards', label: 'Dashboards' },
  { module: 'audit_logs', label: 'Audit Logs' },
  { module: 'workforce', label: 'Workforce' },

  // AI
  { module: 'chatbot', label: 'Chatbot' },
  { module: 'documents', label: 'Documents' },
  { module: 'analytics', label: 'Analytics' },
  { module: 'vision', label: 'Vision' },
  { module: 'voice', label: 'Voice' },
  { module: 'iot_data', label: 'IoT Data' },
  { module: 'scheduling_ai', label: 'Scheduling AI' },

  // Portal
  { module: 'portal', label: 'Portal' },
];

export const SEED_PERMISSIONS: SeedPermission[] = MODULES.flatMap(({ module, label }) =>
  ACTIONS.map((action) => ({
    name: `${module}:${action}`,
    module,
    action,
    description: `Allows ${action} access to ${label}`,
  })),
);

export const SEED_MODULES = MODULES;
