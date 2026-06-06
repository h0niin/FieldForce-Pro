import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { AssetMaintenancePlan } from '@/types/models.types';

export interface CreateMaintenancePlanPayload {
  asset_id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  next_due_date?: string;
  auto_create_wo?: boolean;
  custom_fields?: Record<string, unknown>;
}

export interface UpdateMaintenancePlanPayload {
  asset_id?: string;
  name?: string;
  description?: string;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  next_due_date?: string;
  last_completed_date?: string;
  auto_create_wo?: boolean;
  is_active?: boolean;
  custom_fields?: Record<string, unknown>;
}

export const maintenancePlansApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<AssetMaintenancePlan[]>>('/asset-maintenance-plans', { params });
  },

  getByAssetId(assetId: string) {
    return api.get<ApiResponse<AssetMaintenancePlan[]>>(`/asset-maintenance-plans/asset/${assetId}`);
  },

  getById(id: string) {
    return api.get<ApiResponse<AssetMaintenancePlan>>(`/asset-maintenance-plans/${id}`);
  },

  create(payload: CreateMaintenancePlanPayload) {
    return api.post<ApiResponse<AssetMaintenancePlan>>('/asset-maintenance-plans', payload);
  },

  update(id: string, payload: UpdateMaintenancePlanPayload) {
    return api.put<ApiResponse<AssetMaintenancePlan>>(`/asset-maintenance-plans/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/asset-maintenance-plans/${id}`);
  },
};
