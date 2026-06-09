import api from './axios-instance';
import type { ApiResponse } from '@/types/api.types';

export interface ActivityLog {
  id: string;
  tenant_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export const activityLogsApi = {
  getByEntity(entityType: string, entityId: string) {
    return api.get<ApiResponse<ActivityLog[]>>('/activity-logs', {
      params: {
        entity_type: entityType,
        entity_id: entityId,
      },
    });
  },
};
