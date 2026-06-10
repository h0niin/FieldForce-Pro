import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduledReportsApi } from '../api/scheduled-reports.api';
import { ScheduledReport } from '../types/models.types';
import { message } from 'antd';

export function useScheduledReports(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['scheduled-reports', params],
    queryFn: async () => {
      const response = await scheduledReportsApi.getAll(params);
      return response.data;
    },
  });
}

export function useScheduledReport(id: string) {
  return useQuery({
    queryKey: ['scheduled-reports', id],
    queryFn: async () => {
      const response = await scheduledReportsApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateScheduledReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ScheduledReport>) => {
      const response = await scheduledReportsApi.create(data);
      return response.data;
    },
    onSuccess: () => {
      message.success('Scheduled report created');
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Failed to create scheduled report');
    },
  });
}

export function useUpdateScheduledReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<ScheduledReport>) => {
      const response = await scheduledReportsApi.update(id, data);
      return response.data;
    },
    onSuccess: (data) => {
      message.success('Scheduled report updated');
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports', data.data?.id] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Failed to update scheduled report');
    },
  });
}

export function useDeleteScheduledReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await scheduledReportsApi.delete(id);
      return id;
    },
    onSuccess: () => {
      message.success('Scheduled report deleted');
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Failed to delete scheduled report');
    },
  });
}
