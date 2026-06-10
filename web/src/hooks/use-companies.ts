import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { companiesApi, CreateCompanyPayload, UpdateCompanyPayload } from '@/api/companies.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function useCompanies(params?: PageOptions) {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: async () => {
      const response = await companiesApi.getAll(params);
      return {
        data: response.data.data!,
        meta: response.data.meta!,
      };
    },
  });
}

export function useAllCompanies() {
  return useQuery({
    queryKey: ['companies', 'all'],
    queryFn: async () => {
      const response = await companiesApi.getAllNonPaginated();
      return response.data.data!;
    },
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: ['companies', id],
    queryFn: async () => {
      const response = await companiesApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCompanyInsights(id: string) {
  return useQuery({
    queryKey: ['companies', id, 'insights'],
    queryFn: async () => {
      const response = await companiesApi.getInsights(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateCompanyPayload) => companiesApi.create(payload),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      const name = (response as any)?.data?.data?.name ?? variables.name;
      addNotification({ type: 'success', message: `✓ Company created — ${name}` }, 3000);
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create company' });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateCompanyPayload & { id: string }) =>
      companiesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      addNotification({ type: 'success', message: 'Company updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update company' });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => companiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      addNotification({ type: 'success', message: 'Company deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete company' });
    },
  });
}
