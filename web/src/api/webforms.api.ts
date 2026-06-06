import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { Webform } from '@/types/models.types';

export interface CreateWebformPayload {
  name: string;
  fields?: Record<string, unknown>[];
  styling?: Record<string, unknown>;
  redirect_url?: string;
  is_active?: boolean;
}

export interface UpdateWebformPayload {
  name?: string;
  fields?: Record<string, unknown>[];
  styling?: Record<string, unknown>;
  redirect_url?: string;
  is_active?: boolean;
}

export const webformsApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<Webform[]>>('/webforms', { params });
  },

  getById(id: string) {
    return api.get<ApiResponse<Webform>>(`/webforms/${id}`);
  },

  create(payload: CreateWebformPayload) {
    return api.post<ApiResponse<Webform>>('/webforms', payload);
  },

  update(id: string, payload: UpdateWebformPayload) {
    return api.put<ApiResponse<Webform>>(`/webforms/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/webforms/${id}`);
  },
};
