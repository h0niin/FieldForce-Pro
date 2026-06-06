import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { superAdminApi, type UpdateSubscriptionPayload, type SubscriptionPlanSummary } from '@/api/super-admin.api';

import { useNotificationStore } from '@/store/notification.store';

export function usePlatformHealth() {
  return useQuery({
    queryKey: ['platform-health'],
    queryFn: async () => {
      const res = await superAdminApi.getPlatformHealth();
      return res.data.data!;
    },
  });
}

export function useAllTenants() {
  return useQuery({
    queryKey: ['admin-tenants'],
    queryFn: async () => {
      const res = await superAdminApi.listTenants();
      return res.data.data!;
    },
  });
}

export function useTenantOverview(id: string) {
  return useQuery({
    queryKey: ['admin-tenant-overview', id],
    queryFn: async () => {
      const res = await superAdminApi.getTenantOverview(id);
      return res.data.data!;
    },
    enabled: !!id,
  });
}

export function useSuspendTenant() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => superAdminApi.suspendTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['platform-health'] });
      addNotification({ type: 'success', message: 'Tenant suspended successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to suspend tenant' });
    },
  });
}

export function useActivateTenant() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => superAdminApi.activateTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['platform-health'] });
      addNotification({ type: 'success', message: 'Tenant activated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to activate tenant' });
    },
  });
}

export function useUpdateSuperAdminProfile() {
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: { first_name?: string; last_name?: string }) =>
      superAdminApi.updateProfile(payload),
    onSuccess: () => {
      addNotification({ type: 'success', message: 'Profile updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update profile' });
    },
  });
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const res = await superAdminApi.listSubscriptionPlans();
      return res.data.data!;
    },
  });
}

export function useUpdateSubscriptionPlan() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<SubscriptionPlanSummary> & { id: string }) =>
      superAdminApi.updateSubscriptionPlan(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      addNotification({ type: 'success', message: 'Subscription plan updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update subscription plan' });
    },
  });
}


export function useTenantUsage(id: string) {
  return useQuery({
    queryKey: ['admin-tenant-usage', id],
    queryFn: async () => {
      const res = await superAdminApi.getTenantUsage(id);
      return res.data.data!;
    },
    enabled: !!id,
  });
}

export function useUpdateTenantSubscription() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateSubscriptionPayload & { id: string }) =>
      superAdminApi.updateTenantSubscription(id, payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenant-overview', vars.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-tenant-usage', vars.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      addNotification({ type: 'success', message: 'Subscription updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update subscription' });
    },
  });
}

export function useChangeSuperAdminEmail() {
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: { new_email: string; current_password: string }) =>
      superAdminApi.changeEmail(payload),
    onSuccess: () => {
      addNotification({ type: 'success', message: 'Email updated successfully' });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err?.response?.data?.message || 'Failed to update email';
      addNotification({ type: 'error', message: msg });
    },
  });
}
