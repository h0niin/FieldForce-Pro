import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { EstimateLineItem } from '@/types/models.types';

export type LineItemType = 'service' | 'labor' | 'material' | 'part' | 'equipment' | 'travel' | 'other';

export interface CreateEstimateLineItemPayload {
  estimate_id: string;
  type: LineItemType;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  tax_rate?: number;
  discount_type?: 'fixed' | 'percentage';
  discount?: number;
  total?: number;
  sort_order?: number;
}

export interface UpdateEstimateLineItemPayload {
  type?: LineItemType;
  name?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  tax_rate?: number;
  discount?: number;
  sort_order?: number;
}

export const estimateLineItemsApi = {
  getAll(params?: PageOptions & { estimate_id?: string }) {
    return api.get<ApiResponse<EstimateLineItem[]>>('/estimate-line-items', { params });
  },

  getAllNonPaginated() {
    return api.get<ApiResponse<EstimateLineItem[]>>('/estimate-line-items/all');
  },

  getById(id: string) {
    return api.get<ApiResponse<EstimateLineItem>>(`/estimate-line-items/${id}`);
  },

  getByEstimateId(estimateId: string) {
    return api.get<ApiResponse<EstimateLineItem[]>>(`/estimate-line-items/estimate/${estimateId}`);
  },

  create(payload: CreateEstimateLineItemPayload) {
    return api.post<ApiResponse<EstimateLineItem>>('/estimate-line-items', payload);
  },

  update(id: string, payload: UpdateEstimateLineItemPayload) {
    return api.put<ApiResponse<EstimateLineItem>>(`/estimate-line-items/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/estimate-line-items/${id}`);
  },
};
