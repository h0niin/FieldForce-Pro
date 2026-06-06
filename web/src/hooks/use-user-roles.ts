import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userRolesApi } from '@/api/user-roles.api';
import { useNotificationStore } from '@/store/notification.store';

export function useUserRoles(userId: string) {
  return useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      const response = await userRolesApi.getUserRoles(userId);
      return response.data.data!;
    },
    enabled: !!userId,
  });
}

export function useAssignRoles() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ userId, roleIds }: { userId: string; roleIds: string[] }) =>
      userRolesApi.assignRoles(userId, roleIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-roles', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addNotification({ type: 'success', message: 'Roles assigned successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to assign roles' });
    },
  });
}

export function useUnassignRole() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      userRolesApi.unassignRole(userId, roleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-roles', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addNotification({ type: 'success', message: 'Role removed successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to remove role' });
    },
  });
}

export function useUnassignAllRoles() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (userId: string) => userRolesApi.unassignAllRoles(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['user-roles', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addNotification({ type: 'success', message: 'All roles removed successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to remove roles' });
    },
  });
}
