import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workOrderLineItemsApi, CreateWorkOrderLineItemPayload, UpdateWorkOrderLineItemPayload } from '@/api/work-order-line-items.api';
import { useNotificationStore } from '@/store/notification.store';

export function useWorkOrderLineItems(workOrderId: string) {
  return useQuery({
    queryKey: ['work-order-line-items', workOrderId],
    queryFn: async () => {
      const response = await workOrderLineItemsApi.getByWorkOrderId(workOrderId);
      return response.data.data!;
    },
    enabled: !!workOrderId,
  });
}

export function useWorkOrderLineItem(id: string) {
  return useQuery({
    queryKey: ['work-order-line-items', 'detail', id],
    queryFn: async () => {
      const response = await workOrderLineItemsApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateWorkOrderLineItem() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateWorkOrderLineItemPayload) => workOrderLineItemsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order-line-items'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      addNotification({ type: 'success', message: 'Line item added successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to add line item' });
    },
  });
}

export function useUpdateWorkOrderLineItem() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateWorkOrderLineItemPayload & { id: string }) =>
      workOrderLineItemsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order-line-items'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      addNotification({ type: 'success', message: 'Line item updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update line item' });
    },
  });
}

export function useDeleteWorkOrderLineItem() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => workOrderLineItemsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order-line-items'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      addNotification({ type: 'success', message: 'Line item deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete line item' });
    },
  });
}
