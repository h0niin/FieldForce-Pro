import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workflowRulesApi, CreateWorkflowRulePayload, UpdateWorkflowRulePayload } from '@/api/workflow-rules.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function useWorkflowRules(params?: PageOptions) {
  return useQuery({
    queryKey: ['workflow-rules', params],
    queryFn: async () => {
      const response = await workflowRulesApi.getAll(params);
      return { data: response.data.data!, meta: response.data.meta! };
    },
  });
}

export function useWorkflowRule(id: string) {
  return useQuery({
    queryKey: ['workflow-rules', id],
    queryFn: async () => {
      const response = await workflowRulesApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateWorkflowRule() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateWorkflowRulePayload) => workflowRulesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-rules'] });
      addNotification({ type: 'success', message: 'Workflow rule created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create workflow rule' });
    },
  });
}

export function useUpdateWorkflowRule() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateWorkflowRulePayload & { id: string }) =>
      workflowRulesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-rules'] });
      addNotification({ type: 'success', message: 'Workflow rule updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update workflow rule' });
    },
  });
}

export function useDeleteWorkflowRule() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => workflowRulesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-rules'] });
      addNotification({ type: 'success', message: 'Workflow rule deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete workflow rule' });
    },
  });
}
