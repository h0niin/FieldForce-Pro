import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { serviceLocationsApi, CreateServiceLocationPayload, UpdateServiceLocationPayload } from '@/api/service-locations.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function useServiceLocations(params?: PageOptions) {
  return useQuery({
    queryKey: ['service-locations', params],
    queryFn: async () => {
      const response = await serviceLocationsApi.getAll(params);
      return {
        data: response.data.data!,
        meta: response.data.meta!,
      };
    },
  });
}

export function useAllServiceLocations() {
  return useQuery({
    queryKey: ['service-locations', 'all'],
    queryFn: async () => {
      const response = await serviceLocationsApi.getAllNonPaginated();
      return response.data.data!;
    },
  });
}

export function useServiceLocationsByContact(contactId: string) {
  return useQuery({
    queryKey: ['service-locations', 'contact', contactId],
    queryFn: async () => {
      const response = await serviceLocationsApi.getByContact(contactId);
      return response.data.data!;
    },
    enabled: !!contactId,
  });
}

export function useServiceLocationsByCompany(companyId: string) {
  return useQuery({
    queryKey: ['service-locations', 'company', companyId],
    queryFn: async () => {
      const response = await serviceLocationsApi.getByCompany(companyId);
      return response.data.data!;
    },
    enabled: !!companyId,
  });
}

export function useServiceLocation(id: string) {
  return useQuery({
    queryKey: ['service-locations', id],
    queryFn: async () => {
      const response = await serviceLocationsApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateServiceLocation() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateServiceLocationPayload) => serviceLocationsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-locations'] });
      addNotification({ type: 'success', message: 'Service location created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create service location' });
    },
  });
}

export function useUpdateServiceLocation() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateServiceLocationPayload & { id: string }) =>
      serviceLocationsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-locations'] });
      addNotification({ type: 'success', message: 'Service location updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update service location' });
    },
  });
}

export function useDeleteServiceLocation() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => serviceLocationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-locations'] });
      addNotification({ type: 'success', message: 'Service location deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete service location' });
    },
  });
}
