import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { webhooksApi, CreateWebhookPayload, UpdateWebhookPayload } from '@/api/webhooks.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function useWebhooks(params?: PageOptions) {
  return useQuery({
    queryKey: ['webhooks', params],
    queryFn: async () => {
      const response = await webhooksApi.getAll(params);
      return { data: response.data.data!, meta: response.data.meta! };
    },
  });
}

export function useWebhook(id: string) {
  return useQuery({
    queryKey: ['webhooks', id],
    queryFn: async () => {
      const response = await webhooksApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateWebhookPayload) => webhooksApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      addNotification({ type: 'success', message: 'Webhook created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create webhook' });
    },
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateWebhookPayload & { id: string }) =>
      webhooksApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      addNotification({ type: 'success', message: 'Webhook updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update webhook' });
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => webhooksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      addNotification({ type: 'success', message: 'Webhook deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete webhook' });
    },
  });
}
