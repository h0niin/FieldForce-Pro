import api from './axios-instance';
import type { ApiResponse } from '@/types/api.types';
import type { Setting } from '@/types/models.types';

export interface UpdateSettingPayload {
  value: Record<string, unknown>;
}

export const settingsApi = {
  getAll() {
    return api.get<ApiResponse<Setting[]>>('/settings');
  },

  getByKey(key: string) {
    return api.get<ApiResponse<Setting>>(`/settings/${key}`);
  },

  getByCategory(category: string) {
    return api.get<ApiResponse<Setting[]>>(`/settings/category/${category}`);
  },

  upsert(key: string, payload: UpdateSettingPayload) {
    return api.put<ApiResponse<Setting>>(`/settings/${key}`, payload);
  },
};
