import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type {
  ServiceAppointment,
  ServiceAppointmentTrip,
  ServiceAppointmentNoteEntry,
} from '@/types/models.types';

export interface AppointmentListParams extends PageOptions {
  status?: string;
  excludeStatus?: string;
  hasPendingApproval?: string;
  unassigned?: string;
  scheduleType?: string;
  name?: string;
  dateFrom?: string;
  dateTo?: string;
  contact?: string;
  company?: string;
  email?: string;
}

export interface CreateAppointmentPayload {
  work_order_id: string;
  agent_id?: string;
  crew_id?: string;
  summary?: string;
  type?: string;
  schedule_type?: string;
  status?: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  due_date?: string;
  billing_status?: string;
  notes?: string;
  is_recurring?: boolean;
  recurrence_rule?: string;
  custom_fields?: Record<string, unknown>;
}

export interface UpdateAppointmentPayload {
  agent_id?: string;
  crew_id?: string;
  summary?: string;
  type?: string;
  schedule_type?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  due_date?: string;
  billing_status?: string;
  preferred_date_1?: string;
  preferred_date_2?: string;
  preferred_time?: string;
  notes?: string;
  is_recurring?: boolean;
  recurrence_rule?: string;
  custom_fields?: Record<string, unknown>;
}

export interface TripPayload {
  trip_date: string;
  start_location: string;
  end_location: string;
  departure_time?: string;
  arrival_time?: string;
  distance_km?: number;
  notes?: string;
}

export const appointmentsApi = {
  getAll(params?: AppointmentListParams) {
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

  // Trips (manual web entry)
  getTrips(appointmentId: string) {
    return api.get<ApiResponse<ServiceAppointmentTrip[]>>(`/service-appointments/${appointmentId}/trips`);
  },

  addTrip(appointmentId: string, payload: TripPayload) {
    return api.post<ApiResponse<ServiceAppointmentTrip>>(`/service-appointments/${appointmentId}/trips`, payload);
  },

  updateTrip(appointmentId: string, tripId: string, payload: Partial<TripPayload>) {
    return api.put<ApiResponse<ServiceAppointmentTrip>>(`/service-appointments/${appointmentId}/trips/${tripId}`, payload);
  },

  deleteTrip(appointmentId: string, tripId: string) {
    return api.delete<ApiResponse<null>>(`/service-appointments/${appointmentId}/trips/${tripId}`);
  },

  // Notes
  addNote(appointmentId: string, content: string) {
    return api.post<ApiResponse<ServiceAppointmentNoteEntry[]>>(`/service-appointments/${appointmentId}/notes`, { content });
  },
};
