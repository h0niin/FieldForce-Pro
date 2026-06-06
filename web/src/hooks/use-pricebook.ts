import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pricebookApi, CreatePricebookItemPayload, UpdatePricebookItemPayload } from '@/api/pricebook.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function usePricebookItems(params?: PageOptions) {
  return useQuery({
    queryKey: ['pricebook', params],
    queryFn: async () => {
      const response = await pricebookApi.getAll(params);
      return { data: response.data.data!, meta: response.data.meta! };
    },
  });
}

export function usePricebookItem(id: string) {
  return useQuery({
    queryKey: ['pricebook', id],
    queryFn: async () => {
      const response = await pricebookApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreatePricebookItem() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreatePricebookItemPayload) => pricebookApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricebook'] });
      addNotification({ type: 'success', message: 'Pricebook item created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create pricebook item' });
    },
  });
}

export function useUpdatePricebookItem() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdatePricebookItemPayload & { id: string }) =>
      pricebookApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricebook'] });
      addNotification({ type: 'success', message: 'Pricebook item updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update pricebook item' });
    },
  });
}

export function useDeletePricebookItem() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => pricebookApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricebook'] });
      addNotification({ type: 'success', message: 'Pricebook item deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete pricebook item' });
    },
  });
}
