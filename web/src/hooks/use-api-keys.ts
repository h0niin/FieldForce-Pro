import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiKeysApi, CreateApiKeyPayload } from '@/api/api-keys.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function useApiKeys(params?: PageOptions) {
  return useQuery({
    queryKey: ['api-keys', params],
    queryFn: async () => {
      const response = await apiKeysApi.getAll(params);
      return { data: response.data.data!, meta: response.data.meta! };
    },
  });
}

export function useApiKey(id: string) {
  return useQuery({
    queryKey: ['api-keys', id],
    queryFn: async () => {
      const response = await apiKeysApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateApiKeyPayload) => apiKeysApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      addNotification({ type: 'success', message: 'API key created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create API key' });
    },
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => apiKeysApi.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      addNotification({ type: 'success', message: 'API key revoked' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to revoke API key' });
    },
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => apiKeysApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      addNotification({ type: 'success', message: 'API key deleted' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete API key' });
    },
  });
}
