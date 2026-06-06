import api from './axios-instance';
import { ApiResponse } from '@/types/api.types';

export interface SuperAdminApiKey {
  id: string;
  key_name: string;
  is_active: boolean;
  last_used_at?: string;
  expires_at?: string;
  created_at: string;
  api_key?: string; // Only present on creation
}

export const superAdminApiKeysApi = {
  listKeys: async (): Promise<SuperAdminApiKey[]> => {
    const res = await api.get<ApiResponse<SuperAdminApiKey[]>>('/admin/api-keys');
    return res.data.data!;
  },

  createKey: async (data: { key_name: string; expires_in_days?: number }): Promise<SuperAdminApiKey> => {
    const res = await api.post<ApiResponse<SuperAdminApiKey>>('/admin/api-keys', data);
    return res.data.data!;
  },

  revokeKey: async (id: string): Promise<void> => {
    await api.delete(`/admin/api-keys/${id}`);
  },

  regenerateKey: async (id: string, keyName: string): Promise<SuperAdminApiKey> => {
    const res = await api.patch<ApiResponse<SuperAdminApiKey>>(`/admin/api-keys/${id}/regenerate`, { key_name: keyName });
    return res.data.data!;
  },
};
