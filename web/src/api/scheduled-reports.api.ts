import api from './axios-instance';
import { ScheduledReport } from '@/types/models.types';

export const scheduledReportsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<{ data: ScheduledReport[]; meta: any }>('/scheduled-reports', { params }),

  getById: (id: string) => api.get<{ data: ScheduledReport }>(`/scheduled-reports/${id}`),

  create: (data: Partial<ScheduledReport>) => api.post<{ data: ScheduledReport }>('/scheduled-reports', data),

  update: (id: string, data: Partial<ScheduledReport>) =>
    api.put<{ data: ScheduledReport }>(`/scheduled-reports/${id}`, data),

  delete: (id: string) => api.delete(`/scheduled-reports/${id}`),
};
