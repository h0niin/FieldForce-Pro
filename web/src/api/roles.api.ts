import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { Role, Permission } from '@/types/models.types';

export interface CreateRolePayload {
  name: string;
  description?: string;
  permission_ids?: string[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permission_ids?: string[];
}

export const rolesApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<Role[]>>('/roles', { params });
  },

  getAllNonPaginated() {
    return api.get<ApiResponse<Role[]>>('/roles/all');
  },

  getById(id: string) {
    return api.get<ApiResponse<Role>>(`/roles/${id}`);
  },

  getPermissions(id: string) {
    return api.get<ApiResponse<Permission[]>>(`/roles/${id}/permissions`);
  },

  create(payload: CreateRolePayload) {
    return api.post<ApiResponse<Role>>('/roles', payload);
  },

  update(id: string, payload: UpdateRolePayload) {
    return api.put<ApiResponse<Role>>(`/roles/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/roles/${id}`);
  },

  assignPermissions(id: string, permissionIds: string[]) {
    return api.post<ApiResponse<null>>(`/roles/${id}/permissions`, {
      permission_ids: permissionIds,
    });
  },

  removePermissions(id: string, permissionIds: string[]) {
    return api.delete<ApiResponse<null>>(`/roles/${id}/permissions`, {
      data: { permission_ids: permissionIds },
    });
  },
};
