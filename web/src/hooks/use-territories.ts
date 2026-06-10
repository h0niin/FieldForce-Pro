import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { territoriesApi, CreateTerritoryPayload, UpdateTerritoryPayload } from '@/api/territories.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function useTerritories(params?: PageOptions) {
  return useQuery({
    queryKey: ['territories', params],
    queryFn: async () => {
      const response = await territoriesApi.getAll(params);
      return {
        data: response.data.data!,
        meta: response.data.meta!,
      };
    },
  });
}

export function useAllTerritories() {
  return useQuery({
    queryKey: ['territories', 'all'],
    queryFn: async () => {
      const response = await territoriesApi.getAllNonPaginated();
      return response.data.data!;
    },
  });
}

export function useTerritory(id: string) {
  return useQuery({
    queryKey: ['territories', id],
    queryFn: async () => {
      const response = await territoriesApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateTerritory() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateTerritoryPayload) => territoriesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territories'] });
      addNotification({ type: 'success', message: 'Territory created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create territory' });
    },
  });
}

export function useUpdateTerritory() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateTerritoryPayload & { id: string }) =>
      territoriesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territories'] });
      addNotification({ type: 'success', message: 'Territory updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update territory' });
    },
  });
}

export function useDeleteTerritory() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => territoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territories'] });
      addNotification({ type: 'success', message: 'Territory deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete territory' });
    },
  });
}
