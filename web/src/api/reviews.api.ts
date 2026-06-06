import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { Review } from '@/types/models.types';

export interface CreateReviewPayload {
  work_order_id: string;
  contact_id: string;
  rating: number;
  comment?: string;
  platform?: string;
}

export interface UpdateReviewPayload {
  rating?: number;
  comment?: string;
}

export const reviewsApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<Review[]>>('/reviews', { params });
  },

  getById(id: string) {
    return api.get<ApiResponse<Review>>(`/reviews/${id}`);
  },

  getByWorkOrderId(workOrderId: string) {
    return api.get<ApiResponse<Review[]>>(`/reviews/work-order/${workOrderId}`);
  },

  create(payload: CreateReviewPayload) {
    return api.post<ApiResponse<Review>>('/reviews', payload);
  },

  update(id: string, payload: UpdateReviewPayload) {
    return api.put<ApiResponse<Review>>(`/reviews/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/reviews/${id}`);
  },
};
