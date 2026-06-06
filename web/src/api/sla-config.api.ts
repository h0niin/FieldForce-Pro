import api from './axios-instance';
import type { ApiResponse } from '@/types/api.types';

export const slaConfigApi = {
  getPolicies() {
    return api.get<ApiResponse<any[]>>('/sla-config/policies');
  },
  createPolicy(payload: any) {
    return api.post<ApiResponse<any>>('/sla-config/policies', payload);
  },
  getCalendars() {
    return api.get<ApiResponse<any[]>>('/sla-config/calendars');
  },
  createCalendar(payload: any) {
    return api.post<ApiResponse<any>>('/sla-config/calendars', payload);
  },
  getEscalations() {
    return api.get<ApiResponse<any[]>>('/sla-config/escalations');
  },
  createEscalation(payload: any) {
    return api.post<ApiResponse<any>>('/sla-config/escalations', payload);
  },
  getPauseTriggers() {
    return api.get<ApiResponse<any[]>>('/sla-config/pause-triggers');
  },
  createPauseTrigger(payload: any) {
    return api.post<ApiResponse<any>>('/sla-config/pause-triggers', payload);
  },
};
