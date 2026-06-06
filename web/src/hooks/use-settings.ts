import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi, UpdateSettingPayload } from '@/api/settings.api';
import { useNotificationStore } from '@/store/notification.store';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await settingsApi.getAll();
      return response.data.data!;
    },
  });
}

export function useSetting(key: string) {
  return useQuery({
    queryKey: ['settings', key],
    queryFn: async () => {
      const response = await settingsApi.getByKey(key);
      return response.data.data!;
    },
    enabled: !!key,
  });
}

export function useSettingsByCategory(category: string) {
  return useQuery({
    queryKey: ['settings', 'category', category],
    queryFn: async () => {
      const response = await settingsApi.getByCategory(category);
      return response.data.data!;
    },
    enabled: !!category,
  });
}

export function useUpsertSetting() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ key, ...payload }: UpdateSettingPayload & { key: string }) =>
      settingsApi.upsert(key, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      addNotification({ type: 'success', message: 'Setting saved successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to save setting' });
    },
  });
}
