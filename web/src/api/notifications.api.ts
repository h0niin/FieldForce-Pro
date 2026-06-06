import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { Notification } from '@/types/models.types';

export interface CreateNotificationPayload {
  user_id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channel: string;
}

export const notificationsApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<Notification[]>>('/notifications', { params });
  },

  getById(id: string) {
    return api.get<ApiResponse<Notification>>(`/notifications/${id}`);
  },

  getUnread() {
    return api.get<ApiResponse<Notification[]>>('/notifications/unread');
  },

  create(payload: CreateNotificationPayload) {
    return api.post<ApiResponse<Notification>>('/notifications', payload);
  },

  markAsRead(id: string) {
    return api.patch<ApiResponse<Notification>>(`/notifications/${id}/read`);
  },

  markAllAsRead() {
    return api.patch<ApiResponse<null>>('/notifications/mark-all-read');
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/notifications/${id}`);
  },
};
