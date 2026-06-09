import api from './axios-instance';
import type { ApiResponse } from '@/types/api.types';

export interface ModuleMappingRecord {
  id?: string;
  tenant_id?: string;
  source_module: string;
  target_module: string;
  source_field: string;
  target_field: string;
  created_at?: string;
  updated_at?: string;
}

export interface ModuleField {
  name: string;
  label: string;
  type: string;
  isCustom: boolean;
}

export interface ModuleFieldsResponse {
  sourceFields: ModuleField[];
  targetFields: ModuleField[];
}

export const moduleMappingsApi = {
  getMappings(sourceModule: string, targetModule: string) {
    return api.get<ApiResponse<ModuleMappingRecord[]>>(`/module-mappings`, {
      params: { sourceModule, targetModule },
    });
  },

  getFields(sourceModule: string, targetModule: string) {
    return api.get<ApiResponse<ModuleFieldsResponse>>(`/module-mappings/fields`, {
      params: { sourceModule, targetModule },
    });
  },

  save(sourceModule: string, targetModule: string, mappings: { source_field: string; target_field: string }[]) {
    return api.post<ApiResponse<ModuleMappingRecord[]>>(`/module-mappings/save`, {
      sourceModule,
      targetModule,
      mappings,
    });
  },

  reset(sourceModule: string, targetModule: string) {
    return api.post<ApiResponse<ModuleMappingRecord[]>>(`/module-mappings/reset`, {
      sourceModule,
      targetModule,
    });
  },
};
