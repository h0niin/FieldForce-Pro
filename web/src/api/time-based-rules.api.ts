import api from './axios-instance';
import { TimeBasedRule } from '@/types/models.types';

export const timeBasedRulesApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<{ data: TimeBasedRule[]; meta: any }>('/time-based-rules', { params }),

  getById: (id: string) => api.get<{ data: TimeBasedRule }>(`/time-based-rules/${id}`),

  create: (data: Partial<TimeBasedRule>) => api.post<{ data: TimeBasedRule }>('/time-based-rules', data),

  update: (id: string, data: Partial<TimeBasedRule>) =>
    api.put<{ data: TimeBasedRule }>(`/time-based-rules/${id}`, data),

  delete: (id: string) => api.delete(`/time-based-rules/${id}`),
};
