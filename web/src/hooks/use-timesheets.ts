import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { timesheetsApi, CreateTimesheetPayload, UpdateTimesheetPayload } from '@/api/timesheets.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function useTimesheets(params?: PageOptions) {
  return useQuery({
    queryKey: ['timesheets', params],
    queryFn: async () => {
      const response = await timesheetsApi.getAll(params);
      return { data: response.data.data!, meta: response.data.meta! };
    },
  });
}

export function useTimesheet(id: string) {
  return useQuery({
    queryKey: ['timesheets', id],
    queryFn: async () => {
      const response = await timesheetsApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useUserTimesheets(userId: string) {
  return useQuery({
    queryKey: ['timesheets', 'user', userId],
    queryFn: async () => {
      const response = await timesheetsApi.getByUserId(userId);
      return response.data.data!;
    },
    enabled: !!userId,
  });
}

export function useCreateTimesheet() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateTimesheetPayload) => timesheetsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      addNotification({ type: 'success', message: 'Timesheet created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create timesheet' });
    },
  });
}

export function useUpdateTimesheet() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateTimesheetPayload & { id: string }) =>
      timesheetsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      addNotification({ type: 'success', message: 'Timesheet updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update timesheet' });
    },
  });
}

export function useApproveTimesheet() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => timesheetsApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      addNotification({ type: 'success', message: 'Timesheet approved' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to approve timesheet' });
    },
  });
}

export function useRejectTimesheet() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => timesheetsApi.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      addNotification({ type: 'success', message: 'Timesheet rejected' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to reject timesheet' });
    },
  });
}

export function useDeleteTimesheet() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => timesheetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      addNotification({ type: 'success', message: 'Timesheet deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete timesheet' });
    },
  });
}
