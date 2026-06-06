import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { webformsApi, CreateWebformPayload, UpdateWebformPayload } from '@/api/webforms.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function useWebforms(params?: PageOptions) {
  return useQuery({
    queryKey: ['webforms', params],
    queryFn: async () => {
      const response = await webformsApi.getAll(params);
      return { data: response.data.data!, meta: response.data.meta! };
    },
  });
}

export function useWebform(id: string) {
  return useQuery({
    queryKey: ['webforms', id],
    queryFn: async () => {
      const response = await webformsApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateWebform() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateWebformPayload) => webformsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webforms'] });
      addNotification({ type: 'success', message: 'Webform created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create webform' });
    },
  });
}

export function useUpdateWebform() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateWebformPayload & { id: string }) =>
      webformsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webforms'] });
      addNotification({ type: 'success', message: 'Webform updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update webform' });
    },
  });
}

export function useDeleteWebform() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => webformsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webforms'] });
      addNotification({ type: 'success', message: 'Webform deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete webform' });
    },
  });
}
