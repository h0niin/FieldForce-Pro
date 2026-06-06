import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { Webhook } from '@/types/models.types';

export interface CreateWebhookPayload {
  name: string;
  url: string;
  events?: string[];
  secret?: string;
  is_active?: boolean;
}

export interface UpdateWebhookPayload {
  name?: string;
  url?: string;
  events?: string[];
  secret?: string;
  is_active?: boolean;
}

export const webhooksApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<Webhook[]>>('/webhooks', { params });
  },

  getById(id: string) {
    return api.get<ApiResponse<Webhook>>(`/webhooks/${id}`);
  },

  create(payload: CreateWebhookPayload) {
    return api.post<ApiResponse<Webhook>>('/webhooks', payload);
  },

  update(id: string, payload: UpdateWebhookPayload) {
    return api.put<ApiResponse<Webhook>>(`/webhooks/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/webhooks/${id}`);
  },
};
