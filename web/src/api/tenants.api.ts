import api from './axios-instance';
import type { ApiResponse } from '@/types/api.types';
import type { Tenant } from '@/types/models.types';

export interface TenantPaymentConfig {
  upi_vpa?: string;
  upi_name?: string;
  qr_image_url?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  bank_name?: string;
  instructions?: string;
}

export const tenantsApi = {
  getPaymentSettings() {
    return api.get<ApiResponse<TenantPaymentConfig>>('/tenants/me/payment-settings');
  },

  updatePaymentSettings(payload: TenantPaymentConfig) {
    return api.put<ApiResponse<TenantPaymentConfig>>('/tenants/me/payment-settings', payload);
  },

  getAll() {
    return api.get<ApiResponse<Tenant[]>>('/tenants');
  },

  getById(id: string) {
    return api.get<ApiResponse<Tenant>>(`/tenants/${id}`);
  },

  create(payload: Partial<Tenant>) {
    return api.post<ApiResponse<Tenant>>('/tenants', payload);
  },

  update(id: string, payload: Partial<Tenant>) {
    return api.put<ApiResponse<Tenant>>(`/tenants/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/tenants/${id}`);
  },
};
