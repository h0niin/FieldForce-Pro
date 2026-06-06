import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { Template } from '@/types/models.types';

export interface CreateTemplatePayload {
  type: string;
  name: string;
  content: Record<string, unknown>;
  is_default?: boolean;
}

export interface UpdateTemplatePayload {
  name?: string;
  content?: Record<string, unknown>;
  is_default?: boolean;
}

export const templatesApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<Template[]>>('/templates', { params });
  },

  getByType(type: string) {
    return api.get<ApiResponse<Template[]>>(`/templates/type/${type}`);
  },

  getById(id: string) {
    return api.get<ApiResponse<Template>>(`/templates/${id}`);
  },

  create(payload: CreateTemplatePayload) {
    return api.post<ApiResponse<Template>>('/templates', payload);
  },

  update(id: string, payload: UpdateTemplatePayload) {
    return api.put<ApiResponse<Template>>(`/templates/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/templates/${id}`);
  },
};
