import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { Asset } from '@/types/models.types';

export interface CreateAssetPayload {
  name: string;
  contact_id?: string;
  location_id?: string;
  model?: string;
  serial_number?: string;
  manufacturer?: string;
  install_date?: string;
  warranty_expiry?: string;
  health_score?: number;
  category?: string;
  notes?: string;
  custom_fields?: Record<string, unknown>;
}

export interface UpdateAssetPayload {
  name?: string;
  contact_id?: string;
  location_id?: string;
  model?: string;
  serial_number?: string;
  manufacturer?: string;
  install_date?: string;
  warranty_expiry?: string;
  health_score?: number;
  category?: string;
  notes?: string;
  custom_fields?: Record<string, unknown>;
}

export const assetsApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<Asset[]>>('/assets', { params });
  },

  getAllNonPaginated() {
    return api.get<ApiResponse<Asset[]>>('/assets/all');
  },

  getById(id: string) {
    return api.get<ApiResponse<Asset>>(`/assets/${id}`);
  },

  create(payload: CreateAssetPayload) {
    return api.post<ApiResponse<Asset>>('/assets', payload);
  },

  update(id: string, payload: UpdateAssetPayload) {
    return api.put<ApiResponse<Asset>>(`/assets/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/assets/${id}`);
  },
};
