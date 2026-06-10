import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { WorkOrder } from '@/types/models.types';

export interface CreateWorkOrderPayload {
  summary: string;
  description?: string;
  contact_id?: string;
  location_id?: string;
  asset_id?: string;
  priority?: string;
  category?: string;
  scheduled_start?: string;
  assigned_to?: string;
  tags?: string[];
  custom_fields?: Record<string, unknown>;
}

export interface UpdateWorkOrderPayload {
  summary?: string;
  description?: string;
  contact_id?: string;
  location_id?: string;
  asset_id?: string;
  priority?: string;
  category?: string;
  scheduled_start?: string;
  assigned_to?: string;
  tags?: string[];
  custom_fields?: Record<string, unknown>;
}

export const workOrdersApi = {
  getAll(params?: PageOptions & { status?: string, contact_id?: string, company_id?: string, asset_id?: string }) {
    return api.get<ApiResponse<WorkOrder[]>>('/work-orders', { params });
  },

  getAllNonPaginated() {
    return api.get<ApiResponse<WorkOrder[]>>('/work-orders/all');
  },

  getMyWorkOrders(params?: PageOptions) {
    return api.get<ApiResponse<WorkOrder[]>>('/work-orders/my', { params });
  },

  getById(id: string) {
    return api.get<ApiResponse<WorkOrder>>(`/work-orders/${id}`);
  },

  create(payload: CreateWorkOrderPayload) {
    return api.post<ApiResponse<WorkOrder>>('/work-orders', payload);
  },

  update(id: string, payload: UpdateWorkOrderPayload) {
    return api.put<ApiResponse<WorkOrder>>(`/work-orders/${id}`, payload);
  },

  updateStatus(id: string, status: string) {
    return api.patch<ApiResponse<WorkOrder>>(`/work-orders/${id}/status`, { status });
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/work-orders/${id}`);
  },

  submitForApproval(id: string, payload: { workflow_id: string; due_date?: string }) {
    return api.post<ApiResponse<unknown>>(`/work-orders/${id}/submit-for-approval`, payload);
  },

  getMyJobs(params?: PageOptions & { status?: string }) {
    return api.get<ApiResponse<WorkOrder[]>>('/work-orders/my-jobs', { params });
  },

  acceptJob(id: string) {
    return api.post<ApiResponse<WorkOrder>>(`/work-orders/${id}/accept`);
  },

  declineJob(id: string, reason: string) {
    return api.post<ApiResponse<WorkOrder>>(`/work-orders/${id}/decline`, { reason });
  },
};
