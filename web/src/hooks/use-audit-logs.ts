import { useQuery } from '@tanstack/react-query';
import { auditLogsApi, AuditLogFilters } from '@/api/audit-logs.api';

export function useAuditLogs(params?: AuditLogFilters) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: async () => {
      const response = await auditLogsApi.getAll(params);
      return { data: response.data.data!, meta: response.data.meta! };
    },
  });
}

export function useAuditLog(id: string) {
  return useQuery({
    queryKey: ['audit-logs', id],
    queryFn: async () => {
      const response = await auditLogsApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}
