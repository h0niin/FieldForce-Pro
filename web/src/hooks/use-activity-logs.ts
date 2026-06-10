import { useQuery } from '@tanstack/react-query';
import { activityLogsApi } from '@/api/activity-logs.api';

export function useActivityLogs(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['activity-logs', entityType, entityId],
    queryFn: async () => {
      const response = await activityLogsApi.getByEntity(entityType, entityId);
      const rawData = Array.isArray(response.data) ? response.data : response.data?.data;
      return Array.isArray(rawData) ? rawData : [];
    },
    enabled: !!entityType && !!entityId,
  });
}
