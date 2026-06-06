import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { feedbackApi, CreateFeedbackPayload } from '@/api/feedback.api';
import { useNotificationStore } from '@/store/notification.store';

export function useWorkOrderFeedback(workOrderId: string) {
  return useQuery({
    queryKey: ['feedback', 'work-order', workOrderId],
    queryFn: async () => {
      const response = await feedbackApi.getByWorkOrder(workOrderId);
      return response.data.data;
    },
    enabled: !!workOrderId,
  });
}

export function useCreateFeedback() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateFeedbackPayload) => feedbackApi.create(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['feedback', 'work-order', variables.work_order_id] });
      addNotification({ type: 'success', message: 'Feedback submitted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to submit feedback' });
    },
  });
}
