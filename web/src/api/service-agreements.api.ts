import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { ServiceAgreement } from '@/types/models.types';

export interface CreateServiceAgreementPayload {
  contact_id: string;
  name: string;
  type: string;
  start_date: string;
  end_date: string;
  recurrence?: string;
  sla_response_hours?: number;
  sla_resolution_hours?: number;
  value: number;
  description?: string;
  custom_fields?: Record<string, unknown>;
}

export interface UpdateServiceAgreementPayload {
  name?: string;
  type?: string;
  start_date?: string;
  end_date?: string;
  recurrence?: string;
  sla_response_hours?: number;
  sla_resolution_hours?: number;
  value?: number;
  description?: string;
  custom_fields?: Record<string, unknown>;
}

export const serviceAgreementsApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<ServiceAgreement[]>>('/service-agreements', { params });
  },

  getById(id: string) {
    return api.get<ApiResponse<ServiceAgreement>>(`/service-agreements/${id}`);
  },

  create(payload: CreateServiceAgreementPayload) {
    return api.post<ApiResponse<ServiceAgreement>>('/service-agreements', payload);
  },

  update(id: string, payload: UpdateServiceAgreementPayload) {
    return api.put<ApiResponse<ServiceAgreement>>(`/service-agreements/${id}`, payload);
  },

  updateStatus(id: string, status: string) {
    return api.patch<ApiResponse<ServiceAgreement>>(`/service-agreements/${id}/status`, { status });
  },

  renew(id: string, payload: { end_date: string; value?: number }) {
    return api.patch<ApiResponse<ServiceAgreement>>(`/service-agreements/${id}/renew`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/service-agreements/${id}`);
  },
};
