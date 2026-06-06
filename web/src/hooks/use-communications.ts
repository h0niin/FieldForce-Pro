import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  communicationsApi,
  CreateCommunicationPayload,
  UpdateCommunicationPayload,
} from '@/api/communications.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function useCommunications(params?: PageOptions) {
  return useQuery({
    queryKey: ['communications', params],
    queryFn: async () => {
      const response = await communicationsApi.getAll(params);
      return { data: response.data.data!, meta: response.data.meta! };
    },
  });
}

export function useCommunication(id: string) {
  return useQuery({
    queryKey: ['communications', id],
    queryFn: async () => {
      const response = await communicationsApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useContactCommunications(contactId: string) {
  return useQuery({
    queryKey: ['communications', 'contact', contactId],
    queryFn: async () => {
      const response = await communicationsApi.getByContactId(contactId);
      return response.data.data!;
    },
    enabled: !!contactId,
  });
}

export function useCreateCommunication() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateCommunicationPayload) => communicationsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      addNotification({ type: 'success', message: 'Message sent successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to send message' });
    },
  });
}

export function useUpdateCommunication() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateCommunicationPayload & { id: string }) =>
      communicationsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      addNotification({ type: 'success', message: 'Message updated' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update message' });
    },
  });
}

export function useDeleteCommunication() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => communicationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      addNotification({ type: 'success', message: 'Message deleted' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete message' });
    },
  });
}
