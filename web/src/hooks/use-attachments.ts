import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axios-instance';
import { useNotificationStore } from '@/store/notification.store';

export function useRequestAttachments(requestId: string) {
  return useQuery({
    queryKey: ['attachments', requestId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/attachments/${requestId}`);
      return response.data;
    },
    enabled: !!requestId,
  });
}

export function useUploadAttachments() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: async (payload: { requestId: string; files: File[] }) => {
      const formData = new FormData();
      formData.append('requestId', payload.requestId);
      payload.files.forEach((file) => {
        formData.append('files', file);
      });
      const response = await axiosInstance.post('/attachments/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attachments', variables.requestId] });
      addNotification({ type: 'success', message: 'Attachments uploaded successfully' });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to upload attachments';
      addNotification({ type: 'error', message: msg });
    },
  });
}
