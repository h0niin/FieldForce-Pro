import type { DeviceType, PermissionAction, SubscriptionPlan } from './enums';

export interface User {
  id: string;
  tenant_id: string | null;
  email: string;
  is_super_admin?: boolean;
  primary_role?: string | null;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  timezone: string;
  language: string;
  email_verified: boolean;
  phone_verified: boolean;
  is_active: boolean;
  is_deleted: boolean;
  last_login_at: string | null;
  password_changed_at: string | null;
  failed_login_attempts: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
  onboarding_completed?: boolean;
  roles?: Role[] | string[];  // Can be full Role objects or just role name strings from JWT
  permissions?: string[];      // Flat array of permission strings from JWT
}

export interface Territory {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
  settings: Record<string, unknown>;
  subscription_plan: SubscriptionPlan | string;
  subscription_plan_id: string | null;
  subscription_status: 'trial' | 'active' | 'expired' | 'suspended' | 'cancelled' | string;
  subscription_start: string | null;
  subscription_end: string | null;
  max_users: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  module: string;
  action: PermissionAction;
  description: string | null;
}

export interface LoginSession {
  id: string;
  user_id: string;
  device_name: string | null;
  device_type: DeviceType;
  ip_address: string | null;
  user_agent: string | null;
  os: string | null;
  browser: string | null;
  location: string | null;
  is_active: boolean;
  last_activity_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface Contact {
  id: string;
  tenant_id: string;
  company_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  service_address: string | null;
  billing_address: string | null;
  tags: string[];
  custom_fields: Record<string, unknown>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  tenant_id: string;
  name: string;
  phone?: string;
  industry: string | null;
  billing_address: string | null;
  tax_id: string | null;
  website: string | null;
  notes: string | null;
  custom_fields: Record<string, unknown>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceLocation {
  id: string;
  tenant_id: string;
  contact_id: string | null;
  company_id: string | null;
  address: string;
  lat: number | null;
  lng: number | null;
  access_notes: string | null;
  gate_code: string | null;
  custom_fields: Record<string, unknown>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  tenant_id: string;
  contact_id: string | null;
  company_id: string | null;
  service_location_id: string | null;
  parent_asset_id: string | null;
  name: string;
  model: string | null;
  serial_number: string | null;
  manufacturer: string | null;
  installation_date: string | null;
  last_service_date: string | null;
  warranty_expiry: string | null;
  product_category?: string;
  notes: string | null;
  giai: string | null;
  ordered_date: string | null;
  purchased_date: string | null;
  custom_fields: Record<string, unknown>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  status?: string;
  contact?: Contact;
  company?: Company;
  location?: ServiceLocation;
  parent_asset?: Asset;
}

export interface AssetMaintenancePlan {
  id: string;
  tenant_id: string;
  asset_id: string;
  name: string;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  next_due_date: string | null;
  last_completed_date: string | null;
  auto_create_wo: boolean;
  is_active: boolean;
  custom_fields: Record<string, unknown>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  asset?: Asset;
}

export interface ServiceCatalogItem {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  default_price: number | null;
  tax_rate: number | null;
  duration_minutes: number | null;
  category: string | null;
  is_active: boolean;
  custom_fields: Record<string, unknown>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface PartsCatalogItem {
  id: string;
  tenant_id: string;
  name: string;
  sku: string | null;
  description: string | null;
  unit_price: number | null;
  stock_qty: number;
  reorder_level: number;
  supplier: string | null;
  category: string | null;
  is_active: boolean;
  custom_fields: Record<string, unknown>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequest {
  id: string;
  tenant_id: string;
  request_number: string | null;
  contact_id: string | null;
  location_id: string | null;
  subject: string;
  description: string | null;
  priority_id: string | null;
  category_id: string | null;
  sub_category_id: string | null;
  priority?: string | null; // Keep for legacy
  category?: string | null; // Keep for legacy
  status: 'new' | 'triaged' | 'estimated' | 'approved' | 'converted_to_wo' | 'closed' | 'spam';
  channel: 'phone' | 'email' | 'portal' | 'webform' | 'api' | 'whatsapp' | 'sms';
  assigned_to: string | null;
  lat: number | null;
  lng: number | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  custom_fields: Record<string, unknown>;
  is_spam?: boolean;
  spam_reason?: string | null;
  spam_confidence?: number | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  contact?: Contact;
  location?: ServiceLocation;
  technicians?: User[];
  sla?: {
    response_deadline: string | null;
    response_status: 'PENDING' | 'PAUSED' | 'MET' | 'BREACHED';
    resolution_deadline: string | null;
    resolution_status: 'PENDING' | 'PAUSED' | 'MET' | 'BREACHED';
  };
}

export interface Estimate {
  id: string;
  tenant_id: string;
  request_id: string | null;
  work_order_id: string | null;
  contact_id: string | null;
  estimate_number: string | null;
  status: 'draft' | 'pending_approval' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'expired' | 'converted_to_wo' | 'converted_to_invoice' | 'pending_internal_approval' | 'pending_customer_approval' | 'customer_approved' | 'customer_rejected' | 'revision_required';
  estimate_type?: 'pre_visit' | 'on_site';
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  expiry_date: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  signature_url: string | null;
  public_token?: string | null;
  public_token_expires_at?: string | null;
  created_by?: string | null;
  notes: string | null;
  custom_fields: Record<string, unknown>;
  // On-site approval flow fields
  internal_approval_status?: string | null;
  internal_approved_by?: string | null;
  internal_approved_at?: string | null;
  internal_rejection_reason?: string | null;
  customer_approval_status?: string | null;
  customer_approved_at?: string | null;
  customer_rejection_reason?: string | null;
  customer_signature?: string | null;
  customer_name_signed?: string | null;
  awaiting_internal_approval?: boolean;
  awaiting_customer_approval?: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  contact?: Contact;
  line_items?: EstimateLineItem[];
}

export interface EstimateLineItem {
  id: string;
  tenant_id: string;
  estimate_id: string;
  type: 'service' | 'part' | 'travel';
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_type: 'fixed' | 'percentage';
  discount: number;
  total: number;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkOrder {
  id: string;
  tenant_id: string;
  request_id: string | null;
  estimate_id: string | null;
  contact_id: string | null;
  location_id: string | null;
  asset_id: string | null;
  wo_number: string | null;
  status: 'new' | 'estimated' | 'approved' | 'scheduled' | 'in_progress' | 'on_hold' | 'completed' | 'closed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string | null;
  summary: string;
  description: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  assigned_to: string | null;
  tags: string[];
  is_recurring: boolean;
  recurrence_rule: string | null;
  custom_fields: Record<string, unknown>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  contact?: Contact;
  location?: ServiceLocation;
  asset?: Asset;
  sla?: {
    response_deadline: string | null;
    response_status: 'PENDING' | 'PAUSED' | 'MET' | 'BREACHED';
    resolution_deadline: string | null;
    resolution_status: 'PENDING' | 'PAUSED' | 'MET' | 'BREACHED';
  };
}

export interface WorkOrderLineItem {
  id: string;
  tenant_id: string;
  work_order_id: string;
  type: 'service' | 'part' | 'travel';
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_type: 'fixed' | 'percentage';
  discount: number;
  total: number;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderNote {
  id: string;
  tenant_id: string;
  work_order_id: string;
  user_id: string | null;
  content: string;
  is_internal: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderAttachment {
  id: string;
  tenant_id: string;
  work_order_id: string;
  user_id: string | null;
  file_url: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

// Phase 10: Service Appointments
export interface ServiceAppointment {
  id: string;
  tenant_id: string;
  work_order_id: string;
  agent_id: string;
  crew_id: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  notes: string | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  custom_fields: Record<string, unknown>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  work_order?: WorkOrder;
  agent?: User;
}

// Phase 11: Job Sheets
export interface JobSheetTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  category: string | null;
  items: Record<string, unknown>[];
  is_active: boolean;
  custom_fields: Record<string, unknown>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobSheetInstance {
  id: string;
  tenant_id: string;
  template_id: string;
  appointment_id: string | null;
  work_order_id: string | null;
  status: 'draft' | 'pending' | 'approved' | 'in_progress' | 'completed';
  completed_by: string | null;
  completed_at: string | null;
  custom_fields: Record<string, unknown>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  template?: JobSheetTemplate;
  work_order?: { id: string; wo_number: string; summary: string };
  items?: JobSheetItem[];
}

export interface JobSheetItem {
  id: string;
  tenant_id: string;
  instance_id: string;
  label: string;
  type: 'checkbox' | 'text' | 'photo' | 'signature' | 'number' | 'date';
  value: string | null;
  photo_url: string | null;
  is_required: boolean;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

// Phase 12: Timesheets, Trips & Location
export interface Timesheet {
  id: string;
  tenant_id: string;
  user_id: string;
  appointment_id: string | null;
  work_order_id: string | null;
  clock_in: string;
  clock_out: string | null;
  travel_time_minutes: number;
  work_time_minutes: number;
  break_time_minutes: number;
  is_billable: boolean;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  custom_fields: Record<string, unknown>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Trip {
  id: string;
  tenant_id: string;
  user_id: string;
  appointment_id: string | null;
  start_lat: number;
  start_lng: number;
  end_lat: number | null;
  end_lng: number | null;
  start_time: string;
  end_time: string | null;
  distance_km: number | null;
  route_polyline: string | null;
  status: 'in_progress' | 'completed' | 'cancelled';
  custom_fields: Record<string, unknown>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface AgentLocation {
  id: string;
  tenant_id: string;
  user_id: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  battery_level: number | null;
  recorded_at: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

// Phase 13: Invoicing & Payments
export interface Invoice {
  id: string;
  tenant_id: string;
  work_order_id: string | null;
  estimate_id: string | null;
  contact_id: string | null;
  company_id: string | null;
  invoice_number: string | null;
  status: 'draft' | 'sent' | 'viewed' | 'partially_paid' | 'paid' | 'overdue' | 'void';
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  due_date: string | null;
  paid_amount: number;
  currency: string;
  notes: string | null;
  pdf_url: string | null;
  custom_fields: Record<string, unknown>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  contact?: Contact;
  work_order?: WorkOrder;
  line_items?: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  id: string;
  tenant_id: string;
  invoice_id: string;
  type: 'service' | 'part' | 'travel' | 'other';
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_type: 'fixed' | 'percentage';
  discount: number;
  total: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  invoice_id: string;
  amount: number;
  method: string; // cash | cheque | upi | card | bank_transfer | online | other
  gateway_transaction_id: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'confirmed' | 'pending_verification' | 'rejected';
  source: 'manual' | 'portal';
  received_by: string | null;
  rejection_reason: string | null;
  screenshot_url: string | null;
  paid_at: string | null;
  notes: string | null;
  custom_fields: Record<string, unknown>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  invoice?: Invoice;
}

export interface PaymentGateway {
  id: string;
  tenant_id: string;
  gateway_name: string;
  is_active: boolean;
  is_test_mode: boolean;
  settings: Record<string, unknown>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

// Phase 14: Service Agreements
export interface ServiceAgreement {
  id: string;
  tenant_id: string;
  contact_id: string;
  name: string;
  type: string;
  start_date: string;
  end_date: string;
  recurrence: string | null;
  sla_response_hours: number | null;
  sla_resolution_hours: number | null;
  value: number;
  status: string;
  description: string | null;
  custom_fields: Record<string, unknown>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

// Phase 15: Blueprints
export interface BlueprintDefinition {
  id: string;
  tenant_id: string;
  name: string;
  module: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlueprintState {
  id: string;
  blueprint_id: string;
  name: string;
  color: string;
  is_initial: boolean;
  is_final: boolean;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlueprintTransition {
  id: string;
  blueprint_id: string;
  from_state_id: string;
  to_state_id: string;
  name: string;
  allowed_roles: string[];
  required_fields: string[];
  webhook_url: string | null;
  guard_condition: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

// Phase 16: Notifications & Communication
export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  channel: string;
  is_read: boolean;
  sent_at: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Communication {
  id: string;
  tenant_id: string;
  contact_id: string;
  channel: string;
  direction: string;
  subject: string | null;
  body: string;
  status: string;
  sent_at: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

// Phase 17: Webforms
export interface Webform {
  id: string;
  tenant_id: string;
  name: string;
  fields: Record<string, unknown>[];
  styling: Record<string, unknown>;
  redirect_url: string | null;
  is_active: boolean;
  embed_code: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

// Phase 18: Pricebook & Settings
export interface PricebookItem {
  id: string;
  tenant_id: string;
  service_id: string | null;
  name: string;
  tier: string;
  price: number;
  description: string | null;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  id: string;
  tenant_id: string;
  key: string;
  value: Record<string, unknown>;
  category: string;
  created_at: string;
  updated_at: string;
}

// Phase 19: Customization
export interface CustomField {
  id: string;
  tenant_id: string;
  module: string;
  field_name: string;
  field_type: string;
  options: Record<string, unknown>;
  is_required: boolean;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  tenant_id: string;
  type: string;
  name: string;
  content: Record<string, unknown>;
  is_default: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowRule {
  id: string;
  tenant_id: string;
  name: string;
  module: string;
  trigger_event: string;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Webhook {
  id: string;
  tenant_id: string;
  name: string;
  url: string;
  events: string[];
  secret: string | null;
  is_active: boolean;
  last_triggered_at: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

// Phase 20: Reports & Dashboards
export interface Dashboard {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  widgets: Record<string, unknown>[];
  is_default: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

// Phase 21: Reviews
export interface Review {
  id: string;
  tenant_id: string;
  work_order_id: string;
  contact_id: string;
  rating: number;
  comment: string | null;
  platform: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

// Phase 22: Audit Logs
export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string;
  action: string;
  module: string;
  record_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
