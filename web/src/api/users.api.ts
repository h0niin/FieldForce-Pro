import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { User } from '@/types/models.types';

export interface InviteUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  role_id: string;
}

export interface InviteResult {
  user: Pick<User, 'id' | 'email' | 'first_name' | 'last_name'>;
  magic_link: string;
  expires_at: string;
}

export interface UserUsageData {
  plan_name: string;
  subscription_status: string;
  subscription_end: string | null;
  usage: { total_users: { current: number; limit: number | null } };
}

export const usersApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<User[]>>('/users', { params });
  },

  getAgents() {
    return api.get<ApiResponse<User[]>>('/users/agents');
  },

  getById(id: string) {
    return api.get<ApiResponse<User>>(`/users/${id}`);
  },

  create(payload: Partial<User> & { password?: string }) {
    return api.post<ApiResponse<User>>('/users', payload);
  },

  update(id: string, payload: Partial<User>) {
    return api.put<ApiResponse<User>>(`/users/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/users/${id}`);
  },

  activate(id: string) {
    return api.patch<ApiResponse<User>>(`/users/${id}/activate`);
  },

  deactivate(id: string) {
    return api.patch<ApiResponse<User>>(`/users/${id}/deactivate`);
  },

  updateAvatar(id: string, avatarUrl: string) {
    return api.patch<ApiResponse<User>>(`/users/${id}/avatar`, { avatar_url: avatarUrl });
  },

  invite(payload: InviteUserPayload) {
    return api.post<ApiResponse<InviteResult>>('/users/invite', payload);
  },

  getUsage() {
    return api.get<ApiResponse<UserUsageData>>('/users/usage');
  },
};
