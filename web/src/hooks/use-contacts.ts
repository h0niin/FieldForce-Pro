import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contactsApi, CreateContactPayload, UpdateContactPayload } from '@/api/contacts.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function useContacts(params?: PageOptions) {
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: async () => {
      const response = await contactsApi.getAll(params);
      return {
        data: response.data.data!,
        meta: response.data.meta!,
      };
    },
  });
}

export function useAllContacts() {
  return useQuery({
    queryKey: ['contacts', 'all'],
    queryFn: async () => {
      const response = await contactsApi.getAllNonPaginated();
      return response.data.data!;
    },
  });
}

export function useContactsByCompany(companyId: string | null) {
  return useQuery({
    queryKey: ['contacts', 'company', companyId],
    queryFn: async () => {
      const response = await contactsApi.getByCompany(companyId!);
      return response.data.data!;
    },
    enabled: !!companyId,
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: async () => {
      const response = await contactsApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useContactInsights(id: string) {
  return useQuery({
    queryKey: ['contacts', id, 'insights'],
    queryFn: async () => {
      const response = await contactsApi.getInsights(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateContactPayload) => contactsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      addNotification({ type: 'success', message: 'Contact created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create contact' });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateContactPayload & { id: string }) =>
      contactsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      addNotification({ type: 'success', message: 'Contact updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update contact' });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      addNotification({ type: 'success', message: 'Contact deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete contact' });
    },
  });
}
