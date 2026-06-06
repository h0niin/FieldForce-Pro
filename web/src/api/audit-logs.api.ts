import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { AuditLog } from '@/types/models.types';

export interface AuditLogFilters extends PageOptions {
  module?: string;
  action?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
}

export const auditLogsApi = {
  getAll(params?: AuditLogFilters) {
    return api.get<ApiResponse<AuditLog[]>>('/audit-logs', { params });
  },

  getById(id: string) {
    return api.get<ApiResponse<AuditLog>>(`/audit-logs/${id}`);
  },
};
