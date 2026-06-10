import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { Contact } from '@/types/models.types';

export interface CreateContactPayload {
  company_id?: string;
  salutation?: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  service_address?: string;
  billing_address?: string;
  mobile?: string;
  secondary_email?: string;
  department?: string;
  title?: string;
  address?: string;
  tags?: string[];
  custom_fields?: Record<string, unknown>;
}

export interface UpdateContactPayload {
  company_id?: string;
  salutation?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  service_address?: string;
  billing_address?: string;
  mobile?: string;
  secondary_email?: string;
  department?: string;
  title?: string;
  address?: string;
  tags?: string[];
  custom_fields?: Record<string, unknown>;
}

export const contactsApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<Contact[]>>('/contacts', { params });
  },

  getAllNonPaginated() {
    return api.get<ApiResponse<Contact[]>>('/contacts/all');
  },

  getByCompany(companyId: string) {
    return api.get<ApiResponse<Contact[]>>(`/contacts/all`, { params: { company_id: companyId } });
  },

  getById(id: string) {
    return api.get<ApiResponse<Contact>>(`/contacts/${id}`);
  },

  getInsights(id: string) {
    return api.get<ApiResponse<{ activeAssets: number; openWorkOrders: number; unpaidInvoices: number }>>(`/contacts/${id}/insights`);
  },

  create(payload: CreateContactPayload) {
    return api.post<ApiResponse<Contact>>('/contacts', payload);
  },

  update(id: string, payload: UpdateContactPayload) {
    return api.put<ApiResponse<Contact>>(`/contacts/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/contacts/${id}`);
  },
};
