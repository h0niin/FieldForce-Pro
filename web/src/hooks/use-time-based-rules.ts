import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeBasedRulesApi } from '../api/time-based-rules.api';
import { TimeBasedRule } from '../types/models.types';
import { message } from 'antd';

export function useTimeBasedRules(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['time-based-rules', params],
    queryFn: async () => {
      const response = await timeBasedRulesApi.getAll(params);
      return response.data;
    },
  });
}

export function useTimeBasedRule(id: string) {
  return useQuery({
    queryKey: ['time-based-rules', id],
    queryFn: async () => {
      const response = await timeBasedRulesApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateTimeBasedRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<TimeBasedRule>) => {
      const response = await timeBasedRulesApi.create(data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Time based rule created');
      queryClient.invalidateQueries({ queryKey: ['time-based-rules'] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Failed to create time based rule');
    },
  });
}

export function useUpdateTimeBasedRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<TimeBasedRule>) => {
      const response = await timeBasedRulesApi.update(id, data);
      return response.data;
    },
    onSuccess: (data) => {
      message.success('Time based rule updated');
      queryClient.invalidateQueries({ queryKey: ['time-based-rules'] });
      queryClient.invalidateQueries({ queryKey: ['time-based-rules', data.data?.id] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Failed to update time based rule');
    },
  });
}

export function useDeleteTimeBasedRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await timeBasedRulesApi.delete(id);
      return id;
    },
    onSuccess: () => {
      message.success('Time based rule deleted');
      queryClient.invalidateQueries({ queryKey: ['time-based-rules'] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Failed to delete time based rule');
    },
  });
}
