import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { WorkOrderNote } from '@/types/models.types';

export interface CreateWorkOrderNotePayload {
  work_order_id: string;
  content: string;
  is_internal?: boolean;
}

export interface UpdateWorkOrderNotePayload {
  content?: string;
  is_internal?: boolean;
}

export const workOrderNotesApi = {
  getAll(params?: PageOptions & { work_order_id?: string }) {
    return api.get<ApiResponse<WorkOrderNote[]>>('/work-order-notes', { params });
  },

  getAllNonPaginated() {
    return api.get<ApiResponse<WorkOrderNote[]>>('/work-order-notes/all');
  },

  getById(id: string) {
    return api.get<ApiResponse<WorkOrderNote>>(`/work-order-notes/${id}`);
  },

  getByWorkOrderId(workOrderId: string) {
    return api.get<ApiResponse<WorkOrderNote[]>>('/work-order-notes', {
      params: { work_order_id: workOrderId },
    });
  },

  create(payload: CreateWorkOrderNotePayload) {
    return api.post<ApiResponse<WorkOrderNote>>('/work-order-notes', payload);
  },

  update(id: string, payload: UpdateWorkOrderNotePayload) {
    return api.put<ApiResponse<WorkOrderNote>>(`/work-order-notes/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/work-order-notes/${id}`);
  },
};
