import api from './axios-instance';
import type { ApiResponse } from '@/types/api.types';

export interface IPWhitelistEntry {
  id: string;
  ip_address: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IPWhitelistConfig {
  enabled: boolean;
  entry_count: number;
}

export interface CreateIPWhitelistPayload {
  ip_address: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateIPWhitelistPayload {
  ip_address?: string;
  description?: string;
  is_active?: boolean;
}

export const ipWhitelistApi = {
  getAll() {
    return api.get<ApiResponse<IPWhitelistEntry[]>>('/ip-whitelist');
  },

  create(payload: CreateIPWhitelistPayload) {
    return api.post<ApiResponse<IPWhitelistEntry>>('/ip-whitelist', payload);
  },

  update(id: string, payload: UpdateIPWhitelistPayload) {
    return api.put<ApiResponse<IPWhitelistEntry>>(`/ip-whitelist/${id}`, payload);
  },

  remove(id: string) {
    return api.delete<ApiResponse<null>>(`/ip-whitelist/${id}`);
  },

  getConfig() {
    return api.get<ApiResponse<IPWhitelistConfig>>('/ip-whitelist/config');
  },

  setEnabled(enabled: boolean) {
    return api.put<ApiResponse<{ enabled: boolean }>>('/ip-whitelist/toggle', { enabled });
  },
};
