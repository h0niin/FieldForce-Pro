import api from './api-client';
import type {
  ApiResponse,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  ChangePasswordPayload,
  RefreshTokenPayload,
  User,
  LoginSession,
  WorkOrder,
  Appointment,
  Timesheet,
  Trip,
  PageOptions,
  UserDocument,
  Contact,
  Company,
  ServiceLocation,
  Asset,
  ServiceCatalogItem,
  PartsCatalogItem,
  AssetMaintenancePlan,
  ServiceRequest,
  RequestAttachment,
  Estimate,
  EstimateLineItem,
  WorkOrderNote,
  WorkOrderAttachment,
  WorkOrderLineItem,
  AgentLocation,
  Payment,
  Invoice,
  InvoiceLineItem,
  ServiceAgreement,
  Notification,
  Communication,
  Pricebook,
} from '@/types/models';

// ─── Auth API ───────────────────────────────────────────────────────────────

export const authApi = {
  login: (payload: LoginPayload) => api.post<ApiResponse<LoginResponse>>('/auth/login', payload),

  register: (payload: RegisterPayload) =>
    api.post<ApiResponse<LoginResponse>>('/auth/register', payload),

  refresh: (payload: RefreshTokenPayload) =>
    api.post<ApiResponse<{ access_token: string; refresh_token: string }>>('/auth/refresh', payload),

  logout: () => api.post<ApiResponse<null>>('/auth/logout'),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    api.post<ApiResponse<null>>('/auth/forgot-password', payload),

  resetPassword: (payload: ResetPasswordPayload) =>
    api.post<ApiResponse<null>>('/auth/reset-password', payload),

  changePassword: (payload: ChangePasswordPayload) =>
    api.post<ApiResponse<null>>('/auth/change-password', payload),

  getMe: () => api.get<ApiResponse<User>>('/auth/me'),

  updateMe: (dto: Partial<User>) => api.patch<ApiResponse<User>>('/auth/me', dto),

  getSessions: () => api.get<ApiResponse<LoginSession[]>>('/auth/sessions'),

  terminateSession: (sessionId: string) =>
    api.delete<ApiResponse<null>>(`/auth/sessions/${sessionId}`),
};

// ─── Work Orders API ────────────────────────────────────────────────────────

