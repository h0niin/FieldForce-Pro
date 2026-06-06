import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { templatesApi, CreateTemplatePayload, UpdateTemplatePayload } from '@/api/templates.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function useTemplates(params?: PageOptions) {
  return useQuery({
    queryKey: ['templates', params],
    queryFn: async () => {
      const response = await templatesApi.getAll(params);
      return { data: response.data.data!, meta: response.data.meta! };
    },
  });
}

export function useTemplatesByType(type: string) {
  return useQuery({
    queryKey: ['templates', 'type', type],
    queryFn: async () => {
      const response = await templatesApi.getByType(type);
      return response.data.data!;
    },
    enabled: !!type,
  });
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: ['templates', id],
    queryFn: async () => {
      const response = await templatesApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateTemplatePayload) => templatesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      addNotification({ type: 'success', message: 'Template created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create template' });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateTemplatePayload & { id: string }) =>
      templatesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      addNotification({ type: 'success', message: 'Template updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update template' });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => templatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      addNotification({ type: 'success', message: 'Template deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete template' });
    },
  });
}
