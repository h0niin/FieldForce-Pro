import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workOrdersApi, CreateWorkOrderPayload, UpdateWorkOrderPayload } from '@/api/work-orders.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function useWorkOrders(params?: PageOptions & { status?: string, contact_id?: string, company_id?: string, asset_id?: string }) {
  return useQuery({
    queryKey: ['work-orders', params],
    queryFn: async () => {
      const response = await workOrdersApi.getAll(params);
      return {
        data: response.data.data!,
        meta: response.data.meta!,
      };
    },
  });
}

export function useMyWorkOrders(params?: PageOptions) {
  return useQuery({
    queryKey: ['work-orders', 'my', params],
    queryFn: async () => {
      const response = await workOrdersApi.getMyWorkOrders(params);
      return {
        data: response.data.data!,
        meta: response.data.meta!,
      };
    },
  });
}

export function useAllWorkOrders() {
  return useQuery({
    queryKey: ['work-orders', 'all'],
    queryFn: async () => {
      const response = await workOrdersApi.getAllNonPaginated();
      return response.data.data!;
    },
  });
}

export function useWorkOrder(id: string) {
  return useQuery({
    queryKey: ['work-orders', id],
    queryFn: async () => {
      const response = await workOrdersApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateWorkOrderPayload) => workOrdersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      addNotification({ type: 'success', message: 'Work order created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create work order' });
    },
  });
}

export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateWorkOrderPayload & { id: string }) =>
      workOrdersApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      addNotification({ type: 'success', message: 'Work order updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update work order' });
    },
  });
}

export function useUpdateWorkOrderStatus() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      workOrdersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      addNotification({ type: 'success', message: 'Work order status updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update work order status' });
    },
  });
}

export function useDeleteWorkOrder() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => workOrdersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      addNotification({ type: 'success', message: 'Work order deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete work order' });
    },
  });
}

export function useSubmitWorkOrderForApproval() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; workflow_id: string; due_date?: string }) =>
      workOrdersApi.submitForApproval(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['document-approvals'] });
      addNotification({ type: 'success', message: 'Work order submitted for approval' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to submit work order for approval' });
    },
  });
}

export function useMyJobs(params?: PageOptions & { status?: string }) {
  return useQuery({
    queryKey: ['work-orders', 'my-jobs', params],
    queryFn: async () => {
      const response = await workOrdersApi.getMyJobs(params);
      return {
        data: response.data.data!,
        meta: response.data.meta!,
      };
    },
  });
}

export function useAcceptJob() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);
  return useMutation({
    mutationFn: (id: string) => workOrdersApi.acceptJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      addNotification({ type: 'success', message: 'Job accepted successfully' });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to accept job';
      addNotification({ type: 'error', message: msg });
    },
  });
}

export function useDeclineJob() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => workOrdersApi.declineJob(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      addNotification({ type: 'success', message: 'Job declined' });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to decline job';
      addNotification({ type: 'error', message: msg });
    },
  });
}
