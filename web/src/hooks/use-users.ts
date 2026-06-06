import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi, type InviteUserPayload } from '@/api/users.api';
import type { PageOptions } from '@/types/api.types';
import type { User } from '@/types/models.types';
import { useNotificationStore } from '@/store/notification.store';

export function useAgents() {
  return useQuery({
    queryKey: ['users', 'agents'],
    queryFn: async () => {
      const response = await usersApi.getAgents();
      return response.data.data!;
    },
  });
}

export function useUsers(params?: PageOptions) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const response = await usersApi.getAll(params);
      return {
        data: response.data.data!,
        meta: response.data.meta!,
      };
    },
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const response = await usersApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: Partial<User> & { password?: string }) => usersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addNotification({ type: 'success', message: 'User created successfully' });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<User> & { id: string }) =>
      usersApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addNotification({ type: 'success', message: 'User updated successfully' });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addNotification({ type: 'success', message: 'User deleted successfully' });
    },
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: InviteUserPayload) => usersApi.invite(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err?.response?.data?.message || 'Failed to send invitation';
      addNotification({ type: 'error', message: msg });
    },
  });
}

export function useCompanyUsage() {
  return useQuery({
    queryKey: ['users-usage'],
    queryFn: async () => {
      const res = await usersApi.getUsage();
      return res.data.data!;
    },
  });
}
