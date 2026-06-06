import api from './axios-instance';
import { ApiResponse } from '@/types/api.types';

export interface AnalyticsOverview {
  tenants: { total: number; active: number };
  users: { active: number };
  work_orders: { total: number };
  revenue: { total: number; mrr: number };
}

export interface RevenueTrend {
  date: string;
  revenue: number;
}

export interface AdoptionMetrics {
  by_plan: { subscription_plan: string; count: string | number }[];
}

export const superAdminAnalyticsApi = {
  getOverview: async (): Promise<AnalyticsOverview> => {
    const res = await api.get<ApiResponse<AnalyticsOverview>>('/admin/analytics/overview');
    return res.data.data!;
  },

  getRevenueTrends: async (period: 'monthly' | 'yearly'): Promise<RevenueTrend[]> => {
    const res = await api.get<ApiResponse<RevenueTrend[]>>('/admin/analytics/revenue', { params: { period } });
    return res.data.data!;
  },

  getAdoptionMetrics: async (): Promise<AdoptionMetrics> => {
    const res = await api.get<ApiResponse<AdoptionMetrics>>('/admin/analytics/adoption');
    return res.data.data!;
  },
};
