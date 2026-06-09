import api from './axios-instance';
import type { ApiResponse } from '@/types/api.types';

export interface DispatchConsoleLayoutRecord {
  id: string;
  tenant_id: string;
  view_type: string; // 'gantt' | 'grid' | 'calendar'
  layout_mode: string; // 'classic' | 'compact' | 'comfortable'
  visible_fields: string[];
  last_modified_by: string | null;
  modifier?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export const dispatchConsoleLayoutsApi = {
  getAll() {
    return api.get<ApiResponse<DispatchConsoleLayoutRecord[]>>('/dispatch-console-layouts');
  },

  save(view_type: string, layout_mode: string, visible_fields: string[]) {
    return api.post<ApiResponse<DispatchConsoleLayoutRecord>>('/dispatch-console-layouts', {
      view_type,
      layout_mode,
      visible_fields,
    });
  },
};
