import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { ServiceLocation } from '@/types/models.types';

export interface CreateServiceLocationPayload {
  contact_id?: string;
  company_id?: string;
  address: string;
  lat?: number;
  lng?: number;
  access_notes?: string;
  gate_code?: string;
  custom_fields?: Record<string, unknown>;
}

export interface UpdateServiceLocationPayload {
  contact_id?: string;
  company_id?: string;
  address?: string;
  lat?: number;
  lng?: number;
  access_notes?: string;
  gate_code?: string;
  custom_fields?: Record<string, unknown>;
}

export const serviceLocationsApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<ServiceLocation[]>>('/service-locations', { params });
  },

  getAllNonPaginated() {
    return api.get<ApiResponse<ServiceLocation[]>>('/service-locations/all');
  },

  getByContact(contactId: string) {
    return api.get<ApiResponse<ServiceLocation[]>>(`/service-locations/by-contact/${contactId}`);
  },

  getByCompany(companyId: string) {
    return api.get<ApiResponse<ServiceLocation[]>>(`/service-locations/by-company/${companyId}`);
  },

  getById(id: string) {
    return api.get<ApiResponse<ServiceLocation>>(`/service-locations/${id}`);
  },

  create(payload: CreateServiceLocationPayload) {
    return api.post<ApiResponse<ServiceLocation>>('/service-locations', payload);
  },

  update(id: string, payload: UpdateServiceLocationPayload) {
    return api.put<ApiResponse<ServiceLocation>>(`/service-locations/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/service-locations/${id}`);
  },
};
