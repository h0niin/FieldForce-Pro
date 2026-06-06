import api from './axios-instance';
import type { ApiResponse } from '@/types/api.types';

export interface GenerateMagicLinkPayload {
  target_user_id: string;
  purpose: 'super_admin_access' | 'admin_onboarding' | 'user_access' | 'user_onboarding';
}

export interface MagicLinkResult {
  link: string;
  expires_at: string;
  purpose: string;
}

export interface CompleteOnboardingPayload {
  first_name: string;
  last_name: string;
  new_password: string;
  phone?: string;
}

export const magicLinksApi = {
  generate(payload: GenerateMagicLinkPayload) {
    return api.post<ApiResponse<MagicLinkResult>>('/auth/magic-link/generate', payload);
  },

  verify(token: string) {
    return api.get<ApiResponse<{ user: Record<string, unknown>; purpose: string }>>('/auth/magic/verify', {
      params: { token },
    });
  },

  completeOnboarding(payload: CompleteOnboardingPayload) {
    return api.patch<ApiResponse<null>>('/auth/magic/complete-onboarding', payload);
  },
};
