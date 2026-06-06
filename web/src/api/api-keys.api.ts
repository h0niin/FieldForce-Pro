import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';

export interface ApiKey {
  id: string;
  tenant_id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateApiKeyPayload {
  name: string;
  scopes?: string[];
  expires_at?: string;
}

export interface CreateApiKeyResponse extends ApiKey {
  raw_key: string;
}

export const apiKeysApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<ApiKey[]>>('/api-keys', { params });
  },

  getById(id: string) {
    return api.get<ApiResponse<ApiKey>>(`/api-keys/${id}`);
  },

  create(payload: CreateApiKeyPayload) {
    return api.post<ApiResponse<CreateApiKeyResponse>>('/api-keys', payload);
  },

  revoke(id: string) {
    return api.patch<ApiResponse<ApiKey>>(`/api-keys/${id}/revoke`);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/api-keys/${id}`);
  },
};
