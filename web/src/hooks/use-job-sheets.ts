import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  jobSheetTemplatesApi,
  jobSheetInstancesApi,
  jobSheetItemsApi,
  CreateJobSheetTemplatePayload,
  UpdateJobSheetTemplatePayload,
  CreateJobSheetInstancePayload,
  UpdateJobSheetInstancePayload,
  CreateJobSheetItemPayload,
  UpdateJobSheetItemPayload,
} from '@/api/job-sheets.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

// Templates
export function useJobSheetTemplates(params?: PageOptions) {
  return useQuery({
    queryKey: ['job-sheet-templates', params],
    queryFn: async () => {
      const response = await jobSheetTemplatesApi.getAll(params);
      return { data: response.data.data!, meta: response.data.meta! };
    },
  });
}

export function useAllJobSheetTemplates() {
  return useQuery({
    queryKey: ['job-sheet-templates', 'all'],
    queryFn: async () => {
      const response = await jobSheetTemplatesApi.getAllNonPaginated();
      return response.data.data!;
    },
  });
}

export function useJobSheetTemplate(id: string) {
  return useQuery({
    queryKey: ['job-sheet-templates', id],
    queryFn: async () => {
      const response = await jobSheetTemplatesApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateJobSheetTemplate() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateJobSheetTemplatePayload) => jobSheetTemplatesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-sheet-templates'] });
      addNotification({ type: 'success', message: 'Job sheet template created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create job sheet template' });
    },
  });
}

export function useUpdateJobSheetTemplate() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateJobSheetTemplatePayload & { id: string }) =>
      jobSheetTemplatesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-sheet-templates'] });
      addNotification({ type: 'success', message: 'Job sheet template updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update job sheet template' });
    },
  });
}

export function useDeleteJobSheetTemplate() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => jobSheetTemplatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-sheet-templates'] });
      addNotification({ type: 'success', message: 'Job sheet template deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete job sheet template' });
    },
  });
}

// Instances
export function useJobSheetInstances(params?: PageOptions & { status?: string; excludeStatus?: string }, enabled = true) {
  return useQuery({
    queryKey: ['job-sheet-instances', params],
    queryFn: async () => {
      const response = await jobSheetInstancesApi.getAll(params);
      return { data: response.data.data!, meta: response.data.meta! };
    },
    enabled,
  });
}

export function useMyJobSheetDrafts(params?: PageOptions, enabled = true) {
  return useQuery({
    queryKey: ['job-sheet-instances', 'my-drafts', params],
    queryFn: async () => {
      const response = await jobSheetInstancesApi.getMyDrafts(params);
      return { data: response.data.data!, meta: response.data.meta! };
    },
    enabled,
  });
}

export function useMyJobSheetApprovals(params?: PageOptions, enabled = true) {
  return useQuery({
    queryKey: ['job-sheet-instances', 'my-approvals', params],
    queryFn: async () => {
      const response = await jobSheetInstancesApi.getMyApprovals(params);
      return { data: response.data.data!, meta: response.data.meta! };
    },
    enabled,
  });
}

export function useJobSheetInstance(id: string) {
  return useQuery({
    queryKey: ['job-sheet-instances', id],
    queryFn: async () => {
      const response = await jobSheetInstancesApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useAppointmentJobSheets(appointmentId: string) {
  return useQuery({
    queryKey: ['job-sheet-instances', 'appointment', appointmentId],
    queryFn: async () => {
      const response = await jobSheetInstancesApi.getByAppointmentId(appointmentId);
      return response.data.data!;
    },
    enabled: !!appointmentId,
  });
}

export function useWorkOrderJobSheets(workOrderId: string) {
  return useQuery({
    queryKey: ['job-sheet-instances', 'work-order', workOrderId],
    queryFn: async () => {
      const response = await jobSheetInstancesApi.getByWorkOrderId(workOrderId);
      return response.data.data!;
    },
    enabled: !!workOrderId,
  });
}

export function useCreateJobSheetInstance() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateJobSheetInstancePayload) => jobSheetInstancesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-sheet-instances'] });
      addNotification({ type: 'success', message: 'Job sheet instance created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create job sheet instance' });
    },
  });
}

export function useUpdateJobSheetInstance() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateJobSheetInstancePayload & { id: string }) =>
      jobSheetInstancesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-sheet-instances'] });
      addNotification({ type: 'success', message: 'Job sheet instance updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update job sheet instance' });
    },
  });
}

// Items
export function useJobSheetItems(instanceId: string) {
  return useQuery({
    queryKey: ['job-sheet-items', 'instance', instanceId],
    queryFn: async () => {
      const response = await jobSheetItemsApi.getByInstanceId(instanceId);
      return response.data.data!;
    },
    enabled: !!instanceId,
  });
}

export function useCreateJobSheetItem() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateJobSheetItemPayload) => jobSheetItemsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-sheet-items'] });
      addNotification({ type: 'success', message: 'Job sheet item created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create job sheet item' });
    },
  });
}

export function useUpdateJobSheetItem() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateJobSheetItemPayload & { id: string }) =>
      jobSheetItemsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-sheet-items'] });
      addNotification({ type: 'success', message: 'Job sheet item updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update job sheet item' });
    },
  });
}

export function useDeleteJobSheetItem() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => jobSheetItemsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-sheet-items'] });
      addNotification({ type: 'success', message: 'Job sheet item deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete job sheet item' });
    },
  });
}
