import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { slaConfigApi } from '@/api/sla-config.api';
import { message } from 'antd';

export function useSlaPolicies() {
  return useQuery({
    queryKey: ['sla-policies'],
    queryFn: async () => {
      const res = await slaConfigApi.getPolicies();
      return res.data.data;
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

export function useWorkingCalendars() {
  return useQuery({
    queryKey: ['working-calendars'],
    queryFn: async () => {
      const res = await slaConfigApi.getCalendars();
      return res.data.data;
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

export function useEscalations() {
  return useQuery({
    queryKey: ['sla-escalations'],
    queryFn: async () => {
      const res = await slaConfigApi.getEscalations();
      return res.data.data;
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

export function usePauseTriggers() {
  return useQuery({
    queryKey: ['sla-pause-triggers'],
    queryFn: async () => {
      const res = await slaConfigApi.getPauseTriggers();
      return res.data.data;
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
