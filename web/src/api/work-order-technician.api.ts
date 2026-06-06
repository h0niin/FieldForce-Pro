import api from './axios-instance';
import type { ApiResponse } from '@/types/api.types';

export type TechnicianSessionStep =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'trip_started'
  | 'reached'
  | 'items_confirmed'
  | 'call_confirmed'
  | 'work_started'
  | 'paused'
  | 'after_photos'
  | 'feedback_collected'
  | 'finished';

export interface TechnicianSession {
  id: string;
  tenant_id: string;
  work_order_id: string;
  technician_id: string;
  step: TechnicianSessionStep;
  rejection_reason: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  trip_started_at: string | null;
  trip_start_type: 'manual' | 'auto_gps' | null;
  trip_start_lat: number | null;
  trip_start_lng: number | null;
  reached_at: string | null;
  items_confirmed_at: string | null;
  call_confirmed_at: string | null;
  work_started_at: string | null;
  paused_at: string | null;
  resumed_at: string | null;
  before_photos_at: string | null;
  after_photos_at: string | null;
  customer_rating: number | null;
  customer_feedback: string | null;
  customer_signature_url: string | null;
  finished_at: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface StartTripPayload {
  start_lat: number;
  start_lng: number;
  trip_start_type?: 'manual' | 'auto_gps';
}

export interface FinishJobPayload {
  customer_rating?: number;
  customer_feedback?: string;
  customer_signature_url?: string;
}

const base = (workOrderId: string) => `/work-orders/${workOrderId}/technician-session`;

export const workOrderTechnicianApi = {
  getSession(workOrderId: string) {
    return api.get<ApiResponse<TechnicianSession | null>>(base(workOrderId));
  },

  initSession(workOrderId: string) {
    return api.post<ApiResponse<TechnicianSession>>(`${base(workOrderId)}/init`);
  },

  approve(workOrderId: string) {
    return api.post<ApiResponse<TechnicianSession>>(`${base(workOrderId)}/approve`);
  },

  reject(workOrderId: string, reason: string) {
    return api.post<ApiResponse<TechnicianSession>>(`${base(workOrderId)}/reject`, { reason });
  },

  startTrip(workOrderId: string, payload: StartTripPayload) {
    return api.post<ApiResponse<TechnicianSession>>(`${base(workOrderId)}/start-trip`, payload);
  },

  markReached(workOrderId: string) {
    return api.post<ApiResponse<TechnicianSession>>(`${base(workOrderId)}/reached`);
  },

  confirmItems(workOrderId: string) {
    return api.post<ApiResponse<TechnicianSession>>(`${base(workOrderId)}/confirm-items`);
  },

  confirmCall(workOrderId: string) {
    return api.post<ApiResponse<TechnicianSession>>(`${base(workOrderId)}/confirm-call`);
  },

  startWork(workOrderId: string) {
    return api.post<ApiResponse<TechnicianSession>>(`${base(workOrderId)}/start-work`);
  },

  pauseWork(workOrderId: string) {
    return api.post<ApiResponse<TechnicianSession>>(`${base(workOrderId)}/pause`);
  },

  resumeWork(workOrderId: string) {
    return api.post<ApiResponse<TechnicianSession>>(`${base(workOrderId)}/resume`);
  },

  markBeforePhotos(workOrderId: string) {
    return api.post<ApiResponse<TechnicianSession>>(`${base(workOrderId)}/mark-before-photos`);
  },

  markAfterPhotos(workOrderId: string) {
    return api.post<ApiResponse<TechnicianSession>>(`${base(workOrderId)}/mark-after-photos`);
  },

  finish(workOrderId: string, payload: FinishJobPayload) {
    return api.post<ApiResponse<TechnicianSession>>(`${base(workOrderId)}/finish`, payload);
  },
};
