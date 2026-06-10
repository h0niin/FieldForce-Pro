import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationActionsApi } from '../api/automation-actions.api';
import { AutomationAction } from '../types/models.types';
import { message } from 'antd';

export function useAutomationActions(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['automation-actions', params],
    queryFn: async () => {
      const response = await automationActionsApi.getAll(params);
      return response.data;
    },
  });
}

export function useAutomationAction(id: string) {
  return useQuery({
    queryKey: ['automation-actions', id],
    queryFn: async () => {
      const response = await automationActionsApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateAutomationAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<AutomationAction>) => {
      const response = await automationActionsApi.create(data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Automation action created');
      queryClient.invalidateQueries({ queryKey: ['automation-actions'] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Failed to create automation action');
    },
  });
}

export function useUpdateAutomationAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<AutomationAction>) => {
      const response = await automationActionsApi.update(id, data);
      return response.data;
    },
    onSuccess: (data) => {
      message.success('Automation action updated');
      queryClient.invalidateQueries({ queryKey: ['automation-actions'] });
      queryClient.invalidateQueries({ queryKey: ['automation-actions', data.data?.id] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Failed to update automation action');
    },
  });
}

export function useDeleteAutomationAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await automationActionsApi.delete(id);
      return id;
    },
    onSuccess: () => {
      message.success('Automation action deleted');
      queryClient.invalidateQueries({ queryKey: ['automation-actions'] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Failed to delete automation action');
    },
  });
}
