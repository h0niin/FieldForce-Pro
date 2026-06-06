import api from './axios-instance';
import type { ApiResponse } from '@/types/api.types';

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  subscription_plan: string;
  max_users: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_count: number;
  service_request_count: number;
  admin_email: string | null;
  admin_user_id: string | null;
}

export interface TenantOverview extends TenantSummary {
  domain: string | null;
  logo_url: string | null;
  settings: Record<string, unknown>;
  admin_name: string | null;
  work_order_count: number;
  invoice_count: number;
  subscription_plan_id: string | null;
  subscription_status: string;
  subscription_end: string | null;
  custom_limits: Record<string, number | null> | null;
}

export interface TenantUsageData {
  plan_name: string;
  subscription_status: string;
  subscription_end: string | null;
  usage: {
    total_users: { current: number; limit: number | null };
    appointments: { current: number; limit: number | null };
  };
}

export interface SubscriptionPlanSummary {
  id: string;
  name: string;
  max_total_users: number | null;
  max_appointments_monthly: number | null;
  price_monthly: number;
  price_yearly: number;
  currency?: string;
  features?: string[];
}


export interface UpdateSubscriptionPayload {
  plan_id?: string;
  subscription_status?: string;
  subscription_end?: string | null;
  max_users_override?: number | null;
  max_appointments_override?: number | null;
}

export interface PlatformHealth {
  tenants: { total: number; active: number; suspended: number };
  users: { total: number };
  service_requests: { total: number };
  timestamp: string;
}

export const superAdminApi = {
  listTenants() {
    return api.get<ApiResponse<TenantSummary[]>>('/admin/tenants');
  },

  getTenant(id: string) {
    return api.get<ApiResponse<TenantSummary>>(`/admin/tenants/${id}`);
  },

  getTenantOverview(id: string) {
    return api.get<ApiResponse<TenantOverview>>(`/admin/tenants/${id}/overview`);
  },

  suspendTenant(id: string) {
    return api.patch<ApiResponse<TenantSummary>>(`/admin/tenants/${id}/suspend`);
  },

  activateTenant(id: string) {
    return api.patch<ApiResponse<TenantSummary>>(`/admin/tenants/${id}/activate`);
  },

  getPlatformHealth() {
    return api.get<ApiResponse<PlatformHealth>>('/admin/platform-health');
  },

  updateProfile(payload: { first_name?: string; last_name?: string }) {
    return api.patch<ApiResponse<Record<string, unknown>>>('/admin/profile', payload);
  },

  changeEmail(payload: { new_email: string; current_password: string }) {
    return api.patch<ApiResponse<{ email: string }>>('/admin/profile/email', payload);
  },

  listSubscriptionPlans() {
    return api.get<ApiResponse<SubscriptionPlanSummary[]>>('/admin/subscription-plans');
  },

  getTenantUsage(id: string) {
    return api.get<ApiResponse<TenantUsageData>>(`/admin/tenants/${id}/usage`);
  },

  updateTenantSubscription(id: string, payload: UpdateSubscriptionPayload) {
    return api.patch<ApiResponse<TenantOverview>>(`/admin/tenants/${id}/subscription`, payload);
  },

  updateSubscriptionPlan(id: string, payload: Partial<SubscriptionPlanSummary>) {
    return api.patch<ApiResponse<SubscriptionPlanSummary>>(`/admin/subscription-plans/${id}`, payload);
  },
};

