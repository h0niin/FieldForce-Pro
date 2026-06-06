import { useQuery } from '@tanstack/react-query';
import { superAdminAnalyticsApi } from '@/api/super-admin-analytics.api';

export const useSuperAdminAnalyticsOverview = () => {
  return useQuery({
    queryKey: ['super-admin', 'analytics', 'overview'],
    queryFn: superAdminAnalyticsApi.getOverview,
  });
};

export const useSuperAdminRevenueTrends = (period: 'monthly' | 'yearly') => {
  return useQuery({
    queryKey: ['super-admin', 'analytics', 'revenue', period],
    queryFn: () => superAdminAnalyticsApi.getRevenueTrends(period),
  });
};

export const useSuperAdminAdoptionMetrics = () => {
  return useQuery({
    queryKey: ['super-admin', 'analytics', 'adoption'],
    queryFn: superAdminAnalyticsApi.getAdoptionMetrics,
  });
};
