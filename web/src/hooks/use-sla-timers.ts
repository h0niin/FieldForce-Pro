import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { slaTimersApi } from '@/api/sla-timers.api';
import { useNotificationStore } from '@/store/notification.store';

export function useSlaTimer(workOrderId: string) {
  return useQuery({
    queryKey: ['sla-timer', workOrderId],
    queryFn: async () => {
      const response = await slaTimersApi.getByWorkOrder(workOrderId);
      return response.data.data ?? null;
    },
    enabled: !!workOrderId,
    refetchInterval: 30_000, // Poll every 30 seconds to keep timer data fresh
  });
}

export function useSlaStats() {
  return useQuery({
    queryKey: ['sla-stats'],
    queryFn: async () => {
      const response = await slaTimersApi.getStats();
      return response.data.data!;
    },
  });
}

export function usePauseSlaTimer() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => slaTimersApi.pauseTimer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-timer'] });
      addNotification({ type: 'success', message: 'SLA timer paused' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to pause SLA timer' });
    },
  });
}

export function useResumeSlaTimer() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => slaTimersApi.resumeTimer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-timer'] });
      addNotification({ type: 'success', message: 'SLA timer resumed' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to resume SLA timer' });
    },
  });
}
