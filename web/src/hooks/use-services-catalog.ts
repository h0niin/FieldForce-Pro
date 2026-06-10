import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { servicesCatalogApi, CreateServiceCatalogPayload, UpdateServiceCatalogPayload } from '@/api/services-catalog.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function useServicesCatalog(params?: PageOptions) {
  return useQuery({
    queryKey: ['services-catalog', params],
    queryFn: async () => {
      const response = await servicesCatalogApi.getAll(params);
      return {
        data: response.data.data!,
        meta: response.data.meta!,
      };
    },
  });
}

export function useAllServicesCatalog() {
  return useQuery({
    queryKey: ['services-catalog', 'all'],
    queryFn: async () => {
      const response = await servicesCatalogApi.getAllNonPaginated();
      return response.data.data!;
    },
  });
}

export function useServiceCatalogItem(id: string) {
  return useQuery({
    queryKey: ['services-catalog', id],
    queryFn: async () => {
      const response = await servicesCatalogApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateServiceCatalog() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateServiceCatalogPayload) => servicesCatalogApi.create(payload),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['services-catalog'] });
      addNotification({ type: 'success', message: `✓ Service created — ${variables.name}` }, 3000);
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create service' });
    },
  });
}

export function useUpdateServiceCatalog() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateServiceCatalogPayload & { id: string }) =>
      servicesCatalogApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-catalog'] });
      addNotification({ type: 'success', message: '✓ Service updated' }, 3000);
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update service' });
    },
  });
}

export function useDeleteServiceCatalog() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => servicesCatalogApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services-catalog'] });
      addNotification({ type: 'success', message: '✓ Service deleted' }, 3000);
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete service' });
    },
  });
}
