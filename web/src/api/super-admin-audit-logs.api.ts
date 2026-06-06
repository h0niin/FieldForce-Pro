import api from './axios-instance';
import { ApiResponse } from '@/types/api.types';

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  target_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const superAdminAuditLogsApi = {
  getLogs: async (params?: { page?: number; limit?: number; action?: string }): Promise<PaginatedAuditLogs> => {
    const res = await api.get<ApiResponse<PaginatedAuditLogs>>('/admin/audit-logs', { params });
    return res.data.data!;
  },
  
  exportLogs: async (): Promise<AuditLog[]> => {
    const res = await api.get<ApiResponse<AuditLog[]>>('/admin/audit-logs/export');
    return res.data.data!;
  },
};
