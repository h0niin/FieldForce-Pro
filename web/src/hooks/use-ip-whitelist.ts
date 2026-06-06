import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ipWhitelistApi,
  CreateIPWhitelistPayload,
  UpdateIPWhitelistPayload,
} from '@/api/ip-whitelist.api';
import { useNotificationStore } from '@/store/notification.store';
import { getApiErrorMessage } from '@/utils/get-api-error';

const QUERY_KEY = 'ip-whitelist';
const CONFIG_KEY = 'ip-whitelist-config';

function getLocalIP(): Promise<string> {
  return new Promise((resolve, reject) => {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      const parts = event.candidate.candidate.split(' ');
      const ip = parts[4];
      if (ip && /^\d{1,3}(\.\d{1,3}){3}$/.test(ip) && !ip.startsWith('0.')) {
        pc.close();
        resolve(ip);
      }
    };

    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .catch(reject);

    setTimeout(() => {
      pc.close();
      reject(new Error('Could not detect local IP'));
    }, 3000);
  });
}

export function useMyIP() {
  return useQuery({
    queryKey: ['my-local-ip'],
    queryFn: () => getLocalIP(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useIPWhitelist() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const response = await ipWhitelistApi.getAll();
      return response.data.data!;
    },
  });
}

export function useIPWhitelistConfig() {
  return useQuery({
    queryKey: [CONFIG_KEY],
    queryFn: async () => {
      const response = await ipWhitelistApi.getConfig();
      return response.data.data!;
    },
  });
}

export function useCreateIPWhitelist() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateIPWhitelistPayload) => ipWhitelistApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONFIG_KEY] });
      addNotification({ type: 'success', message: 'IP address added to whitelist successfully' });
    },
    onError: (error) => {
      addNotification({ type: 'error', message: getApiErrorMessage(error, 'Failed to add IP address') });
    },
  });
}

export function useUpdateIPWhitelist() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateIPWhitelistPayload & { id: string }) =>
      ipWhitelistApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      addNotification({ type: 'success', message: 'IP whitelist entry updated successfully' });
    },
    onError: (error) => {
      addNotification({ type: 'error', message: getApiErrorMessage(error, 'Failed to update IP whitelist entry') });
    },
  });
}

export function useDeleteIPWhitelist() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => ipWhitelistApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONFIG_KEY] });
      addNotification({ type: 'success', message: 'IP address removed from whitelist successfully' });
    },
    onError: (error) => {
      addNotification({ type: 'error', message: getApiErrorMessage(error, 'Failed to remove IP address') });
    },
  });
}

export function useToggleIPWhitelist() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (enabled: boolean) => ipWhitelistApi.setEnabled(enabled),
    onSuccess: (_data, enabled) => {
      queryClient.invalidateQueries({ queryKey: [CONFIG_KEY] });
      addNotification({
        type: 'success',
        message: `IP whitelisting ${enabled ? 'enabled' : 'disabled'} successfully`,
      });
    },
    onError: (error) => {
      addNotification({ type: 'error', message: getApiErrorMessage(error, 'Failed to toggle IP whitelisting') });
    },
  });
}
