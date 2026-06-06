import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { ServiceAppointment } from '@/types/models.types';

export interface CreateAppointmentPayload {
  work_order_id: string;
  agent_id: string;
  crew_id?: string;
  scheduled_start: string;
  scheduled_end: string;
  notes?: string;
  is_recurring?: boolean;
  recurrence_rule?: string;
  custom_fields?: Record<string, unknown>;
}

export interface UpdateAppointmentPayload {
  agent_id?: string;
  crew_id?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  notes?: string;
  is_recurring?: boolean;
  recurrence_rule?: string;
  custom_fields?: Record<string, unknown>;
}

export const appointmentsApi = {
  getAll(params?: PageOptions & { status?: string; excludeStatus?: string; hasPendingApproval?: string; unassigned?: string }) {
    return api.get<ApiResponse<ServiceAppointment[]>>('/service-appointments', { params });
  },

  getScheduleAssigner() {
    return api.get<ApiResponse<{ assigner_id: string | null }>>('/service-appointments/schedule-assigner');
  },

  getAllNonPaginated() {
    return api.get<ApiResponse<ServiceAppointment[]>>('/service-appointments/all');
  },

  getMy() {
    return api.get<ApiResponse<ServiceAppointment[]>>('/service-appointments/my');
  },

  getById(id: string) {
    return api.get<ApiResponse<ServiceAppointment>>(`/service-appointments/${id}`);
  },

  getByWorkOrderId(workOrderId: string) {
    return api.get<ApiResponse<ServiceAppointment[]>>(`/service-appointments/work-order/${workOrderId}`);
  },

  create(payload: CreateAppointmentPayload) {
    return api.post<ApiResponse<ServiceAppointment>>('/service-appointments', payload);
  },

  update(id: string, payload: UpdateAppointmentPayload) {
    return api.put<ApiResponse<ServiceAppointment>>(`/service-appointments/${id}`, payload);
  },

  assignTechnician(id: string, agentId: string) {
    return api.patch<ApiResponse<ServiceAppointment>>(`/service-appointments/${id}/assign`, { agent_id: agentId });
  },

  updateStatus(id: string, status: string) {
    return api.patch<ApiResponse<ServiceAppointment>>(`/service-appointments/${id}/status`, { status });
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/service-appointments/${id}`);
  },

  getMyPendingApprovals(params?: PageOptions) {
    return api.get<ApiResponse<ServiceAppointment[]>>('/service-appointments/my-approvals', { params });
  },

  getApprovals(id: string) {
    return api.get<ApiResponse<unknown[]>>(`/service-appointments/${id}/approvals`);
  },

  processApproval(appointmentId: string, approvalId: string, payload: { action: string; comments?: string }) {
    return api.post<ApiResponse<unknown>>(`/service-appointments/${appointmentId}/approvals/${approvalId}/process`, payload);
  },
};
