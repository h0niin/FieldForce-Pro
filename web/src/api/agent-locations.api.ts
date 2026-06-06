import api from './axios-instance';
import type { ApiResponse } from '@/types/api.types';
import type { AgentLocation } from '@/types/models.types';

export interface CreateAgentLocationPayload {
  user_id: string;
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  battery_level?: number;
  recorded_at: string;
}

export const agentLocationsApi = {
  getLatestByUserId(userId: string) {
    return api.get<ApiResponse<AgentLocation>>(`/agent-locations/user/${userId}/latest`);
  },

  getHistoryByUserId(userId: string, params?: { start?: string; end?: string }) {
    return api.get<ApiResponse<AgentLocation[]>>(`/agent-locations/user/${userId}/history`, { params });
  },

  create(payload: CreateAgentLocationPayload) {
    return api.post<ApiResponse<AgentLocation>>('/agent-locations', payload);
  },

  createBatch(payload: CreateAgentLocationPayload[]) {
    return api.post<ApiResponse<AgentLocation[]>>('/agent-locations/batch', payload);
  },
};
