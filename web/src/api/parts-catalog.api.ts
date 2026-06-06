import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { PartsCatalogItem } from '@/types/models.types';

export interface CreatePartsCatalogPayload {
  name: string;
  sku?: string;
  description?: string;
  unit_price?: number;
  stock_qty?: number;
  reorder_level?: number;
  supplier?: string;
  category?: string;
  is_active?: boolean;
}

export interface UpdatePartsCatalogPayload {
  name?: string;
  sku?: string;
  description?: string;
  unit_price?: number;
  stock_qty?: number;
  reorder_level?: number;
  supplier?: string;
  category?: string;
  is_active?: boolean;
}

export const partsCatalogApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<PartsCatalogItem[]>>('/parts-catalog', { params });
  },

  getAllNonPaginated() {
    return api.get<ApiResponse<PartsCatalogItem[]>>('/parts-catalog/all');
  },

  getById(id: string) {
    return api.get<ApiResponse<PartsCatalogItem>>(`/parts-catalog/${id}`);
  },

  create(payload: CreatePartsCatalogPayload) {
    return api.post<ApiResponse<PartsCatalogItem>>('/parts-catalog', payload);
  },

  update(id: string, payload: UpdatePartsCatalogPayload) {
    return api.put<ApiResponse<PartsCatalogItem>>(`/parts-catalog/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/parts-catalog/${id}`);
  },
};
