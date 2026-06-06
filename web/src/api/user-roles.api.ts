import api from './axios-instance';
import type { ApiResponse } from '@/types/api.types';

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
}

export const userRolesApi = {
  getUserRoles(userId: string) {
    return api.get<ApiResponse<UserRole[]>>(`/user-roles/user/${userId}`);
  },

  assignRole(userId: string, roleId: string) {
    return api.post<ApiResponse<UserRole>>(`/user-roles/user/${userId}/role`, {
      role_id: roleId,
    });
  },

  assignRoles(userId: string, roleIds: string[]) {
    return api.post<ApiResponse<UserRole[]>>(`/user-roles/user/${userId}/roles`, {
      role_ids: roleIds,
    });
  },

  bulkAssignRoles(assignments: Array<{ user_id: string; role_ids: string[] }>) {
    return api.post<ApiResponse<unknown>>(`/user-roles/bulk-assign`, {
      assignments,
    });
  },

  unassignRole(userId: string, roleId: string) {
    return api.delete<ApiResponse<null>>(`/user-roles/user/${userId}/role/${roleId}`);
  },

  unassignAllRoles(userId: string) {
    return api.delete<ApiResponse<null>>(`/user-roles/user/${userId}/roles`);
  },
};
