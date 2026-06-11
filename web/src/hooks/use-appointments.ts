import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, CreateAppointmentPayload, UpdateAppointmentPayload } from '@/api/appointments.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

export function useAppointments(
  params?: PageOptions & { status?: string; excludeStatus?: string; hasPendingApproval?: string; unassigned?: string },
  enabled = true,
  options?: { refetchInterval?: number },
) {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: async () => {
      const response = await appointmentsApi.getAll(params);
      return { data: response.data.data!, meta: response.data.meta! };
    },
    enabled,
    ...(options?.refetchInterval ? { refetchInterval: options.refetchInterval } : {}),
  });
}

export function useScheduleAssigner() {
  return useQuery({
    queryKey: ['appointments-config', 'schedule-assigner'],
    queryFn: async () => {
      const response = await appointmentsApi.getScheduleAssigner();
      return response.data.data?.assigner_id ?? null;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useMyAppointments() {
  return useQuery({
    queryKey: ['appointments', 'my'],
    queryFn: async () => {
      const response = await appointmentsApi.getMy();
      return response.data.data!;
    },
  });
}

export function useAllAppointments() {
  return useQuery({
    queryKey: ['appointments', 'all'],
    queryFn: async () => {
      const response = await appointmentsApi.getAllNonPaginated();
      return response.data.data || [];
    },
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: ['appointments', id],
    queryFn: async () => {
      const response = await appointmentsApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useWorkOrderAppointments(workOrderId: string) {
  return useQuery({
    queryKey: ['appointments', 'work-order', workOrderId],
    queryFn: async () => {
      const response = await appointmentsApi.getByWorkOrderId(workOrderId);
      return response.data.data!;
    },
    enabled: !!workOrderId,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) => appointmentsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      addNotification({ type: 'success', message: 'Appointment created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create appointment' });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateAppointmentPayload & { id: string }) =>
      appointmentsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      addNotification({ type: 'success', message: 'Appointment updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update appointment' });
    },
  });
}

export function useAssignTechnician() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, agentId }: { id: string; agentId: string }) =>
      appointmentsApi.assignTechnician(id, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      addNotification({ type: 'success', message: 'Technician assigned successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to assign technician' });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      appointmentsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      addNotification({ type: 'success', message: 'Appointment status updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update appointment status' });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => appointmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      addNotification({ type: 'success', message: 'Appointment deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete appointment' });
    },
  });
}

export function useMyPendingAppointmentApprovals(params?: PageOptions, enabled = true) {
  return useQuery({
    queryKey: ['appointments', 'my-approvals', params],
    queryFn: async () => {
      const response = await appointmentsApi.getMyPendingApprovals(params);
      return {
        data: response.data.data!,
        meta: response.data.meta!,
      };
    },
    enabled,
  });
}

export function useAppointmentApprovals(appointmentId: string) {
  return useQuery({
    queryKey: ['appointments', appointmentId, 'approvals'],
    queryFn: async () => {
      const response = await appointmentsApi.getApprovals(appointmentId);
      return response.data.data!;
    },
    enabled: !!appointmentId,
  });
}

export function useProcessAppointmentApproval() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ appointmentId, approvalId, action, comments }: {
      appointmentId: string;
      approvalId: string;
      action: string;
      comments?: string;
    }) => appointmentsApi.processApproval(appointmentId, approvalId, { action, comments }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['document-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      addNotification({ type: 'success', message: 'Approval processed successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to process approval' });
    },
  });
}
