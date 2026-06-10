import axios from 'axios';
import api from './axios-instance';
import { API_URL } from '@/utils/constants';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { Estimate, Invoice } from '@/types/models.types';

const publicAxios = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export interface CreateEstimatePayload {
  contact_id?: string;
  request_id?: string;
  work_order_id?: string;
  notes?: string;
  expiry_date?: string;
  subtotal?: number;
  tax?: number;
  discount?: number;
  total?: number;
  custom_fields?: Record<string, unknown>;
  is_template?: boolean;
  template_name?: string;
}

export interface UpdateEstimatePayload {
  contact_id?: string;
  request_id?: string;
  notes?: string;
  expiry_date?: string;
  subtotal?: number;
  tax?: number;
  discount?: number;
  total?: number;
  custom_fields?: Record<string, unknown>;
}

export interface ConvertToWorkOrderPayload {
  assignedTo?: string;
  scheduledDate?: string;
  priority?: string;
  category?: string;
  locationId?: string;
}

export const estimatesApi = {
  getAll(params?: PageOptions & { status?: string; excludeStatus?: string; createdBy?: string; isTemplate?: boolean }) {
    return api.get<ApiResponse<Estimate[]>>('/estimates', { params });
  },

  getAllNonPaginated() {
    return api.get<ApiResponse<Estimate[]>>('/estimates/all');
  },

  getAssignedCreator() {
    return api.get<ApiResponse<{ creator_id: string | null }>>('/estimates/assigned-creator');
  },

  getMyDrafts(params?: PageOptions) {
    return api.get<ApiResponse<Estimate[]>>('/estimates/my-drafts', { params });
  },

  getMyApprovals(params?: PageOptions) {
    return api.get<ApiResponse<Estimate[]>>('/estimates/my-approvals', { params });
  },

  getById(id: string) {
    return api.get<ApiResponse<Estimate>>(`/estimates/${id}`);
  },

  create(payload: CreateEstimatePayload) {
    return api.post<ApiResponse<Estimate>>('/estimates', payload);
  },

  update(id: string, payload: UpdateEstimatePayload) {
    return api.put<ApiResponse<Estimate>>(`/estimates/${id}`, payload);
  },

  updateStatus(id: string, status: string) {
    return api.patch<ApiResponse<Estimate>>(`/estimates/${id}/status`, { status });
  },

  sendToCustomer(id: string) {
    return api.post<ApiResponse<Estimate>>(`/estimates/${id}/send`);
  },

  sendWhatsApp(id: string) {
    return api.post<ApiResponse<Estimate>>(`/estimates/${id}/send-whatsapp`);
  },

  createFromTemplate(templateId: string, payload?: Partial<CreateEstimatePayload>) {
    return api.post<ApiResponse<Estimate>>(`/estimates/create-from-template/${templateId}`, payload || {});
  },

  generateLink(id: string) {
    return api.post<ApiResponse<Estimate>>(`/estimates/${id}/generate-link`);
  },

  revertToDraft(id: string) {
    return api.post<ApiResponse<Estimate>>(`/estimates/${id}/revert-to-draft`);
  },

  recordApproval(id: string, signatureUrl?: string) {
    return api.post<ApiResponse<Estimate>>(`/estimates/${id}/approve`, { signature_url: signatureUrl });
  },

  recordRejection(id: string, reason?: string) {
    return api.post<ApiResponse<Estimate>>(`/estimates/${id}/reject`, { reason });
  },

  convertToWorkOrder(id: string, payload?: ConvertToWorkOrderPayload) {
    return api.post<ApiResponse<any>>(`/estimates/${id}/convert-to-work-order`, payload || {});
  },

  getByWorkOrderId(workOrderId: string) {
    return api.get<ApiResponse<Estimate[]>>(`/estimates/work-order/${workOrderId}`);
  },

  getByServiceRequestId(requestId: string) {
    return api.get<ApiResponse<Estimate[]>>(`/estimates/service-request/${requestId}`);
  },

  // ── On-site estimate approval flow ──────────────────────────────────────
  getPendingInternalApprovals(params?: PageOptions) {
    return api.get<ApiResponse<Estimate[]>>('/estimates/pending-internal', { params });
  },

  submitForInternalApproval(id: string) {
    return api.post<ApiResponse<Estimate>>(`/estimates/${id}/submit-for-internal-approval`);
  },

  internalApprove(id: string) {
    return api.post<ApiResponse<Estimate>>(`/estimates/${id}/internal-approve`);
  },

  internalReject(id: string, reason: string) {
    return api.post<ApiResponse<Estimate>>(`/estimates/${id}/internal-reject`, { reason });
  },

  submitForApproval(id: string) {
    return api.post<ApiResponse<Estimate>>(`/estimates/${id}/submit-for-approval`);
  },

  adminApprove(id: string) {
    return api.post<ApiResponse<Estimate>>(`/estimates/${id}/admin-approve`);
  },

  adminReject(id: string, reason?: string) {
    return api.post<ApiResponse<Estimate>>(`/estimates/${id}/admin-reject`, { reason });
  },

  generateInvoice(id: string) {
    return api.post<ApiResponse<Invoice>>(`/estimates/${id}/generate-invoice`);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/estimates/${id}`);
  },
};

export const estimatesPublicApi = {
  getByToken(token: string) {
    return publicAxios.get<ApiResponse<Estimate>>(`/estimates/public/${token}`);
  },
  sign(token: string, signatureDataUrl: string) {
    return publicAxios.post<ApiResponse<Estimate>>(`/estimates/public/${token}/sign`, {
      signature_data_url: signatureDataUrl,
    });
  },
  reject(token: string, reason?: string) {
    return publicAxios.post<ApiResponse<Estimate>>(`/estimates/public/${token}/reject`, { reason });
  },
  // On-site estimate customer approval endpoints
  customerApprove(token: string, customer_name: string, signature: string) {
    return publicAxios.post<ApiResponse<Estimate>>(`/estimates/public/${token}/approve`, { customer_name, signature });
  },
  customerReject(token: string, reason?: string) {
    return publicAxios.post<ApiResponse<Estimate>>(`/estimates/public/${token}/customer-reject`, { reason });
  },
};
