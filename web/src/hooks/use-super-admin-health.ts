import { useQuery } from '@tanstack/react-query';
import { superAdminHealthApi } from '@/api/super-admin-health.api';

export const useSuperAdminHealth = (refetchInterval = 30000) => {
  return useQuery({
    queryKey: ['super-admin', 'health'],
    queryFn: superAdminHealthApi.getStatus,
    refetchInterval, // refetch every 30s by default
  });
};
