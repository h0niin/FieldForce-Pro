import api from './axios-instance';
import type { ApiResponse } from '@/types/api.types';

export const slaConfigApi = {
  getPolicies() {
    return api.get<ApiResponse<any[]>>('/sla-config/policies');
  },
  createPolicy(payload: any) {
    return api.post<ApiResponse<any>>('/sla-config/policies', payload);
  },
  updatePolicy(id: string, payload: any) {
    return api.put<ApiResponse<any>>(`/sla-config/policies/${id}`, payload);
  },
  deletePolicy(id: string) {
    return api.delete<ApiResponse<void>>(`/sla-config/policies/${id}`);
  },
  getCalendars() {
    return api.get<ApiResponse<any[]>>('/sla-config/calendars');
  },
  createCalendar(payload: any) {
    return api.post<ApiResponse<any>>('/sla-config/calendars', payload);
  },
  updateCalendar(id: string, payload: any) {
    return api.put<ApiResponse<any>>(`/sla-config/calendars/${id}`, payload);
  },
  deleteCalendar(id: string) {
    return api.delete<ApiResponse<void>>(`/sla-config/calendars/${id}`);
  },
  getEscalations() {
    return api.get<ApiResponse<any[]>>('/sla-config/escalations');
  },
  createEscalation(payload: any) {
    return api.post<ApiResponse<any>>('/sla-config/escalations', payload);
  },
  updateEscalation(id: string, payload: any) {
    return api.put<ApiResponse<any>>(`/sla-config/escalations/${id}`, payload);
  },
  deleteEscalation(id: string) {
    return api.delete<ApiResponse<void>>(`/sla-config/escalations/${id}`);
  },
  getPauseTriggers() {
    return api.get<ApiResponse<any[]>>('/sla-config/pause-triggers');
  },
  createPauseTrigger(payload: any) {
    return api.post<ApiResponse<any>>('/sla-config/pause-triggers', payload);
  },
  updatePauseTrigger(id: string, payload: any) {
    return api.put<ApiResponse<any>>(`/sla-config/pause-triggers/${id}`, payload);
  },
  deletePauseTrigger(id: string) {
    return api.delete<ApiResponse<void>>(`/sla-config/pause-triggers/${id}`);
  },
  getAnalytics() {
    return api.get<ApiResponse<any>>('/sla-config/analytics');
  },
};
