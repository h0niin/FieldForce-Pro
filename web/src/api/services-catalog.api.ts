import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { ServiceCatalogItem } from '@/types/models.types';

export interface CreateServiceCatalogPayload {
  name: string;
  description?: string;
  default_price?: number;
  tax_rate?: number;
  duration_minutes?: number;
  category?: string;
  is_active?: boolean;
}

export interface UpdateServiceCatalogPayload {
  name?: string;
  description?: string;
  default_price?: number;
  tax_rate?: number;
  duration_minutes?: number;
  category?: string;
  is_active?: boolean;
}

export const servicesCatalogApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<ServiceCatalogItem[]>>('/services-catalog', { params });
  },

  getAllNonPaginated() {
    return api.get<ApiResponse<ServiceCatalogItem[]>>('/services-catalog/all');
  },

  getById(id: string) {
    return api.get<ApiResponse<ServiceCatalogItem>>(`/services-catalog/${id}`);
  },

  create(payload: CreateServiceCatalogPayload) {
    return api.post<ApiResponse<ServiceCatalogItem>>('/services-catalog', payload);
  },

  update(id: string, payload: UpdateServiceCatalogPayload) {
    return api.put<ApiResponse<ServiceCatalogItem>>(`/services-catalog/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/services-catalog/${id}`);
  },
};
