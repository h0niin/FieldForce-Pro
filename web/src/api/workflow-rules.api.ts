import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { WorkflowRule } from '@/types/models.types';

export interface CreateWorkflowRulePayload {
  name: string;
  module: string;
  trigger_event: string;
  conditions?: Record<string, unknown>;
  actions?: Record<string, unknown>;
  is_active?: boolean;
}

export interface UpdateWorkflowRulePayload {
  name?: string;
  module?: string;
  trigger_event?: string;
  conditions?: Record<string, unknown>;
  actions?: Record<string, unknown>;
  is_active?: boolean;
}

export const workflowRulesApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<WorkflowRule[]>>('/workflow-rules', { params });
  },

  getById(id: string) {
    return api.get<ApiResponse<WorkflowRule>>(`/workflow-rules/${id}`);
  },

  create(payload: CreateWorkflowRulePayload) {
    return api.post<ApiResponse<WorkflowRule>>('/workflow-rules', payload);
  },

  update(id: string, payload: UpdateWorkflowRulePayload) {
    return api.put<ApiResponse<WorkflowRule>>(`/workflow-rules/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/workflow-rules/${id}`);
  },
};
