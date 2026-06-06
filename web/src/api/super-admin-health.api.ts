import api from './axios-instance';
import { ApiResponse } from '@/types/api.types';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: {
      status: string;
      queryTimeMs: number;
    };
    api: {
      status: string;
      uptimeSeconds: number;
      memoryUsage: {
        total: number;
        free: number;
        used: number;
        usedPercentage: number;
      };
      cpuLoad: number;
    };
    redis: {
      status: string;
      pingTimeMs: number;
    };
  };
}

export const superAdminHealthApi = {
  getStatus: async (): Promise<SystemHealth> => {
    const res = await api.get<ApiResponse<SystemHealth>>('/admin/health/status');
    return res.data.data!;
  },
};
