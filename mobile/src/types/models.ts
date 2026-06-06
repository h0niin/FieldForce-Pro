// ─── Enums ──────────────────────────────────────────────────────────────────

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  LOCKED = 'locked',
}

export enum DeviceType {
  WEB = 'web',
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop',
}

export enum Order {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
}

export enum SubscriptionPlan {
  FREE = 'free',
  STANDARD = 'standard',
  PROFESSIONAL = 'professional',
}

export enum WorkOrderStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum WorkOrderPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  EN_ROUTE = 'en_route',
  IN_TRANSIT = 'in_transit',
  ON_SITE = 'on_site',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TripStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TimesheetStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ServiceAgreementStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  RENEWED = 'renewed',
}

// ─── Core Models (mirrored from web) ────────────────────────────────────────

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  timezone: string;
  language: string;
  fcm_token?: string;
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
  roles?: Role[];
  permissions?: string[];
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
  settings: Record<string, unknown>;
  subscription_plan: SubscriptionPlan;
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

// ─── API Types (mirrored from web) ──────────────────────────────────────────

export interface ApiResponse<T> {
  statusCode: number;
  status: boolean;
  message: string;
  data?: T;
  meta?: PageMeta;
}

export interface PageMeta {
  page: number;
  take: number;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PageOptions {
  page?: number;
  take?: number;
  order?: Order;
  search?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  company_name: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  device_name?: string;
  device_type?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
}

export interface RefreshTokenPayload {
  refresh_token: string;
}

// ─── Mobile-Specific Models ─────────────────────────────────────────────────

export interface WorkOrder {
  id: string;
  tenant_id: string;
  wo_number: string;
  summary: string;
  description: string | null;
  status: string;
  priority: string;
  contact_id: string | null;
  location_id: string | null;
  asset_id: string | null;
  category: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  assigned_to: string | null;
  is_recurring: boolean;
  custom_fields: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  line_items?: LineItem[];
  appointments?: Appointment[];
}

export interface LineItem {
  id: string;
  work_order_id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Appointment {
  id: string;
  work_order_id: string;
  tenant_id: string;
  status: AppointmentStatus;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  technician_id: string;
  customer_name: string;
  customer_phone: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  signature_url: string | null;
  photos: string[];
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  tenant_id: string;
  company_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tags: string[] | null;
  custom_fields: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  tenant_id: string;
  name: string;
  industry: string | null;
  billing_address: string | null;
  tax_id: string | null;
  website: string | null;
  notes: string | null;
  custom_fields: Record<string, unknown> | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobSheet {
  id: string;
  work_order_id: string;
  appointment_id: string;
  technician_id: string;
  checklist_items: ChecklistItemData[];
  photos: string[];
  notes: string | null;
  signature_url: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItemData {
  id: string;
  label: string;
  type?: string;
  value?: string | null;
  is_required?: boolean;
  instance_id?: string;
  completed: boolean;
  notes: string | null;
  photo_url: string | null;
}

export interface Timesheet {
  id: string;
  user_id: string;
  tenant_id: string;
  appointment_id: string | null;
  work_order_id: string | null;
  clock_in: string;
  clock_out: string | null;
  travel_time_minutes: number;
  work_time_minutes: number;
  break_time_minutes: number;
  is_billable: boolean;
  notes: string | null;
  /** 'pending' | 'approved' | 'rejected' */
  status: string;
  approved_by: string | null;
  custom_fields: Record<string, unknown> | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string;
  user_id: string;
  tenant_id: string;
  appointment_id: string | null;
  start_lat: number | null;
  start_lng: number | null;
  end_lat: number | null;
  end_lng: number | null;
  start_time: string | null;
  end_time: string | null;
  distance_km: number | null;
  route_polyline: string | null;
  status: string;
  custom_fields: Record<string, unknown> | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export enum DocumentType {
  CERTIFICATION = 'certification',
  LICENSE = 'license',
  ID_PROOF = 'id_proof',
  INSURANCE = 'insurance',
  CONTRACT = 'contract',
  OTHER = 'other',
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
  custom_fields: Record<string, unknown> | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  tenant_id: string;
  contact_id: string | null;
  location_id: string | null;
  name: string;
  model: string | null;
  serial_number: string | null;
  manufacturer: string | null;
  install_date: string | null;
  warranty_expiry: string | null;
  health_score: number | string | null;
  category: string | null;
  notes: string | null;
  custom_fields: Record<string, unknown> | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
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
  custom_fields: Record<string, unknown> | null;
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
  custom_fields: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
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
  custom_fields: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/** Normalized customer contact details returned by GET /service-requests/:id.
 *  Populated from the linked Contact (admin-created) OR custom_fields
 *  (website/inbound) so the technician always sees the same shape. */
export interface CustomerInfo {
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  source: 'contact' | 'website';
}

export interface RequestContact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
}

export interface RequestLocation {
  id: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
}

export interface ServiceRequest {
  id: string;
  tenant_id: string;
  request_number: string | null;
  contact_id: string | null;
  location_id: string | null;
  subject: string;
  description: string | null;
  priority: string;
  category: string | null;
  status: string;
  channel: string;
  assigned_to: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  lat: number | null;
  lng: number | null;
  custom_fields: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  // Relations / computed (present on the detail endpoint)
  contact?: RequestContact | null;
  location?: RequestLocation | null;
  technicians?: Array<{ id: string; first_name: string | null; last_name: string | null; email: string | null }>;
  customer?: CustomerInfo;
}

/** A file attached to a service request (request_attachments table). */
export interface RequestAttachment {
  id: string;
  request_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface ServiceAgreement {
  id: string;
  tenant_id: string;
  contact_id: string | null;
  name: string;
  type: string;
  start_date: string;
  end_date: string;
  recurrence: string | null;
  sla_response_hours: number | null;
  sla_resolution_hours: number | null;
  value: number;
  status: ServiceAgreementStatus;
  description: string | null;
  custom_fields: Record<string, unknown> | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface EstimateLineItem {
  id: string;
  estimate_id: string;
  type: 'service' | 'part' | 'travel';
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount: number;
  total: number;
  sort_order: number;
}

export interface Estimate {
  id: string;
  tenant_id: string;
  estimate_number: string | null;
  request_id: string | null;
  work_order_id: string | null;
  contact_id: string | null;
  status: 'draft' | 'pending_approval' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'expired' | 'converted_to_wo' | 'converted_to_invoice';
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  expiry_date: string | null;
  signature_url: string | null;
  notes: string | null;
  custom_fields: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  contact?: Contact;
  line_items?: EstimateLineItem[];
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

export interface AgentLocation {
  id: string;
  tenant_id: string;
  agent_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  recorded_at: string;
  created_at: string;
  updated_at: string;
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
  discount: number;
  total: number;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserDocument {
  id: string;
  tenant_id: string;
  user_id: string;
  document_type: DocumentType;
  document_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  issue_date: string | null;
  expiry_date: string | null;
  issuing_authority: string | null;
  document_number: string | null;
  notes: string | null;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}
export interface Payment {
  id: string;
  tenant_id: string;
  invoice_id: string;
  amount: number;
  method: string;
  gateway_transaction_id: string | null;
  paid_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  work_order_id: string | null;
  service_request_id: string | null;
  contact_id: string | null;
  invoice_number: string;
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
  signature_url: string | null;
  signed_by_name: string | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
  line_items?: InvoiceLineItem[];
}

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  channel: string;
  created_at: string;
  updated_at: string;
}

export interface Communication {
  id: string;
  tenant_id: string;
  contact_id: string;
  channel: string;
  direction: 'inbound' | 'outbound';
  type: string;
  subject: string | null;
  body: string | null;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  type: 'service' | 'part' | 'travel' | 'other';
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount: number;
  total: number;
}

export interface Pricebook {
  id: string;
  tenant_id: string;
  service_id: string | null;
  name: string;
  tier: 'good' | 'better' | 'best';
  price: number;
  description: string | null;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}
