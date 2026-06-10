import api from './axios-instance';
import { AutomationAction } from '@/types/models.types';

export const automationActionsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<{ data: AutomationAction[]; meta: any }>('/automation-actions', { params }),

  getById: (id: string) => api.get<{ data: AutomationAction }>(`/automation-actions/${id}`),

  create: (data: Partial<AutomationAction>) => api.post<{ data: AutomationAction }>('/automation-actions', data),

  update: (id: string, data: Partial<AutomationAction>) =>
    api.put<{ data: AutomationAction }>(`/automation-actions/${id}`, data),

  delete: (id: string) => api.delete(`/automation-actions/${id}`),
};
