import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { subscriptionMagicLinksApi, type GenerateLinkPayload } from '@/api/subscription-magic-links.api';
import { useNotificationStore } from '@/store/notification.store';

export function useSubscriptionMagicLinks() {
  return useQuery({
    queryKey: ['subscription-magic-links'],
    queryFn: async () => {
      const res = await subscriptionMagicLinksApi.getAll();
      return res.data.data!;
    },
  });
}

export function useGenerateSubscriptionMagicLink() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: GenerateLinkPayload) => subscriptionMagicLinksApi.generate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-magic-links'] });
      addNotification({ type: 'success', message: 'Magic link generated successfully' });
    },
    onError: () => addNotification({ type: 'error', message: 'Failed to generate magic link' }),
  });
}

export function useDisableSubscriptionMagicLink() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => subscriptionMagicLinksApi.disable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-magic-links'] });
      addNotification({ type: 'success', message: 'Link disabled' });
    },
    onError: () => addNotification({ type: 'error', message: 'Failed to disable link' }),
  });
}

export function useDeleteSubscriptionMagicLink() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => subscriptionMagicLinksApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-magic-links'] });
      addNotification({ type: 'success', message: 'Link deleted' });
    },
    onError: () => addNotification({ type: 'error', message: 'Failed to delete link' }),
  });
}
