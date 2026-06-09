import api from './axios-instance';
import type { ApiResponse } from '@/types/api.types';

export interface FieldPermissionRow {
  field_name: string;
  label: string;
  is_custom: boolean;
  permissions: Record<string, 'none' | 'read' | 'read_write'>; // role_id -> access_level
}

export interface FieldPermissionsResponse {
  roles: { id: string; name: string; is_system: boolean }[];
  fields: FieldPermissionRow[];
}

export const fieldPermissionsApi = {
  getForModule(moduleName: string) {
    return api.get<ApiResponse<FieldPermissionsResponse>>(`/field-permissions/module/${encodeURIComponent(moduleName)}`);
  },

  saveBatch(moduleName: string, permissions: { field_name: string; role_id: string; access_level: string }[]) {
    return api.post<ApiResponse<FieldPermissionsResponse>>('/field-permissions/batch', {
      module_name: moduleName,
      permissions,
    });
  },
};
