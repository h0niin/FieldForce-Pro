import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { slaConfigApi } from '@/api/sla-config.api';
import { message } from 'antd';

export function useSlaPolicies() {
  return useQuery({
    queryKey: ['sla-policies'],
    queryFn: async () => {
      const res = await slaConfigApi.getPolicies();
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
  });
}

export function useCreateSlaPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await slaConfigApi.createPolicy(payload);
      return res.data.data;
    },
    onSuccess: () => {
      message.success('SLA Policy created successfully');
      queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to create SLA Policy');
    },
  });
}

export function useUpdateSlaPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await slaConfigApi.updatePolicy(id, payload);
      return res.data.data;
    },
    onSuccess: () => {
      message.success('SLA Policy updated successfully');
      queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to update SLA Policy');
    },
  });
}

export function useDeleteSlaPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await slaConfigApi.deletePolicy(id);
      return res.data.data;
    },
    onSuccess: () => {
      message.success('SLA Policy deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to delete SLA Policy');
    },
  });
}

export function useWorkingCalendars() {
  return useQuery({
    queryKey: ['working-calendars'],
    queryFn: async () => {
      const res = await slaConfigApi.getCalendars();
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
  });
}

export function useCreateWorkingCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await slaConfigApi.createCalendar(payload);
      return res.data.data;
    },
    onSuccess: () => {
      message.success('Working Calendar created successfully');
      queryClient.invalidateQueries({ queryKey: ['working-calendars'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to create Working Calendar');
    },
  });
}

export function useUpdateWorkingCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await slaConfigApi.updateCalendar(id, payload);
      return res.data.data;
    },
    onSuccess: () => {
      message.success('Working Calendar updated successfully');
      queryClient.invalidateQueries({ queryKey: ['working-calendars'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to update Working Calendar');
    },
  });
}

export function useDeleteWorkingCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await slaConfigApi.deleteCalendar(id);
      return res.data.data;
    },
    onSuccess: () => {
      message.success('Working Calendar deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['working-calendars'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to delete Working Calendar');
    },
  });
}

export function useEscalations() {
  return useQuery({
    queryKey: ['sla-escalations'],
    queryFn: async () => {
      const res = await slaConfigApi.getEscalations();
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
  });
}

export function useCreateEscalation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await slaConfigApi.createEscalation(payload);
      return res.data.data;
    },
    onSuccess: () => {
      message.success('Escalation created successfully');
      queryClient.invalidateQueries({ queryKey: ['sla-escalations'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to create Escalation');
    },
  });
}

export function useUpdateEscalation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await slaConfigApi.updateEscalation(id, payload);
      return res.data.data;
    },
    onSuccess: () => {
      message.success('Escalation updated successfully');
      queryClient.invalidateQueries({ queryKey: ['sla-escalations'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to update Escalation');
    },
  });
}

export function useDeleteEscalation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await slaConfigApi.deleteEscalation(id);
      return res.data.data;
    },
    onSuccess: () => {
      message.success('Escalation deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['sla-escalations'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to delete Escalation');
    },
  });
}

export function usePauseTriggers() {
  return useQuery({
    queryKey: ['sla-pause-triggers'],
    queryFn: async () => {
      const res = await slaConfigApi.getPauseTriggers();
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
  });
}

export function useCreatePauseTrigger() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await slaConfigApi.createPauseTrigger(payload);
      return res.data.data;
    },
    onSuccess: () => {
      message.success('Pause Trigger created successfully');
      queryClient.invalidateQueries({ queryKey: ['sla-pause-triggers'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to create Pause Trigger');
    },
  });
}

export function useUpdatePauseTrigger() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await slaConfigApi.updatePauseTrigger(id, payload);
      return res.data.data;
    },
    onSuccess: () => {
      message.success('Pause Trigger updated successfully');
      queryClient.invalidateQueries({ queryKey: ['sla-pause-triggers'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to update Pause Trigger');
    },
  });
}

export function useDeletePauseTrigger() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await slaConfigApi.deletePauseTrigger(id);
      return res.data.data;
    },
    onSuccess: () => {
      message.success('Pause Trigger deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['sla-pause-triggers'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to delete Pause Trigger');
    },
  });
}

export function useSlaAnalytics() {
  return useQuery({
    queryKey: ['sla-analytics'],
    queryFn: async () => {
      const res = await slaConfigApi.getAnalytics();
      return res.data.data;
    },
  });
}
