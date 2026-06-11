import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { CustomField } from '@/types/models.types';

export interface CreateCustomFieldPayload {
  module: string;
  field_name: string;
  field_label?: string;
  field_type: string;
  options?: Record<string, unknown>;
  is_required?: boolean;
  sort_order?: number;
  section_name?: string;
  section_order?: number;
  is_system?: boolean;
  is_visible?: boolean;
  char_limit?: number;
  is_pii?: boolean;
  is_encrypted?: boolean;
}

export interface UpdateCustomFieldPayload {
  field_name?: string;
  field_label?: string;
  field_type?: string;
  options?: Record<string, unknown>;
  is_required?: boolean;
  sort_order?: number;
  section_name?: string;
  section_order?: number;
  is_visible?: boolean;
  char_limit?: number;
  is_pii?: boolean;
  is_encrypted?: boolean;
}

export interface BatchUpdateFieldItem {
  id: string;
  field_label?: string;
  section_name?: string;
  section_order?: number;
  sort_order?: number;
  is_visible?: boolean;
  is_required?: boolean;
  char_limit?: number;
  is_pii?: boolean;
  is_encrypted?: boolean;
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

  batchUpdate(fields: BatchUpdateFieldItem[]) {
    return api.put<ApiResponse<{ updated: number }>>('/custom-fields/batch-update', { fields });
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/custom-fields/${id}`);
  },
};
