import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { maintenancePlansApi, CreateMaintenancePlanPayload, UpdateMaintenancePlanPayload } from '@/api/maintenance-plans.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function useMaintenancePlans(params?: PageOptions) {
  return useQuery({
    queryKey: ['maintenance-plans', params],
    queryFn: async () => {
      const response = await maintenancePlansApi.getAll(params);
      return {
        data: response.data.data!,
        meta: response.data.meta!,
      };
    },
  });
}

export function useAssetMaintenancePlans(assetId: string) {
  return useQuery({
    queryKey: ['maintenance-plans', 'asset', assetId],
    queryFn: async () => {
      const response = await maintenancePlansApi.getByAssetId(assetId);
      return response.data.data!;
    },
    enabled: !!assetId,
  });
}

export function useMaintenancePlan(id: string) {
  return useQuery({
    queryKey: ['maintenance-plans', id],
    queryFn: async () => {
      const response = await maintenancePlansApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateMaintenancePlan() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateMaintenancePlanPayload) => maintenancePlansApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-plans'] });
      addNotification({ type: 'success', message: 'Maintenance plan created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create maintenance plan' });
    },
  });
}

export function useUpdateMaintenancePlan() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateMaintenancePlanPayload & { id: string }) =>
      maintenancePlansApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-plans'] });
      addNotification({ type: 'success', message: 'Maintenance plan updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update maintenance plan' });
    },
  });
}

export function useDeleteMaintenancePlan() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => maintenancePlansApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-plans'] });
      addNotification({ type: 'success', message: 'Maintenance plan deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete maintenance plan' });
    },
  });
}
