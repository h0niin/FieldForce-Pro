import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { CustomField } from '@/types/models.types';

export interface CreateCustomFieldPayload {
  module: string;
  field_name: string;
  field_type: string;
  options?: Record<string, unknown>;
  is_required?: boolean;
  sort_order?: number;
}

export interface UpdateCustomFieldPayload {
  field_name?: string;
  field_type?: string;
  options?: Record<string, unknown>;
  is_required?: boolean;
  sort_order?: number;
}

export const customFieldsApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<CustomField[]>>('/custom-fields', { params });
  },

  getByModule(module: string) {
    return api.get<ApiResponse<CustomField[]>>(`/custom-fields/module/${module}`);
  },

  getById(id: string) {
    return api.get<ApiResponse<CustomField>>(`/custom-fields/${id}`);
  },

  create(payload: CreateCustomFieldPayload) {
    return api.post<ApiResponse<CustomField>>('/custom-fields', payload);
  },

  update(id: string, payload: UpdateCustomFieldPayload) {
    return api.put<ApiResponse<CustomField>>(`/custom-fields/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/custom-fields/${id}`);
  },
};
