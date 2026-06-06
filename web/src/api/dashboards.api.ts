import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { Dashboard } from '@/types/models.types';

export interface CreateDashboardPayload {
  name: string;
  widgets?: Record<string, unknown>[];
  is_default?: boolean;
}

export interface UpdateDashboardPayload {
  name?: string;
  widgets?: Record<string, unknown>[];
  is_default?: boolean;
}

export const dashboardsApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<Dashboard[]>>('/dashboards', { params });
  },

  getById(id: string) {
    return api.get<ApiResponse<Dashboard>>(`/dashboards/${id}`);
  },

  getByUserId(userId: string) {
    return api.get<ApiResponse<Dashboard[]>>(`/dashboards/user/${userId}`);
  },

  create(payload: CreateDashboardPayload) {
    return api.post<ApiResponse<Dashboard>>('/dashboards', payload);
  },

  update(id: string, payload: UpdateDashboardPayload) {
    return api.put<ApiResponse<Dashboard>>(`/dashboards/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/dashboards/${id}`);
  },

  getStats() {
    return api.get<ApiResponse<any>>('/dashboards/stats');
  },

  getActivityFeed() {
    return api.get<ApiResponse<any>>('/dashboards/activity-feed');
  },

  getPrioritySummary() {
    return api.get<ApiResponse<any>>('/dashboards/priority-summary');
  },
};
