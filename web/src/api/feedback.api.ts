import api from './axios-instance';
import type { ApiResponse } from '@/types/api.types';

export interface CreateFeedbackPayload {
  work_order_id: string;
  rating: number;
  comments?: string;
  is_customer_facing?: boolean;
}

export const feedbackApi = {
  create(payload: CreateFeedbackPayload) {
    return api.post<ApiResponse<any>>('/feedback', payload);
  },
  getByWorkOrder(workOrderId: string) {
    return api.get<ApiResponse<any[]>>(`/feedback/work-order/${workOrderId}`);
  },
};
