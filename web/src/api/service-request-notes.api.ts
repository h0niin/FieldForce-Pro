import api from './axios-instance';
import type { ApiResponse } from '@/types/api.types';

export interface ServiceRequestNote {
  id: string;
  tenant_id: string;
  service_request_id: string;
  user_id: string | null;
  author_name: string | null;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceRequestNotePayload {
  service_request_id: string;
  user_id?: string;
  author_name?: string;
  content: string;
}

export const serviceRequestNotesApi = {
  getByServiceRequestId(serviceRequestId: string) {
    return api.get<ApiResponse<ServiceRequestNote[]>>('/service-request-notes', {
      params: { service_request_id: serviceRequestId },
    });
  },

  create(payload: CreateServiceRequestNotePayload) {
    return api.post<ApiResponse<ServiceRequestNote>>('/service-request-notes', payload);
  },
};
