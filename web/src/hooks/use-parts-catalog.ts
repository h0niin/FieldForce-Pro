import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { partsCatalogApi, CreatePartsCatalogPayload, UpdatePartsCatalogPayload } from '@/api/parts-catalog.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function usePartsCatalog(params?: PageOptions) {
  return useQuery({
    queryKey: ['parts-catalog', params],
    queryFn: async () => {
      const response = await partsCatalogApi.getAll(params);
      return {
        data: response.data.data!,
        meta: response.data.meta!,
      };
    },
  });
}

export function useAllPartsCatalog() {
  return useQuery({
    queryKey: ['parts-catalog', 'all'],
    queryFn: async () => {
      const response = await partsCatalogApi.getAllNonPaginated();
      return response.data.data!;
    },
  });
}

export function usePartsCatalogItem(id: string) {
  return useQuery({
    queryKey: ['parts-catalog', id],
    queryFn: async () => {
      const response = await partsCatalogApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreatePartsCatalog() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreatePartsCatalogPayload) => partsCatalogApi.create(payload),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parts-catalog'] });
      addNotification({ type: 'success', message: `✓ Part created — ${variables.name}` }, 3000);
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create part' });
    },
  });
}

export function useUpdatePartsCatalog() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdatePartsCatalogPayload & { id: string }) =>
      partsCatalogApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts-catalog'] });
      addNotification({ type: 'success', message: '✓ Part updated' }, 3000);
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update part' });
    },
  });
}

export function useDeletePartsCatalog() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => partsCatalogApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts-catalog'] });
      addNotification({ type: 'success', message: '✓ Part deleted' }, 3000);
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete part' });
    },
  });
}
