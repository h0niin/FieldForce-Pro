import api from './axios-instance';
import type { ApiResponse } from '@/types/api.types';

export interface TenantModuleRecord {
  id: string;
  tenant_id: string;
  module_name: string;
  is_active: boolean;
  last_modified_by: string | null;
  modifier?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export const tenantModulesApi = {
  getAll() {
    return api.get<ApiResponse<TenantModuleRecord[]>>('/tenant-modules');
  },

  toggle(moduleName: string, is_active: boolean) {
    return api.patch<ApiResponse<TenantModuleRecord>>(`/tenant-modules/${encodeURIComponent(moduleName)}`, {
      is_active,
    });
  },
};
