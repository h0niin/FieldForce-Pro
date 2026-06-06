import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  userDocumentsApi,
  CreateUserDocumentPayload,
  UpdateUserDocumentPayload,
} from '@/api/user-documents.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function useUserDocuments(params?: PageOptions) {
  return useQuery({
    queryKey: ['user-documents', params],
    queryFn: async () => {
      const response = await userDocumentsApi.getAll(params);
      return {
        data: response.data.data!,
        meta: response.data.meta!,
      };
    },
  });
}

export function useUserDocumentsByUserId(userId: string) {
  return useQuery({
    queryKey: ['user-documents', 'user', userId],
    queryFn: async () => {
      const response = await userDocumentsApi.getByUserId(userId);
      return response.data.data!;
    },
    enabled: !!userId,
  });
}

export function useExpiringDocuments(days: number = 30) {
  return useQuery({
    queryKey: ['user-documents', 'expiring', days],
    queryFn: async () => {
      const response = await userDocumentsApi.getExpiring(days);
      return response.data.data!;
    },
  });
}

export function useUserDocument(id: string) {
  return useQuery({
    queryKey: ['user-documents', id],
    queryFn: async () => {
      const response = await userDocumentsApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateUserDocument() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateUserDocumentPayload) => userDocumentsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-documents'] });
      addNotification({ type: 'success', message: 'Document uploaded successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to upload document' });
    },
  });
}

export function useUpdateUserDocument() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateUserDocumentPayload & { id: string }) =>
      userDocumentsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-documents'] });
      addNotification({ type: 'success', message: 'Document updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update document' });
    },
  });
}

export function useDeleteUserDocument() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => userDocumentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-documents'] });
      addNotification({ type: 'success', message: 'Document deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete document' });
    },
  });
}

export function useVerifyDocument() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => userDocumentsApi.verify(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-documents'] });
      addNotification({ type: 'success', message: 'Document verified successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to verify document' });
    },
  });
}

export function useUnverifyDocument() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => userDocumentsApi.unverify(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-documents'] });
      addNotification({ type: 'success', message: 'Document unverified successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to unverify document' });
    },
  });
}
