import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { Permission } from '@/types/models.types';
import type { PermissionAction } from '@/types/enums';

export interface CreatePermissionPayload {
  name: string;
  module: string;
  action: PermissionAction;
  description?: string;
}

export interface UpdatePermissionPayload {
  name?: string;
  module?: string;
  action?: PermissionAction;
  description?: string;
}

export const permissionsApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<Permission[]>>('/permissions', { params });
  },

  getAllNonPaginated() {
    return api.get<ApiResponse<Permission[]>>('/permissions/all');
  },

  getByModule(module: string) {
    return api.get<ApiResponse<Permission[]>>(`/permissions/module/${module}`);
  },

  getById(id: string) {
    return api.get<ApiResponse<Permission>>(`/permissions/${id}`);
  },

  create(payload: CreatePermissionPayload) {
    return api.post<ApiResponse<Permission>>('/permissions', payload);
  },

  bulkCreate(payloads: CreatePermissionPayload[]) {
    return api.post<ApiResponse<Permission[]>>('/permissions/bulk', payloads);
  },

  update(id: string, payload: UpdatePermissionPayload) {
    return api.put<ApiResponse<Permission>>(`/permissions/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/permissions/${id}`);
  },

  seedAll() {
    return api.post<ApiResponse<{ created: number; skipped: number; total: number }>>('/permissions/seed');
  },
};
