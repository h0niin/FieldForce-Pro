import api from './axios-instance';
import type { ApiResponse } from '@/types/api.types';

export interface SlaTimerData {
  id: string;
  tenant_id: string;
  work_order_id: string;
  technician_id: string;
  session_id: string;
  category: string | null;
  priority: string | null;
  started_at: string;
  deadline_at: string;
  paused_at: string | null;
  total_paused_ms: number;
  completed_at: string | null;
  actual_duration_ms: number | null;
  sla_duration_ms: number;
  source: 'historical_avg' | 'default';
  sample_count: number;
  status: 'running' | 'paused' | 'warning' | 'breached' | 'completed_on_time' | 'completed_late';
  warning_75_sent: boolean;
  warning_90_sent: boolean;
  breach_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface SlaStatsData {
  total_timers: number;
  completed_on_time: number;
  completed_late: number;
  currently_running: number;
  currently_breached: number;
  compliance_rate: number;
  avg_actual_duration_ms: number;
}

export const slaTimersApi = {
  getByWorkOrder(workOrderId: string) {
    return api.get<ApiResponse<SlaTimerData | null>>(`/sla-timers/work-order/${workOrderId}`);
  },

  getStats() {
    return api.get<ApiResponse<SlaStatsData>>('/sla-timers/stats');
  },

  pauseTimer(id: string) {
    return api.post<ApiResponse<SlaTimerData>>(`/sla-timers/${id}/pause`);
  },

  resumeTimer(id: string) {
    return api.post<ApiResponse<SlaTimerData>>(`/sla-timers/${id}/resume`);
  },
};
