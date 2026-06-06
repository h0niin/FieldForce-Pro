import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { Timesheet } from '@/types/models.types';

export interface CreateTimesheetPayload {
  user_id: string;
  appointment_id?: string;
  work_order_id?: string;
  clock_in: string;
  clock_out?: string;
  travel_time_minutes?: number;
  work_time_minutes?: number;
  break_time_minutes?: number;
  is_billable?: boolean;
  notes?: string;
  custom_fields?: Record<string, unknown>;
}

export interface UpdateTimesheetPayload {
  clock_in?: string;
  clock_out?: string;
  travel_time_minutes?: number;
  work_time_minutes?: number;
  break_time_minutes?: number;
  is_billable?: boolean;
  notes?: string;
  custom_fields?: Record<string, unknown>;
}

export const timesheetsApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<Timesheet[]>>('/timesheets', { params });
  },

  getAllNonPaginated() {
    return api.get<ApiResponse<Timesheet[]>>('/timesheets/all');
  },

  getById(id: string) {
    return api.get<ApiResponse<Timesheet>>(`/timesheets/${id}`);
  },

  getByUserId(userId: string) {
    return api.get<ApiResponse<Timesheet[]>>(`/timesheets/user/${userId}`);
  },

  create(payload: CreateTimesheetPayload) {
    return api.post<ApiResponse<Timesheet>>('/timesheets', payload);
  },

  update(id: string, payload: UpdateTimesheetPayload) {
    return api.put<ApiResponse<Timesheet>>(`/timesheets/${id}`, payload);
  },

  approve(id: string) {
    return api.patch<ApiResponse<Timesheet>>(`/timesheets/${id}/approve`);
  },

  reject(id: string) {
    return api.patch<ApiResponse<Timesheet>>(`/timesheets/${id}/reject`);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/timesheets/${id}`);
  },
};
