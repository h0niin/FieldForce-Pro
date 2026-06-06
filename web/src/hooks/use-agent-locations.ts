import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agentLocationsApi, CreateAgentLocationPayload } from '@/api/agent-locations.api';
import { useNotificationStore } from '@/store/notification.store';

export function useAgentLatestLocation(userId: string) {
  return useQuery({
    queryKey: ['agent-locations', 'latest', userId],
    queryFn: async () => {
      const response = await agentLocationsApi.getLatestByUserId(userId);
      return response.data.data!;
    },
    enabled: !!userId,
    refetchInterval: 30000, // Refresh every 30 seconds for live tracking
  });
}

export function useAgentLocationHistory(userId: string, params?: { start?: string; end?: string }) {
  return useQuery({
    queryKey: ['agent-locations', 'history', userId, params],
    queryFn: async () => {
      const response = await agentLocationsApi.getHistoryByUserId(userId, params);
      return response.data.data!;
    },
    enabled: !!userId,
  });
}

export function useCreateAgentLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAgentLocationPayload) => agentLocationsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-locations'] });
    },
  });
}

export function useBatchCreateAgentLocations() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateAgentLocationPayload[]) => agentLocationsApi.createBatch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-locations'] });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to sync location data' });
    },
  });
}
