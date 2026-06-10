import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { Company } from '@/types/models.types';

export interface CreateCompanyPayload {
  name: string;
  industry?: string;
  billing_address?: string;
  tax_id?: string;
  website?: string;
  notes?: string;
  custom_fields?: Record<string, unknown>;
}

export interface UpdateCompanyPayload {
  name?: string;
  industry?: string;
  billing_address?: string;
  tax_id?: string;
  website?: string;
  notes?: string;
  custom_fields?: Record<string, unknown>;
}

export const companiesApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<Company[]>>('/companies', { params });
  },

  getAllNonPaginated() {
    return api.get<ApiResponse<Company[]>>('/companies/all');
  },

  getById(id: string) {
    return api.get<ApiResponse<Company>>(`/companies/${id}`);
  },

  getInsights(id: string) {
    return api.get<ApiResponse<{ activeAssets: number; openWorkOrders: number; unpaidInvoices: number }>>(`/companies/${id}/insights`);
  },

  create(payload: CreateCompanyPayload) {
    return api.post<ApiResponse<Company>>('/companies', payload);
  },

  update(id: string, payload: UpdateCompanyPayload) {
    return api.put<ApiResponse<Company>>(`/companies/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/companies/${id}`);
  },

  importCsv(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<{ imported: number; failed: number; total: number }>>('/companies/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  exportCsv(recordIds?: string[]) {
    return api.post('/companies/export/csv', { recordIds }, { responseType: 'blob' });
  },

  changeOwner(recordIds: string[], newOwnerId: string) {
    return api.put<ApiResponse<null>>('/companies/bulk/change-owner', { recordIds, newOwnerId });
  },

  merge(masterRecordId: string, duplicateRecordId: string) {
    return api.post<ApiResponse<null>>('/companies/bulk/merge', { masterRecordId, duplicateRecordId });
  },
};
