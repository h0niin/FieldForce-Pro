import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { permissionsApi, CreatePermissionPayload, UpdatePermissionPayload } from '@/api/permissions.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function usePermissions(params?: PageOptions) {
  return useQuery({
    queryKey: ['permissions', params],
    queryFn: async () => {
      const response = await permissionsApi.getAll(params);
      return {
        data: response.data.data!,
        meta: response.data.meta!,
      };
    },
  });
}

export function useAllPermissions() {
  return useQuery({
    queryKey: ['permissions', 'all'],
    queryFn: async () => {
      const response = await permissionsApi.getAllNonPaginated();
      return response.data.data!;
    },
  });
}

export function usePermissionsByModule(module: string) {
  return useQuery({
    queryKey: ['permissions', 'module', module],
    queryFn: async () => {
      const response = await permissionsApi.getByModule(module);
      return response.data.data!;
    },
    enabled: !!module,
  });
}

export function usePermission(id: string) {
  return useQuery({
    queryKey: ['permissions', id],
    queryFn: async () => {
      const response = await permissionsApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreatePermission() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreatePermissionPayload) => permissionsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      addNotification({ type: 'success', message: 'Permission created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create permission' });
    },
  });
}

export function useBulkCreatePermissions() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payloads: CreatePermissionPayload[]) => permissionsApi.bulkCreate(payloads),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      addNotification({ type: 'success', message: 'Permissions created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create permissions' });
    },
  });
}

export function useUpdatePermission() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdatePermissionPayload & { id: string }) =>
      permissionsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      addNotification({ type: 'success', message: 'Permission updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update permission' });
    },
  });
}

export function useDeletePermission() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => permissionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      addNotification({ type: 'success', message: 'Permission deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete permission' });
    },
  });
}

export function useSeedPermissions() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: () => permissionsApi.seedAll(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      const data = response.data.data;
      addNotification({
        type: 'success',
        message: `Permissions seeded: ${data?.created} created, ${data?.skipped} already existed`,
      });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to seed permissions' });
    },
  });
}
