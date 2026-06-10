import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { ServiceRequest } from '@/types/models.types';

export interface CreateServiceRequestPayload {
  subject: string;
  scheduled_start: string;
  description?: string;
  contact_id?: string;
  location_id?: string;
  priority?: string;
  category?: string;
  channel?: string;
  assigned_to?: string;
  technician_ids?: string[];
  lat?: number;
  lng?: number;
}

export interface UpdateServiceRequestPayload {
  subject?: string;
  scheduled_start?: string;
  description?: string;
  contact_id?: string;
  location_id?: string;
  priority?: string;
  category?: string;
  channel?: string;
  assigned_to?: string;
  technician_ids?: string[];
  lat?: number;
  lng?: number;
}

export const serviceRequestsApi = {
  getAll(params?: PageOptions & { status?: string, contact_id?: string, company_id?: string, asset_id?: string }) {
    return api.get<ApiResponse<ServiceRequest[]>>('/service-requests', { params });
  },

  getAllNonPaginated() {
    return api.get<ApiResponse<ServiceRequest[]>>('/service-requests/all');
  },

  getMyPendingApprovals(params?: PageOptions) {
    return api.get<ApiResponse<ServiceRequest[]>>('/service-requests/my-approvals', { params });
  },

  getById(id: string) {
    return api.get<ApiResponse<ServiceRequest>>(`/service-requests/${id}`);
  },

  create(payload: CreateServiceRequestPayload) {
    return api.post<ApiResponse<ServiceRequest>>('/service-requests', payload);
  },

  update(id: string, payload: UpdateServiceRequestPayload) {
    return api.put<ApiResponse<ServiceRequest>>(`/service-requests/${id}`, payload);
  },

  updateStatus(id: string, status: string) {
    return api.patch<ApiResponse<ServiceRequest>>(`/service-requests/${id}/status`, { status });
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/service-requests/${id}`);
  },

  getApprovals(id: string) {
    return api.get<ApiResponse<unknown[]>>(`/service-requests/${id}/approvals`);
  },

  processApproval(serviceRequestId: string, approvalId: string, payload: { action: string; comments?: string }) {
    return api.post<ApiResponse<unknown>>(`/service-requests/${serviceRequestId}/approvals/${approvalId}/process`, payload);
  },

  getQueue() {
    return api.get<ApiResponse<ServiceRequest[]>>('/queue');
  },

  updatePriority(id: string, priority: string) {
    return api.patch<ApiResponse<ServiceRequest>>(`/queue/${id}/priority`, { priority });
  },

  assignTechnician(id: string, technicianId: string, technicianName: string) {
    return api.patch<ApiResponse<ServiceRequest>>(`/service-requests/${id}/assign`, {
      technician_id: technicianId,
      technician_name: technicianName,
    });
  },

  convertToWorkOrder(id: string) {
    return api.post<ApiResponse<{ workOrder: { id: string; wo_number: string }; serviceRequest: ServiceRequest }>>(`/service-requests/${id}/convert-to-work-order`);
  },

  approveAndConvert(id: string) {
    return api.post<ApiResponse<{ workOrder: { id: string; wo_number: string }; serviceRequest: ServiceRequest }>>(`/service-requests/${id}/approve-and-convert`);
  },
};
