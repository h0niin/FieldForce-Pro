import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { slaTimersApi, type SlaTimersByWorkOrder } from '@/api/sla-timers.api';
import { useNotificationStore } from '@/store/notification.store';

const EMPTY_TIMERS: SlaTimersByWorkOrder = {
  acceptance: null,
  travel: null,
  on_site_prep: null,
  work_completion: null,
  total_resolution: null,
};

export function useSlaTimers(workOrderId: string) {
  return useQuery({
    queryKey: ['sla-timers', workOrderId],
    queryFn: async () => {
      const response = await slaTimersApi.getByWorkOrder(workOrderId);
      return response.data.data ?? EMPTY_TIMERS;
    },
    enabled: !!workOrderId,
    refetchInterval: 30_000,
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
      queryClient.invalidateQueries({ queryKey: ['sla-timers'] });
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
      queryClient.invalidateQueries({ queryKey: ['sla-timers'] });
      addNotification({ type: 'success', message: 'SLA timer resumed' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to resume SLA timer' });
    },
  });
}
