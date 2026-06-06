import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workOrderAttachmentsApi, CreateWorkOrderAttachmentPayload, UpdateWorkOrderAttachmentPayload } from '@/api/work-order-attachments.api';
import { useNotificationStore } from '@/store/notification.store';

export function useWorkOrderAttachments(workOrderId: string) {
  return useQuery({
    queryKey: ['work-order-attachments', workOrderId],
    queryFn: async () => {
      const response = await workOrderAttachmentsApi.getByWorkOrderId(workOrderId);
      return response.data.data!;
    },
    enabled: !!workOrderId,
  });
}

export function useWorkOrderAttachment(id: string) {
  return useQuery({
    queryKey: ['work-order-attachments', 'detail', id],
    queryFn: async () => {
      const response = await workOrderAttachmentsApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useUploadWorkOrderAttachment() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ file, workOrderId }: { file: File; workOrderId: string }) =>
      workOrderAttachmentsApi.upload(file, workOrderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order-attachments'] });
      addNotification({ type: 'success', message: 'File uploaded successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to upload file' });
    },
  });
}

export function useCreateWorkOrderAttachment() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateWorkOrderAttachmentPayload) => workOrderAttachmentsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order-attachments'] });
      addNotification({ type: 'success', message: 'Attachment added successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to add attachment' });
    },
  });
}

export function useUpdateWorkOrderAttachment() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateWorkOrderAttachmentPayload & { id: string }) =>
      workOrderAttachmentsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order-attachments'] });
      addNotification({ type: 'success', message: 'Attachment updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update attachment' });
    },
  });
}

export function useDeleteWorkOrderAttachment() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => workOrderAttachmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order-attachments'] });
      addNotification({ type: 'success', message: 'Attachment deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete attachment' });
    },
  });
}
