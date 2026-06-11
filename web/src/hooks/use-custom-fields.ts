import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  customFieldsApi,
  CreateCustomFieldPayload,
  UpdateCustomFieldPayload,
  BatchUpdateFieldItem,
} from '@/api/custom-fields.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function useCustomFields(params?: PageOptions) {
  return useQuery({
    queryKey: ['custom-fields', params],
    queryFn: async () => {
      const response = await customFieldsApi.getAll(params);
      return { data: response.data.data!, meta: response.data.meta! };
    },
  });
}

export function useCustomFieldsByModule(module: string) {
  return useQuery({
    queryKey: ['custom-fields', 'module', module],
    queryFn: async () => {
      const response = await customFieldsApi.getByModule(module);
      return response.data.data!;
    },
    enabled: !!module,
  });
}

export function useCustomField(id: string) {
  return useQuery({
    queryKey: ['custom-fields', id],
    queryFn: async () => {
      const response = await customFieldsApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateCustomField() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateCustomFieldPayload) => customFieldsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      addNotification({ type: 'success', message: 'Custom field created' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create custom field' });
    },
  });
}

export function useUpdateCustomField() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateCustomFieldPayload & { id: string }) =>
      customFieldsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      addNotification({ type: 'success', message: 'Custom field updated' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update custom field' });
    },
  });
}

export function useDeleteCustomField() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => customFieldsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      addNotification({ type: 'success', message: 'Custom field deleted' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete custom field' });
    },
  });
}

export function useBatchUpdateCustomFields() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (fields: BatchUpdateFieldItem[]) => customFieldsApi.batchUpdate(fields),
    onSuccess: (_, fields) => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      addNotification({ type: 'success', message: `Layout saved (${fields.length} fields updated)` });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to save layout' });
    },
  });
}
