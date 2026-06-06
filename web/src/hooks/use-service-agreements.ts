import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  serviceAgreementsApi,
  CreateServiceAgreementPayload,
  UpdateServiceAgreementPayload,
} from '@/api/service-agreements.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function useServiceAgreements(params?: PageOptions) {
  return useQuery({
    queryKey: ['service-agreements', params],
    queryFn: async () => {
      const response = await serviceAgreementsApi.getAll(params);
      return { data: response.data.data!, meta: response.data.meta! };
    },
  });
}

export function useServiceAgreement(id: string) {
  return useQuery({
    queryKey: ['service-agreements', id],
    queryFn: async () => {
      const response = await serviceAgreementsApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateServiceAgreement() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateServiceAgreementPayload) => serviceAgreementsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-agreements'] });
      addNotification({ type: 'success', message: 'Service agreement created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create service agreement' });
    },
  });
}

export function useUpdateServiceAgreement() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateServiceAgreementPayload & { id: string }) =>
      serviceAgreementsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-agreements'] });
      addNotification({ type: 'success', message: 'Service agreement updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update service agreement' });
    },
  });
}

export function useUpdateServiceAgreementStatus() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      serviceAgreementsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-agreements'] });
      addNotification({ type: 'success', message: 'Agreement status updated' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update agreement status' });
    },
  });
}

export function useRenewServiceAgreement() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; end_date: string; value?: number }) =>
      serviceAgreementsApi.renew(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-agreements'] });
      addNotification({ type: 'success', message: 'Agreement renewed successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to renew agreement' });
    },
  });
}

export function useDeleteServiceAgreement() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => serviceAgreementsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-agreements'] });
      addNotification({ type: 'success', message: 'Service agreement deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete service agreement' });
    },
  });
}