export const workOrdersApi = {
  getAll: (params?: PageOptions) =>
    api.get<ApiResponse<WorkOrder[]>>('/work-orders', { params }),

  getAllNonPaginated: () =>
    api.get<ApiResponse<WorkOrder[]>>('/work-orders/all'),

  getById: (id: string) => api.get<ApiResponse<WorkOrder>>(`/work-orders/${id}`),

  getMyWorkOrders: (params?: PageOptions) =>
    api.get<ApiResponse<WorkOrder[]>>('/work-orders/my', { params }),

  create: (dto: {
    summary: string;
    description?: string;
    priority?: string;
    status?: string;
    category?: string;
    contact_id?: string;
    location_id?: string;
    asset_id?: string;
    scheduled_start?: string;
    assigned_to?: string;
  }) => api.post<ApiResponse<WorkOrder>>('/work-orders', dto),

  updateStatus: (id: string, status: string) =>
    api.patch<ApiResponse<WorkOrder>>(`/work-orders/${id}/status`, { status }),

  // Technician accepts an assigned job (transitions to scheduled).
  accept: (id: string) =>
    api.post<ApiResponse<WorkOrder>>(`/work-orders/${id}/accept`),

  // Technician declines an assigned job (unassigns, resets to new). Reason required.
  decline: (id: string, reason: string) =>
    api.post<ApiResponse<WorkOrder>>(`/work-orders/${id}/decline`, { reason }),

  update: (id: string, dto: Partial<WorkOrder>) =>
    api.put<ApiResponse<WorkOrder>>(`/work-orders/${id}`, dto),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/work-orders/${id}`),

  generateInvoice: (id: string) =>
    api.post<ApiResponse<Invoice>>(`/work-orders/${id}/generate-invoice`),
};


// ─── Appointments API ───────────────────────────────────────────────────────

export const appointmentsApi = {
  getAll: (params?: PageOptions) =>
    api.get<ApiResponse<Appointment[]>>('/service-appointments', { params }),

  getById: (id: string) => api.get<ApiResponse<Appointment>>(`/service-appointments/${id}`),

  getMyAppointments: (params?: PageOptions & { date?: string; has_job_sheet?: string }) =>
    api.get<ApiResponse<Appointment[]>>('/service-appointments/my', { params }),

  create: (dto: {
    work_order_id: string;
    agent_id: string;
    scheduled_start: string;
    scheduled_end: string;
    notes?: string;
  }) => api.post<ApiResponse<Appointment>>('/service-appointments', dto),

  updateStatus: (id: string, status: string) =>
    api.patch<ApiResponse<Appointment>>(`/service-appointments/${id}/status`, { status }),

  uploadPhotos: (id: string, formData: FormData) =>
    api.post<ApiResponse<Appointment>>(`/service-appointments/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  uploadSignature: (id: string, formData: FormData) =>
    api.post<ApiResponse<Appointment>>(`/service-appointments/${id}/signature`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ─── User Documents API ─────────────────────────────────────────────────────

export const userDocumentsApi = {
  // Self-service endpoints — no special permissions required, just JWT auth
  getMyDocuments: () =>
    api.get<ApiResponse<UserDocument[]>>('/user-documents/my'),

  getById: (id: string) => api.get<ApiResponse<UserDocument>>(`/user-documents/my/${id}`),

  upload: (formData: FormData) =>
    api.post<ApiResponse<UserDocument>>('/user-documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id: string) => api.delete<ApiResponse<null>>(`/user-documents/my/${id}`),
};

// ─── Contacts API ───────────────────────────────────────────────────────────

export const contactsApi = {
  getAll: (params?: PageOptions) =>
    api.get<ApiResponse<Contact[]>>('/contacts', { params }),

  // Returns all contacts with no pagination limit — use for picker modals and caching
  getAllNonPaginated: () =>
    api.get<ApiResponse<Contact[]>>('/contacts/all'),

  getById: (id: string) =>
    api.get<ApiResponse<Contact>>(`/contacts/${id}`),

  create: (dto: Partial<Contact>) =>
    api.post<ApiResponse<Contact>>('/contacts', dto),

  update: (id: string, dto: Partial<Contact>) =>
    api.put<ApiResponse<Contact>>(`/contacts/${id}`, dto),
};

// ─── Companies API ──────────────────────────────────────────────────────────

export const companiesApi = {
  getAll: (params?: PageOptions) =>
    api.get<ApiResponse<Company[]>>('/companies', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Company>>(`/companies/${id}`),
};

// ─── Service Locations API ──────────────────────────────────────────────────

export const serviceLocationsApi = {
  getAll: (params?: PageOptions) =>
    api.get<ApiResponse<ServiceLocation[]>>('/service-locations', { params }),

  // Returns all service locations with no pagination limit
  getAllNonPaginated: () =>
    api.get<ApiResponse<ServiceLocation[]>>('/service-locations/all'),

  getById: (id: string) =>
    api.get<ApiResponse<ServiceLocation>>(`/service-locations/${id}`),

  getByContact: (contactId: string) =>
    api.get<ApiResponse<ServiceLocation[]>>(`/service-locations/by-contact/${contactId}`),

  getByCompany: (companyId: string) =>
    api.get<ApiResponse<ServiceLocation[]>>(`/service-locations/by-company/${companyId}`),
};

// ─── Assets API ─────────────────────────────────────────────────────────────

export const assetsApi = {
  getAll: (params?: PageOptions) =>
    api.get<ApiResponse<Asset[]>>('/assets', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Asset>>(`/assets/${id}`),

  getServiceHistory: (id: string, params?: PageOptions) =>
    api.get<ApiResponse<WorkOrder[]>>(`/assets/${id}/work-orders`, { params }),

  create: (dto: {
    name: string;
    manufacturer?: string;
    model?: string;
    serial_number?: string;
    category?: string;
    install_date?: string;
    warranty_expiry?: string;
    health_score?: number;
    contact_id?: string;
    notes?: string;
  }) => api.post<ApiResponse<Asset>>('/assets', dto),
};

// ─── Maintenance Plans API ──────────────────────────────────────────────────

export const maintenancePlansApi = {
  getByAsset: (assetId: string) =>
    api.get<ApiResponse<AssetMaintenancePlan[]>>(`/asset-maintenance-plans/asset/${assetId}`),

  getById: (id: string) =>
    api.get<ApiResponse<AssetMaintenancePlan>>(`/asset-maintenance-plans/${id}`),
};

// ─── Parts Catalog API ──────────────────────────────────────────────────────

export const partsCatalogApi = {
  getAll: (params?: PageOptions) =>
    api.get<ApiResponse<PartsCatalogItem[]>>('/parts-catalog', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<PartsCatalogItem>>(`/parts-catalog/${id}`),

  create: (dto: {
    name: string;
    sku?: string;
    description?: string;
    unit_price?: number;
    stock_qty?: number;
    reorder_level?: number;
    supplier?: string;
    category?: string;
    is_active?: boolean;
  }) => api.post<ApiResponse<PartsCatalogItem>>('/parts-catalog', dto),

  update: (id: string, dto: {
    name?: string;
    sku?: string;
    description?: string;
    unit_price?: number;
    stock_qty?: number;
    reorder_level?: number;
    supplier?: string;
    category?: string;
    is_active?: boolean;
  }) => api.put<ApiResponse<PartsCatalogItem>>(`/parts-catalog/${id}`, dto),
};

// ─── Services Catalog API ───────────────────────────────────────────────────

export const servicesCatalogApi = {
  getAll: (params?: PageOptions) =>
    api.get<ApiResponse<ServiceCatalogItem[]>>('/services-catalog', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<ServiceCatalogItem>>(`/services-catalog/${id}`),

  create: (dto: {
    name: string;
    description?: string;
    default_price?: number;
    tax_rate?: number;
    duration_minutes?: number;
    category?: string;
    is_active?: boolean;
  }) => api.post<ApiResponse<ServiceCatalogItem>>('/services-catalog', dto),

  update: (id: string, dto: {
    name?: string;
    description?: string;
    default_price?: number;
    tax_rate?: number;
    duration_minutes?: number;
    category?: string;
    is_active?: boolean;
  }) => api.put<ApiResponse<ServiceCatalogItem>>(`/services-catalog/${id}`, dto),
};

// ─── Service Requests API ───────────────────────────────────────────────────

export const serviceRequestsApi = {
  getAll: (params?: PageOptions & { search?: string; status?: string }) =>
    api.get<ApiResponse<ServiceRequest[]>>('/service-requests', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<ServiceRequest>>(`/service-requests/${id}`),

  create: (dto: {
    subject: string;
    description?: string;
    priority: string;
    category?: string;
    channel: string;
    contact_id?: string;
  }) => api.post<ApiResponse<ServiceRequest>>('/service-requests', dto),

  updateStatus: (id: string, status: string) =>
    api.patch<ApiResponse<ServiceRequest>>(`/service-requests/${id}/status`, { status }),

  // Attachments uploaded against this service request (request_attachments).
  getAttachments: (requestId: string) =>
    api.get<ApiResponse<RequestAttachment[]>>(`/attachments/${requestId}`),
};

// ─── Service Agreements API ──────────────────────────────────────────────────

export const serviceAgreementsApi = {
  getAll: (params?: PageOptions) =>
    api.get<ApiResponse<ServiceAgreement[]>>('/service-agreements', { params }),

  getAllNonPaginated: () =>
    api.get<ApiResponse<ServiceAgreement[]>>('/service-agreements/all'),

  getById: (id: string) =>
    api.get<ApiResponse<ServiceAgreement>>(`/service-agreements/${id}`),
};

// ─── Estimates API ──────────────────────────────────────────────────────────

export const estimatesApi = {
  getAll: (params?: PageOptions) =>
    api.get<ApiResponse<Estimate[]>>('/estimates', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Estimate>>(`/estimates/${id}`),

  getByWorkOrder: (workOrderId: string) =>
    api.get<ApiResponse<Estimate[]>>(`/estimates/work-order/${workOrderId}`),

  create: (dto: {
    contact_id?: string;
    request_id?: string;
    work_order_id?: string;
    notes?: string;
    expiry_date?: string;
    subtotal?: number;
    tax?: number;
    discount?: number;
    total?: number;
  }) => api.post<ApiResponse<Estimate>>('/estimates', dto),

  updateStatus: (id: string, status: string) =>
    api.patch<ApiResponse<Estimate>>(`/estimates/${id}/status`, { status }),

  send: (id: string) =>
    api.post<ApiResponse<Estimate>>(`/estimates/${id}/send`),

  approve: (id: string, signatureUrl?: string) =>
    api.post<ApiResponse<Estimate>>(`/estimates/${id}/approve`, signatureUrl ? { signature_url: signatureUrl } : {}),

  reject: (id: string, reason?: string) =>
    api.post<ApiResponse<Estimate>>(`/estimates/${id}/reject`, reason ? { reason } : {}),

  submitForApproval: (id: string) =>
    api.post<ApiResponse<Estimate>>(`/estimates/${id}/submit-for-approval`),

  adminApprove: (id: string) =>
    api.post<ApiResponse<Estimate>>(`/estimates/${id}/admin-approve`),

  adminReject: (id: string, reason?: string) =>
    api.post<ApiResponse<Estimate>>(`/estimates/${id}/admin-reject`, { reason }),

  generateInvoice: (id: string) =>
    api.post<ApiResponse<Invoice>>(`/estimates/${id}/generate-invoice`),

  convertToWorkOrder: (id: string) =>
    api.post<ApiResponse<unknown>>(`/estimates/${id}/convert-to-work-order`),
};

// ─── Estimate Line Items API ─────────────────────────────────────────────────

export const estimateLineItemsApi = {
  create: (dto: {
    estimate_id: string;
    type?: 'service' | 'part' | 'travel';
    name: string;
    description?: string;
    quantity?: number;
    unit_price?: number;
    tax_rate?: number;
    discount?: number;
    total?: number;
    sort_order?: number;
  }) => api.post<ApiResponse<EstimateLineItem>>('/estimate-line-items', dto),

  getByEstimate: (estimateId: string) =>
    api.get<ApiResponse<EstimateLineItem[]>>(`/estimate-line-items/estimate/${estimateId}`),
};

// ─── Timesheet API ──────────────────────────────────────────────────────────
//
// The server has no dedicated clock-in/out endpoints. Clock-in is modelled as
// POST /timesheets with clock_in = now and no clock_out; clock-out is
// PUT /timesheets/:id with clock_out = now.  The active timesheet ID must be
// persisted locally (AsyncStorage) because there is no GET /timesheets/current.

export const timesheetApi = {
  /**
   * Clock in: creates a new timesheet row with clock_in = now.
   * The caller must persist the returned id in AsyncStorage.
   */
  clockIn: (userId: string, data?: { notes?: string; appointment_id?: string; work_order_id?: string }) =>
    api.post<ApiResponse<Timesheet>>('/timesheets', {
      user_id: userId,
      clock_in: new Date().toISOString(),
      ...data,
    }),

  /**
   * Clock out: updates the active timesheet with clock_out = now.
   * @param id  The id returned by clockIn, stored in AsyncStorage.
   */
  clockOut: (id: string, data?: { notes?: string }) =>
    api.put<ApiResponse<Timesheet>>(`/timesheets/${id}`, {
      clock_out: new Date().toISOString(),
      ...data,
    }),

  /** Fetch a single timesheet by id (used to verify the locally-stored active entry). */
  getById: (id: string) =>
    api.get<ApiResponse<Timesheet>>(`/timesheets/${id}`),

  /** Fetch all timesheets for a specific user (paginated). */
  getByUser: (userId: string, params?: PageOptions) =>
    api.get<ApiResponse<Timesheet[]>>(`/timesheets/user/${userId}`, { params }),

  /**
   * Create a fully manual entry where both clock_in and clock_out are supplied.
   * These entries go into 'pending' status and require manager approval.
   */
  createManual: (
    userId: string,
    data: { clock_in: string; clock_out: string; notes?: string },
  ) =>
    api.post<ApiResponse<Timesheet>>('/timesheets', {
      user_id: userId,
      ...data,
    }),
};

// ─── Work Order Notes API ────────────────────────────────────────────────────

export const workOrderNotesApi = {
  getByWorkOrder: (workOrderId: string) =>
    api.get<ApiResponse<WorkOrderNote[]>>(`/work-order-notes/work-order/${workOrderId}`),

  create: (dto: { work_order_id: string; content: string; is_internal?: boolean }) =>
    api.post<ApiResponse<WorkOrderNote>>('/work-order-notes', dto),

  update: (id: string, dto: { content?: string; is_internal?: boolean }) =>
    api.put<ApiResponse<WorkOrderNote>>(`/work-order-notes/${id}`, dto),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/work-order-notes/${id}`),
};

// ─── Work Order Attachments API ──────────────────────────────────────────────

export const workOrderAttachmentsApi = {
  getByWorkOrder: (workOrderId: string) =>
    api.get<ApiResponse<WorkOrderAttachment[]>>(`/work-order-attachments/work-order/${workOrderId}`),

  create: (dto: { work_order_id: string; file_url: string; file_name: string; file_type?: string; file_size?: number }) =>
    api.post<ApiResponse<WorkOrderAttachment>>('/work-order-attachments', dto),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/work-order-attachments/${id}`),
};

// ─── Work Order Line Items API ───────────────────────────────────────────────

export const workOrderLineItemsApi = {
  getByWorkOrder: (workOrderId: string) =>
    api.get<ApiResponse<WorkOrderLineItem[]>>(`/work-order-line-items/work-order/${workOrderId}`),

  create: (dto: {
    work_order_id: string;
    type?: 'service' | 'part' | 'travel';
    name: string;
    description?: string;
    quantity?: number;
    unit_price?: number;
    tax_rate?: number;
    discount?: number;
    total?: number;
    sort_order?: number;
  }) => api.post<ApiResponse<WorkOrderLineItem>>('/work-order-line-items', dto),

  update: (id: string, dto: {
    type?: 'service' | 'part' | 'travel';
    name?: string;
    description?: string;
    quantity?: number;
    unit_price?: number;
    tax_rate?: number;
    discount?: number;
    total?: number;
  }) => api.put<ApiResponse<WorkOrderLineItem>>(`/work-order-line-items/${id}`, dto),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/work-order-line-items/${id}`),
};

// ─── Trips API ──────────────────────────────────────────────────────────────

export const tripsApi = {
  startTrip: (dto: {
    appointment_id: string;
    start_lat?: number;
    start_lng?: number;
  }) => api.post<ApiResponse<Trip>>('/trips/start', dto),

  endTrip: (id: string, dto: {
    end_lat?: number;
    end_lng?: number;
  }) => api.patch<ApiResponse<Trip>>(`/trips/${id}/end`, dto),

  getByAppointment: (appointmentId: string) =>
    api.get<ApiResponse<Trip[]>>(`/trips/appointment/${appointmentId}`),

  getActive: () => api.get<ApiResponse<Trip | null>>('/trips/active'),

  /** Fetch all trips belonging to the given user (paginated). */
  getByUser: (userId: string, params?: PageOptions) =>
    api.get<ApiResponse<Trip[]>>(`/trips/user/${userId}`, { params }),
};

// ─── Agent Locations API ─────────────────────────────────────────────────────

export const agentLocationsApi = {
  /**
   * Push the device's current GPS coordinates to the server.
   * Called by the GPS tracking service at regular intervals.
   */
  updateLocation: (dto: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
  }) => api.post<ApiResponse<null>>('/agent-locations', dto),

  /** Fetch live positions of all agents in the tenant. */
  getLive: (params?: PageOptions) =>
    api.get<ApiResponse<AgentLocation[]>>('/agent-locations/live', { params }),
};

// ─── Invoices API ────────────────────────────────────────────────────────────

export const invoicesApi = {
  getAll: (params?: PageOptions) =>
    api.get<ApiResponse<Invoice[]>>('/invoices', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Invoice>>(`/invoices/${id}`),

  getByWorkOrder: (workOrderId: string) =>
    api.get<ApiResponse<Invoice[]>>(`/invoices/work-order/${workOrderId}`),

  updateStatus: (id: string, status: string) =>
    api.patch<ApiResponse<Invoice>>(`/invoices/${id}/status`, { status }),

  // Persist the customer's on-screen signature against the invoice.
  saveSignature: (id: string, signatureUrl: string, signedByName?: string) =>
    api.post<ApiResponse<Invoice>>(`/invoices/${id}/signature`, {
      signature_url: signatureUrl,
      ...(signedByName ? { signed_by_name: signedByName } : {}),
    }),

  // Submit the invoice into the approval chain (Step 8).
  submitForApproval: (id: string) =>
    api.post<ApiResponse<Invoice>>(`/invoices/${id}/submit-for-approval`),

  create: (dto: {
    work_order_id?: string;
    service_request_id?: string;
    contact_id?: string;
    total?: number;
    subtotal?: number;
    tax?: number;
    discount?: number;
    due_date?: string;
    currency?: string;
    notes?: string;
  }) => api.post<ApiResponse<Invoice>>('/invoices', dto),
};

// ─── Invoice Line Items API ──────────────────────────────────────────────────

export const invoiceLineItemsApi = {
  create: (dto: {
    invoice_id: string;
    type?: 'service' | 'part' | 'travel' | 'other';
    name: string;
    description?: string;
    quantity?: number;
    unit_price?: number;
    tax_rate?: number;
    discount?: number;
    total?: number;
  }) => api.post<ApiResponse<InvoiceLineItem>>('/invoice-line-items', dto),

  getByInvoice: (invoiceId: string) =>
    api.get<ApiResponse<InvoiceLineItem[]>>(`/invoice-line-items/invoice/${invoiceId}`),

  update: (id: string, dto: {
    type?: 'service' | 'part' | 'travel' | 'other';
    name?: string;
    description?: string;
    quantity?: number;
    unit_price?: number;
    tax_rate?: number;
    discount?: number;
    total?: number;
  }) => api.put<ApiResponse<InvoiceLineItem>>(`/invoice-line-items/${id}`, dto),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/invoice-line-items/${id}`),
};

// ─── Job Sheet Templates API ──────────────────────────────────────────────────

export const jobSheetTemplatesApi = {
  getAll: () =>
    api.get<ApiResponse<any[]>>('/job-sheet-templates/all'),
  getById: (id: string) =>
    api.get<ApiResponse<any>>(`/job-sheet-templates/${id}`),
};

// ─── Job Sheet Instances API ──────────────────────────────────────────────────

export const jobSheetInstancesApi = {
  getByAppointment: (appointmentId: string) =>
    api.get<ApiResponse<any[]>>(`/job-sheet-instances/appointment/${appointmentId}`),

  getByWorkOrder: (workOrderId: string) =>
    api.get<ApiResponse<any[]>>(`/job-sheet-instances/work-order/${workOrderId}`),

  getById: (id: string) =>
    api.get<ApiResponse<any>>(`/job-sheet-instances/${id}`),

  create: (dto: { template_id: string; appointment_id?: string; work_order_id?: string; status?: string; custom_fields?: Record<string, any> }) =>
    api.post<ApiResponse<any>>('/job-sheet-instances', dto),

  update: (id: string, dto: { status?: string; custom_fields?: Record<string, any> }) =>
    api.put<ApiResponse<any>>(`/job-sheet-instances/${id}`, dto),
};

// ─── Job Sheet Items API ──────────────────────────────────────────────────

export const jobSheetItemsApi = {
  getByInstance: (instanceId: string) =>
    api.get<ApiResponse<any[]>>(`/job-sheet-items/instance/${instanceId}`),

  update: (id: string, dto: { value?: string | null; photo_url?: string | null; custom_fields?: Record<string, any> }) =>
    api.put<ApiResponse<any>>(`/job-sheet-items/${id}`, dto),
};

// ─── Payments API ───────────────────────────────────────────────────────────

export const paymentsApi = {
  getAll: (params?: PageOptions) =>
    api.get<ApiResponse<Payment[]>>('/payments', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Payment>>(`/payments/${id}`),

  getByInvoice: (invoiceId: string) =>
    api.get<ApiResponse<Payment[]>>(`/payments/invoice/${invoiceId}`),

  create: (dto: {
    invoice_id: string;
    amount: number;
    method: string;
    gateway_transaction_id?: string;
    status?: string;
    paid_at?: string;
    notes?: string;
  }) => api.post<ApiResponse<Payment>>('/payments', dto),

  // Stripe Terminal specific
  createStripeConnectionToken: () =>
    api.post<ApiResponse<{ secret: string }>>('/payments/stripe/connection-token'),

  createStripePaymentIntent: (dto: {
    amount: number;
    currency?: string;
    metadata?: Record<string, string>;
  }) => api.post<ApiResponse<any>>('/payments/stripe/create-intent', dto),

  // Razorpay
  createRazorpayOrder: (dto: {
    amount: number;
    currency?: string;
    invoice_id?: string;
    appointment_id?: string;
  }) => api.post<ApiResponse<{ order_id: string; amount: number; currency: string; key_id: string; mock?: boolean }>>('/payments/razorpay/create-order', dto),

  verifyRazorpayPayment: (dto: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    invoice_id: string;
    amount: number;
  }) => api.post<ApiResponse<Payment>>('/payments/razorpay/verify', dto),

  // UPI
  getUpiConfig: () =>
    api.get<ApiResponse<{ configured: boolean; vpa?: string; name?: string }>>('/payments/upi/config'),
};

// ─── Tenant payment settings (Step 12) ───────────────────────────────────────

export interface TenantPaymentConfig {
  upi_vpa?: string;
  upi_name?: string;
  qr_image_url?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  bank_name?: string;
  instructions?: string;
}

export const tenantPaymentApi = {
  getPaymentSettings: () =>
    api.get<ApiResponse<TenantPaymentConfig>>('/tenants/me/payment-settings'),
};

// ─── Notifications API ───────────────────────────────────────────────────────

export const notificationsApi = {
  getAll: (params?: PageOptions) =>
    api.get<ApiResponse<Notification[]>>('/notifications', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Notification>>(`/notifications/${id}`),

  getUnread: () =>
    api.get<ApiResponse<Notification[]>>('/notifications/unread'),

  markAsRead: (id: string) =>
    api.patch<ApiResponse<Notification>>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.patch<ApiResponse<null>>('/notifications/mark-all-read', {}),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/notifications/${id}`),
};

// ─── Communications API ──────────────────────────────────────────────────────

export const communicationsApi = {
  getAll: (params?: PageOptions) =>
    api.get<ApiResponse<Communication[]>>('/communication', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Communication>>(`/communication/${id}`),

  getByContactId: (contactId: string) =>
    api.get<ApiResponse<Communication[]>>(`/communication/contact/${contactId}`),

  create: (dto: {
    contact_id: string;
    channel: string;
    direction: string;
    subject?: string;
    body: string;
  }) => api.post<ApiResponse<Communication>>('/communication', dto),

  update: (id: string, dto: {
    subject?: string;
    body?: string;
    status?: string;
  }) => api.put<ApiResponse<Communication>>(`/communication/${id}`, dto),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/communication/${id}`),
};

// ─── Reports API ─────────────────────────────────────────────────────────────

export const reportsApi = {
  getWorkOrderReport: (params?: Record<string, any>) =>
    api.get<ApiResponse<any>>('/reports/work-orders', { params }),

  getInvoiceReport: (params?: Record<string, any>) =>
    api.get<ApiResponse<any>>('/reports/invoices', { params }),

  getTimesheetReport: (params?: Record<string, any>) =>
    api.get<ApiResponse<any>>('/reports/timesheets', { params }),

  getPerformanceReport: (params?: Record<string, any>) =>
    api.get<ApiResponse<any>>('/reports/performance', { params }),
};

// ─── Audit Logs API ──────────────────────────────────────────────────────────

export interface MobileAuditLogPayload {
  action: string;
  module: string;
  record_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
}

export const auditLogsApi = {
  create: (payload: MobileAuditLogPayload) =>
    api.post<ApiResponse<null>>('/audit-logs', payload),
};

// ─── Reviews API ──────────────────────────────────────────────────────────────

export const reviewsApi = {
  create: (dto: {
    work_order_id: string;
    contact_id?: string;
    rating: number;
    comment?: string;
    platform?: 'internal' | 'google' | 'yelp';
  }) => api.post<ApiResponse<any>>('/reviews', dto),

  getByWorkOrder: (workOrderId: string) =>
    api.get<ApiResponse<any[]>>(`/reviews/work-order/${workOrderId}`),
};

// ─── Voice API ──────────────────────────────────────────────────────────────

export const voiceApi = {
  transcribe: (formData: FormData) =>
    api.post<ApiResponse<any>>('/voice/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ─── Document Approvals API ──────────────────────────────────────────────────

export const documentApprovalsApi = {
  getByDocument: (documentId: string) =>
    api.get<ApiResponse<any[]>>(`/document-approvals/document/${documentId}`),

  process: (id: string, dto: { action: 'APPROVE' | 'REJECT'; comments?: string }) =>
    api.post<ApiResponse<any>>(`/document-approvals/${id}/process`, dto),
};
