import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { WorkOrderLineItem } from '@/types/models.types';

export interface CreateWorkOrderLineItemPayload {
  work_order_id: string;
  type: 'service' | 'part' | 'travel';
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  discount?: number;
}

export interface UpdateWorkOrderLineItemPayload {
  type?: 'service' | 'part' | 'travel';
  name?: string;
  description?: string;
  quantity?: number;
  unit_price?: number;
  tax_rate?: number;
  discount?: number;
}

export const workOrderLineItemsApi = {
  getAll(params?: PageOptions & { work_order_id?: string }) {
    return api.get<ApiResponse<WorkOrderLineItem[]>>('/work-order-line-items', { params });
  },

  getAllNonPaginated() {
    return api.get<ApiResponse<WorkOrderLineItem[]>>('/work-order-line-items/all');
  },

  getById(id: string) {
    return api.get<ApiResponse<WorkOrderLineItem>>(`/work-order-line-items/${id}`);
  },

  getByWorkOrderId(workOrderId: string) {
    return api.get<ApiResponse<WorkOrderLineItem[]>>(`/work-order-line-items/work-order/${workOrderId}`);
  },

  create(payload: CreateWorkOrderLineItemPayload) {
    return api.post<ApiResponse<WorkOrderLineItem>>('/work-order-line-items', payload);
  },

  update(id: string, payload: UpdateWorkOrderLineItemPayload) {
    return api.put<ApiResponse<WorkOrderLineItem>>(`/work-order-line-items/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/work-order-line-items/${id}`);
  },
};
