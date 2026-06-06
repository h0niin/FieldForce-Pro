import { useMutation } from '@tanstack/react-query';
import { magicLinksApi, type GenerateMagicLinkPayload, type CompleteOnboardingPayload } from '@/api/magic-links.api';
import { useNotificationStore } from '@/store/notification.store';

export function useGenerateMagicLink() {
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: GenerateMagicLinkPayload) => magicLinksApi.generate(payload),
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err?.response?.data?.message || 'Failed to generate magic link';
      addNotification({ type: 'error', message: msg });
    },
  });
}

export function useCompleteOnboarding() {
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CompleteOnboardingPayload) => magicLinksApi.completeOnboarding(payload),
    onSuccess: () => {
      addNotification({ type: 'success', message: 'Onboarding complete! Welcome aboard.' });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err?.response?.data?.message || 'Failed to complete onboarding';
      addNotification({ type: 'error', message: msg });
    },
  });
}
