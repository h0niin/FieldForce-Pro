import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { PricebookItem } from '@/types/models.types';

export interface CreatePricebookItemPayload {
  service_id?: string;
  name: string;
  tier: string;
  price: number;
  description?: string;
  is_active?: boolean;
}

export interface UpdatePricebookItemPayload {
  service_id?: string;
  name?: string;
  tier?: string;
  price?: number;
  description?: string;
  is_active?: boolean;
}

export const pricebookApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<PricebookItem[]>>('/pricebook', { params });
  },

  getById(id: string) {
    return api.get<ApiResponse<PricebookItem>>(`/pricebook/${id}`);
  },

  create(payload: CreatePricebookItemPayload) {
    return api.post<ApiResponse<PricebookItem>>('/pricebook', payload);
  },

  update(id: string, payload: UpdatePricebookItemPayload) {
    return api.put<ApiResponse<PricebookItem>>(`/pricebook/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/pricebook/${id}`);
  },
};
