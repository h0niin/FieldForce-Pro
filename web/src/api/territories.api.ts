import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { Territory } from '@/types/models.types';

export interface CreateTerritoryPayload {
  name: string;
  description?: string;
}

export interface UpdateTerritoryPayload {
  name?: string;
  description?: string;
}

export const territoriesApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<Territory[]>>('/territories', { params });
  },

  getAllNonPaginated() {
    return api.get<ApiResponse<Territory[]>>('/territories/all');
  },

  getById(id: string) {
    return api.get<ApiResponse<Territory>>(`/territories/${id}`);
  },

  create(payload: CreateTerritoryPayload) {
    return api.post<ApiResponse<Territory>>('/territories', payload);
  },

  update(id: string, payload: UpdateTerritoryPayload) {
    return api.put<ApiResponse<Territory>>(`/territories/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/territories/${id}`);
  },
};
