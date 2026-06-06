import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assetsApi, CreateAssetPayload, UpdateAssetPayload } from '@/api/assets.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function useAssets(params?: PageOptions) {
  return useQuery({
    queryKey: ['assets', params],
    queryFn: async () => {
      const response = await assetsApi.getAll(params);
      return {
        data: response.data.data!,
        meta: response.data.meta!,
      };
    },
  });
}

export function useAllAssets() {
  return useQuery({
    queryKey: ['assets', 'all'],
    queryFn: async () => {
      const response = await assetsApi.getAllNonPaginated();
      return response.data.data!;
    },
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: ['assets', id],
    queryFn: async () => {
      const response = await assetsApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateAssetPayload) => assetsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      addNotification({ type: 'success', message: 'Asset created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create asset' });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateAssetPayload & { id: string }) =>
      assetsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      addNotification({ type: 'success', message: 'Asset updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update asset' });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => assetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      addNotification({ type: 'success', message: 'Asset deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete asset' });
    },
  });
}
