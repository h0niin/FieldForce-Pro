import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tripsApi, StartTripPayload, EndTripPayload, UpdateTripPayload } from '@/api/trips.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function useTrips(params?: PageOptions) {
  return useQuery({
    queryKey: ['trips', params],
    queryFn: async () => {
      const response = await tripsApi.getAll(params);
      return { data: response.data.data!, meta: response.data.meta! };
    },
  });
}

export function useTrip(id: string) {
  return useQuery({
    queryKey: ['trips', id],
    queryFn: async () => {
      const response = await tripsApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useUserTrips(userId: string) {
  return useQuery({
    queryKey: ['trips', 'user', userId],
    queryFn: async () => {
      const response = await tripsApi.getByUserId(userId);
      return response.data.data!;
    },
    enabled: !!userId,
  });
}

export function useStartTrip() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: StartTripPayload) => tripsApi.start(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      addNotification({ type: 'success', message: 'Trip started' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to start trip' });
    },
  });
}

export function useEndTrip() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: EndTripPayload & { id: string }) =>
      tripsApi.end(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      addNotification({ type: 'success', message: 'Trip ended' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to end trip' });
    },
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateTripPayload & { id: string }) =>
      tripsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      addNotification({ type: 'success', message: 'Trip updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update trip' });
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => tripsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      addNotification({ type: 'success', message: 'Trip deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete trip' });
    },
  });
}
