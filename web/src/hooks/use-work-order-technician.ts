import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  workOrderTechnicianApi,
  type FinishJobPayload,
  type StartTripPayload,
} from '@/api/work-order-technician.api';
import { useNotificationStore } from '@/store/notification.store';

const SESSION_KEY = (workOrderId: string) => ['technician-session', workOrderId];

export function useWorkOrderSession(workOrderId: string) {
  return useQuery({
    queryKey: SESSION_KEY(workOrderId),
    queryFn: async () => {
      const response = await workOrderTechnicianApi.getSession(workOrderId);
      return response.data.data ?? null;
    },
    enabled: !!workOrderId,
    refetchInterval: false,
  });
}

function useSessionMutation(
  workOrderId: string,
  mutationFn: () => Promise<unknown>,
  successMessage: string,
  errorMessage: string,
) {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_KEY(workOrderId) });
      queryClient.invalidateQueries({ queryKey: ['sla-timers', workOrderId] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      addNotification({ type: 'success', message: successMessage });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const msg = error?.response?.data?.message || errorMessage;
      addNotification({ type: 'error', message: msg });
    },
  });
}

export function useInitSession(workOrderId: string) {
  return useSessionMutation(
    workOrderId,
    () => workOrderTechnicianApi.initSession(workOrderId),
    'Session initialized',
    'Failed to initialize session',
  );
}

export function useApproveWorkOrder(workOrderId: string) {
  return useSessionMutation(
    workOrderId,
    () => workOrderTechnicianApi.approve(workOrderId),
    'Work order approved',
    'Failed to approve work order',
  );
}

export function useRejectWorkOrder(workOrderId: string) {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (reason: string) => workOrderTechnicianApi.reject(workOrderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_KEY(workOrderId) });
      queryClient.invalidateQueries({ queryKey: ['sla-timers', workOrderId] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      addNotification({ type: 'info', message: 'Work order rejected' });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const msg = error?.response?.data?.message || 'Failed to reject work order';
      addNotification({ type: 'error', message: msg });
    },
  });
}

export function useStartTrip(workOrderId: string) {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: StartTripPayload) => workOrderTechnicianApi.startTrip(workOrderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_KEY(workOrderId) });
      queryClient.invalidateQueries({ queryKey: ['sla-timers', workOrderId] });
      addNotification({ type: 'success', message: 'Trip started' });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const msg = error?.response?.data?.message || 'Failed to start trip';
      addNotification({ type: 'error', message: msg });
    },
  });
}

export function useMarkReached(workOrderId: string) {
  return useSessionMutation(
    workOrderId,
    () => workOrderTechnicianApi.markReached(workOrderId),
    'Arrival marked',
    'Failed to mark arrival',
  );
}

export function useConfirmItems(workOrderId: string) {
  return useSessionMutation(
    workOrderId,
    () => workOrderTechnicianApi.confirmItems(workOrderId),
    'Items confirmed',
    'Failed to confirm items',
  );
}

export function useConfirmCall(workOrderId: string) {
  return useSessionMutation(
    workOrderId,
    () => workOrderTechnicianApi.confirmCall(workOrderId),
    'Client call confirmed',
    'Failed to confirm call',
  );
}

export function useStartWork(workOrderId: string) {
  return useSessionMutation(
    workOrderId,
    () => workOrderTechnicianApi.startWork(workOrderId),
    'Work started',
    'Failed to start work',
  );
}

export function usePauseWork(workOrderId: string) {
  return useSessionMutation(
    workOrderId,
    () => workOrderTechnicianApi.pauseWork(workOrderId),
    'Work paused',
    'Failed to pause work',
  );
}

export function useResumeWork(workOrderId: string) {
  return useSessionMutation(
    workOrderId,
    () => workOrderTechnicianApi.resumeWork(workOrderId),
    'Work resumed',
    'Failed to resume work',
  );
}

export function useMarkBeforePhotos(workOrderId: string) {
  return useSessionMutation(
    workOrderId,
    () => workOrderTechnicianApi.markBeforePhotos(workOrderId),
    'Before photos marked',
    'Failed to mark before photos',
  );
}

export function useMarkAfterPhotos(workOrderId: string) {
  return useSessionMutation(
    workOrderId,
    () => workOrderTechnicianApi.markAfterPhotos(workOrderId),
    'After photos marked',
    'Failed to mark after photos',
  );
}

export function useFinishJob(workOrderId: string) {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: FinishJobPayload) => workOrderTechnicianApi.finish(workOrderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_KEY(workOrderId) });
      queryClient.invalidateQueries({ queryKey: ['sla-timers', workOrderId] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      addNotification({ type: 'success', message: 'Job finished successfully!' });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      const msg = error?.response?.data?.message || 'Failed to finish job';
      addNotification({ type: 'error', message: msg });
    },
  });
}
