import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { Communication } from '@/types/models.types';

export interface CreateCommunicationPayload {
  contact_id: string;
  channel: string;
  direction: string;
  subject?: string;
  body: string;
}

export interface UpdateCommunicationPayload {
  subject?: string;
  body?: string;
  status?: string;
}

export const communicationsApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<Communication[]>>('/communication', { params });
  },

  getById(id: string) {
    return api.get<ApiResponse<Communication>>(`/communication/${id}`);
  },

  getByContactId(contactId: string) {
    return api.get<ApiResponse<Communication[]>>(`/communication/contact/${contactId}`);
  },

  create(payload: CreateCommunicationPayload) {
    return api.post<ApiResponse<Communication>>('/communication', payload);
  },

  update(id: string, payload: UpdateCommunicationPayload) {
    return api.put<ApiResponse<Communication>>(`/communication/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/communication/${id}`);
  },
};
