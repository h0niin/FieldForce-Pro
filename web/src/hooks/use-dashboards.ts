import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardsApi, CreateDashboardPayload, UpdateDashboardPayload } from '@/api/dashboards.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function useDashboards(params?: PageOptions) {
  return useQuery({
    queryKey: ['dashboards', params],
    queryFn: async () => {
      const response = await dashboardsApi.getAll(params);
      return { data: response.data.data!, meta: response.data.meta! };
    },
  });
}

export function useDashboard(id: string) {
  return useQuery({
    queryKey: ['dashboards', id],
    queryFn: async () => {
      const response = await dashboardsApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useUserDashboards(userId: string) {
  return useQuery({
    queryKey: ['dashboards', 'user', userId],
    queryFn: async () => {
      const response = await dashboardsApi.getByUserId(userId);
      return response.data.data!;
    },
    enabled: !!userId,
  });
}

export function useCreateDashboard() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateDashboardPayload) => dashboardsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
      addNotification({ type: 'success', message: 'Dashboard created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create dashboard' });
    },
  });
}

export function useUpdateDashboard() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateDashboardPayload & { id: string }) =>
      dashboardsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
      addNotification({ type: 'success', message: 'Dashboard updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update dashboard' });
    },
  });
}

export function useDeleteDashboard() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => dashboardsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
      addNotification({ type: 'success', message: 'Dashboard deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete dashboard' });
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboards', 'stats'],
    queryFn: async () => {
      const response = await dashboardsApi.getStats();
      return response.data.data;
    },
  });
}

export function useDashboardActivityFeed() {
  return useQuery({
    queryKey: ['dashboards', 'activityFeed'],
    queryFn: async () => {
      const response = await dashboardsApi.getActivityFeed();
      return response.data.data;
    },
  });
}

export function useDashboardPrioritySummary() {
  return useQuery({
    queryKey: ['dashboards', 'prioritySummary'],
    queryFn: async () => {
      const response = await dashboardsApi.getPrioritySummary();
      return response.data.data;
    },
  });
}
