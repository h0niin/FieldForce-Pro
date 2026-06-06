import axios from 'axios';
import api from './axios-instance';
import { API_URL } from '@/utils/constants';
import type { ApiResponse } from '@/types/api.types';

const publicAxios = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export interface SubscriptionMagicLink {
  id: string;
  token?: string;
  plan_id: string;
  created_by: string;
  status: 'active' | 'expired' | 'used' | 'disabled';
  expires_at: string;
  max_uses: number;
  used_count: number;
  notes: string | null;
  signup_url?: string;
  created_at: string;
  updated_at: string;
  plan?: { id: string; name: string; price_monthly: number; currency?: string };

  creator?: { id: string; email: string; first_name: string; last_name: string };
}

export interface GenerateLinkPayload {
  plan_id: string;
  max_uses?: number;
  expires_in_days?: number;
  notes?: string;
}

export interface MagicLinkValidation {
  valid: boolean;
  plan_name: string;
  price_monthly: number;
  price_yearly: number;
  max_total_users: number | null;
  features: string[];
  expires_at: string;
  max_uses: number;
  used_count: number;
}

export interface SignupFromMagicLinkPayload {
  token: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  company_name: string;
  phone?: string;
}

export const subscriptionMagicLinksApi = {
  generate(payload: GenerateLinkPayload) {
    return api.post<ApiResponse<SubscriptionMagicLink & { signup_url: string }>>('/admin/magic-links', payload);
  },

  getAll() {
    return api.get<ApiResponse<SubscriptionMagicLink[]>>('/admin/magic-links');
  },

  disable(id: string) {
    return api.patch<ApiResponse<SubscriptionMagicLink>>(`/admin/magic-links/${id}/disable`);
  },

  remove(id: string) {
    return api.delete<ApiResponse<null>>(`/admin/magic-links/${id}`);
  },
};

export const signupMagicLinkApi = {
  validate(token: string) {
    return publicAxios.get<ApiResponse<MagicLinkValidation>>(`${API_URL}/auth/signup-magic-link/validate?token=${token}`);
  },

  signup(payload: SignupFromMagicLinkPayload) {
    return publicAxios.post<ApiResponse<any>>(`${API_URL}/auth/signup-from-magic-link`, payload, { withCredentials: true });
  },
};
