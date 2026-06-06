import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { Trip } from '@/types/models.types';

export interface StartTripPayload {
  user_id: string;
  appointment_id?: string;
  start_lat: number;
  start_lng: number;
}

export interface EndTripPayload {
  end_lat: number;
  end_lng: number;
  distance_km?: number;
  route_polyline?: string;
}

export interface UpdateTripPayload {
  end_lat?: number;
  end_lng?: number;
  distance_km?: number;
  route_polyline?: string;
  status?: string;
  custom_fields?: Record<string, unknown>;
}

export const tripsApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<Trip[]>>('/trips', { params });
  },

  getById(id: string) {
    return api.get<ApiResponse<Trip>>(`/trips/${id}`);
  },

  getByUserId(userId: string) {
    return api.get<ApiResponse<Trip[]>>(`/trips/user/${userId}`);
  },

  start(payload: StartTripPayload) {
    return api.post<ApiResponse<Trip>>('/trips/start', payload);
  },

  end(id: string, payload: EndTripPayload) {
    return api.patch<ApiResponse<Trip>>(`/trips/${id}/end`, payload);
  },

  update(id: string, payload: UpdateTripPayload) {
    return api.put<ApiResponse<Trip>>(`/trips/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/trips/${id}`);
  },
};
