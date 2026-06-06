import { useQuery } from '@tanstack/react-query';
import { superAdminAuditLogsApi } from '@/api/super-admin-audit-logs.api';

export const useSuperAdminAuditLogs = (params: { page: number; limit: number; action?: string }) => {
  return useQuery({
    queryKey: ['super-admin', 'audit-logs', params],
    queryFn: () => superAdminAuditLogsApi.getLogs(params),
  });
};

export const useExportSuperAdminAuditLogs = () => {
  return useQuery({
    queryKey: ['super-admin', 'audit-logs', 'export'],
    queryFn: superAdminAuditLogsApi.exportLogs,
    enabled: false, // only run when explicitly called via refetch()
  });
};
