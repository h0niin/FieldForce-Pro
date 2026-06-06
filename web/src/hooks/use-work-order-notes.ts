import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workOrderNotesApi, CreateWorkOrderNotePayload, UpdateWorkOrderNotePayload } from '@/api/work-order-notes.api';
import { useNotificationStore } from '@/store/notification.store';

export function useWorkOrderNotes(workOrderId: string) {
  return useQuery({
    queryKey: ['work-order-notes', workOrderId],
    queryFn: async () => {
      const response = await workOrderNotesApi.getByWorkOrderId(workOrderId);
      return response.data.data!;
    },
    enabled: !!workOrderId,
  });
}

export function useWorkOrderNote(id: string) {
  return useQuery({
    queryKey: ['work-order-notes', 'detail', id],
    queryFn: async () => {
      const response = await workOrderNotesApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateWorkOrderNote() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateWorkOrderNotePayload) => workOrderNotesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order-notes'] });
      addNotification({ type: 'success', message: 'Note added successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to add note' });
    },
  });
}

export function useUpdateWorkOrderNote() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateWorkOrderNotePayload & { id: string }) =>
      workOrderNotesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order-notes'] });
      addNotification({ type: 'success', message: 'Note updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update note' });
    },
  });
}

export function useDeleteWorkOrderNote() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => workOrderNotesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order-notes'] });
      addNotification({ type: 'success', message: 'Note deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete note' });
    },
  });
}
