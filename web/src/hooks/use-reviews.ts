import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reviewsApi, CreateReviewPayload, UpdateReviewPayload } from '@/api/reviews.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function useReviews(params?: PageOptions) {
  return useQuery({
    queryKey: ['reviews', params],
    queryFn: async () => {
      const response = await reviewsApi.getAll(params);
      return { data: response.data.data!, meta: response.data.meta! };
    },
  });
}

export function useReview(id: string) {
  return useQuery({
    queryKey: ['reviews', id],
    queryFn: async () => {
      const response = await reviewsApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useWorkOrderReviews(workOrderId: string) {
  return useQuery({
    queryKey: ['reviews', 'work-order', workOrderId],
    queryFn: async () => {
      const response = await reviewsApi.getByWorkOrderId(workOrderId);
      return response.data.data!;
    },
    enabled: !!workOrderId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => reviewsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      addNotification({ type: 'success', message: 'Review submitted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to submit review' });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateReviewPayload & { id: string }) =>
      reviewsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      addNotification({ type: 'success', message: 'Review updated' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update review' });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => reviewsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      addNotification({ type: 'success', message: 'Review deleted' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete review' });
    },
  });
}
