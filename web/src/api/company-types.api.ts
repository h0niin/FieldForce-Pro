import api from './axios-instance';
import type { ApiResponse } from '@/types/api.types';

export interface CompanyType {
  id: string;
  tenant_id: string;
  name: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export const companyTypesApi = {
  getAll() {
    return api.get<ApiResponse<CompanyType[]>>('/companies/types');
  },

  create(name: string) {
    return api.post<ApiResponse<CompanyType>>('/companies/types', { name });
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/companies/types/${id}`);
  },
};
