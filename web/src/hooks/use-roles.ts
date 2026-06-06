import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rolesApi, CreateRolePayload, UpdateRolePayload } from '@/api/roles.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function useRoles(params?: PageOptions) {
  return useQuery({
    queryKey: ['roles', params],
    queryFn: async () => {
      const response = await rolesApi.getAll(params);
      return {
        data: response.data.data!,
        meta: response.data.meta!,
      };
    },
  });
}

export function useAllRoles() {
  return useQuery({
    queryKey: ['roles', 'all'],
    queryFn: async () => {
      const response = await rolesApi.getAllNonPaginated();
      return response.data.data!;
    },
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: ['roles', id],
    queryFn: async () => {
      const response = await rolesApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useRolePermissions(id: string) {
  return useQuery({
    queryKey: ['roles', id, 'permissions'],
    queryFn: async () => {
      const response = await rolesApi.getPermissions(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

function extractErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || fallback;
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateRolePayload) => rolesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      addNotification({ type: 'success', message: 'Role created successfully' });
    },
    onError: (err) => {
      addNotification({ type: 'error', message: extractErrorMessage(err, 'Failed to create role') });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateRolePayload & { id: string }) =>
      rolesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      addNotification({ type: 'success', message: 'Role updated successfully' });
    },
    onError: (err) => {
      addNotification({ type: 'error', message: extractErrorMessage(err, 'Failed to update role') });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      addNotification({ type: 'success', message: 'Role deleted successfully' });
    },
    onError: (err) => {
      addNotification({ type: 'error', message: extractErrorMessage(err, 'Failed to delete role') });
    },
  });
}

export function useAssignPermissions() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      rolesApi.assignPermissions(roleId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      addNotification({ type: 'success', message: 'Permissions assigned successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to assign permissions' });
    },
  });
}

export function useRemovePermissions() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      rolesApi.removePermissions(roleId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      addNotification({ type: 'success', message: 'Permissions removed successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to remove permissions' });
    },
  });
}
