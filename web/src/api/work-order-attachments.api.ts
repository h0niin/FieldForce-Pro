import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { WorkOrderAttachment } from '@/types/models.types';

export interface CreateWorkOrderAttachmentPayload {
  work_order_id: string;
  file_url: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
}

export interface UpdateWorkOrderAttachmentPayload {
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
}

export const workOrderAttachmentsApi = {
  getAll(params?: PageOptions & { work_order_id?: string }) {
    return api.get<ApiResponse<WorkOrderAttachment[]>>('/work-order-attachments', { params });
  },

  getAllNonPaginated() {
    return api.get<ApiResponse<WorkOrderAttachment[]>>('/work-order-attachments/all');
  },

  getById(id: string) {
    return api.get<ApiResponse<WorkOrderAttachment>>(`/work-order-attachments/${id}`);
  },

  getByWorkOrderId(workOrderId: string) {
    return api.get<ApiResponse<WorkOrderAttachment[]>>('/work-order-attachments', {
      params: { work_order_id: workOrderId },
    });
  },

  upload(file: File, workOrderId: string, photoType?: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('work_order_id', workOrderId);
    if (photoType) formData.append('photo_type', photoType);
    return api.post<ApiResponse<WorkOrderAttachment>>('/work-order-attachments/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  create(payload: CreateWorkOrderAttachmentPayload) {
    return api.post<ApiResponse<WorkOrderAttachment>>('/work-order-attachments', payload);
  },

  update(id: string, payload: UpdateWorkOrderAttachmentPayload) {
    return api.put<ApiResponse<WorkOrderAttachment>>(`/work-order-attachments/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/work-order-attachments/${id}`);
  },
};
