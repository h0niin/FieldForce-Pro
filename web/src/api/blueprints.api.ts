import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { BlueprintDefinition, BlueprintState, BlueprintTransition } from '@/types/models.types';

export interface CreateBlueprintPayload {
  name: string;
  module: string;
  is_active?: boolean;
}

export interface UpdateBlueprintPayload {
  name?: string;
  module?: string;
  is_active?: boolean;
}

export interface CreateBlueprintStatePayload {
  blueprint_id: string;
  name: string;
  color?: string;
  is_initial?: boolean;
  is_final?: boolean;
  sort_order?: number;
}

export interface UpdateBlueprintStatePayload {
  name?: string;
  color?: string;
  is_initial?: boolean;
  is_final?: boolean;
  sort_order?: number;
}

export interface CreateBlueprintTransitionPayload {
  blueprint_id: string;
  from_state_id: string;
  to_state_id: string;
  name: string;
  allowed_roles?: string[];
  required_fields?: string[];
  webhook_url?: string;
  guard_condition?: string;
}

export interface UpdateBlueprintTransitionPayload {
  name?: string;
  allowed_roles?: string[];
  required_fields?: string[];
  webhook_url?: string;
  guard_condition?: string;
}

export const blueprintDefinitionsApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<BlueprintDefinition[]>>('/blueprint-definitions', { params });
  },

  getById(id: string) {
    return api.get<ApiResponse<BlueprintDefinition>>(`/blueprint-definitions/${id}`);
  },

  create(payload: CreateBlueprintPayload) {
    return api.post<ApiResponse<BlueprintDefinition>>('/blueprint-definitions', payload);
  },

  update(id: string, payload: UpdateBlueprintPayload) {
    return api.put<ApiResponse<BlueprintDefinition>>(`/blueprint-definitions/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/blueprint-definitions/${id}`);
  },
};

export const blueprintStatesApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<BlueprintState[]>>('/blueprint-states', { params });
  },

  getByBlueprintId(blueprintId: string) {
    return api.get<ApiResponse<BlueprintState[]>>(`/blueprint-states/blueprint/${blueprintId}`);
  },

  getById(id: string) {
    return api.get<ApiResponse<BlueprintState>>(`/blueprint-states/${id}`);
  },

  create(payload: CreateBlueprintStatePayload) {
    return api.post<ApiResponse<BlueprintState>>('/blueprint-states', payload);
  },

  update(id: string, payload: UpdateBlueprintStatePayload) {
    return api.put<ApiResponse<BlueprintState>>(`/blueprint-states/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/blueprint-states/${id}`);
  },
};

export const blueprintTransitionsApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<BlueprintTransition[]>>('/blueprint-transitions', { params });
  },

  getByBlueprintId(blueprintId: string) {
    return api.get<ApiResponse<BlueprintTransition[]>>(`/blueprint-transitions/blueprint/${blueprintId}`);
  },

  getById(id: string) {
    return api.get<ApiResponse<BlueprintTransition>>(`/blueprint-transitions/${id}`);
  },

  create(payload: CreateBlueprintTransitionPayload) {
    return api.post<ApiResponse<BlueprintTransition>>('/blueprint-transitions', payload);
  },

  update(id: string, payload: UpdateBlueprintTransitionPayload) {
    return api.put<ApiResponse<BlueprintTransition>>(`/blueprint-transitions/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/blueprint-transitions/${id}`);
  },
};
