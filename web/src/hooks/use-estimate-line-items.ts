import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { estimateLineItemsApi, CreateEstimateLineItemPayload, UpdateEstimateLineItemPayload } from '@/api/estimate-line-items.api';
import { useNotificationStore } from '@/store/notification.store';

export function useEstimateLineItems(estimateId: string) {
  return useQuery({
    queryKey: ['estimate-line-items', estimateId],
    queryFn: async () => {
      const response = await estimateLineItemsApi.getByEstimateId(estimateId);
      return response.data.data!;
    },
    enabled: !!estimateId,
  });
}

export function useEstimateLineItem(id: string) {
  return useQuery({
    queryKey: ['estimate-line-items', 'detail', id],
    queryFn: async () => {
      const response = await estimateLineItemsApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateEstimateLineItem() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateEstimateLineItemPayload) => estimateLineItemsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-line-items'] });
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      addNotification({ type: 'success', message: 'Line item added successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to add line item' });
    },
  });
}

export function useUpdateEstimateLineItem() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateEstimateLineItemPayload & { id: string }) =>
      estimateLineItemsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-line-items'] });
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      addNotification({ type: 'success', message: 'Line item updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update line item' });
    },
  });
}

export function useDeleteEstimateLineItem() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => estimateLineItemsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-line-items'] });
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      addNotification({ type: 'success', message: 'Line item deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete line item' });
    },
  });
}
