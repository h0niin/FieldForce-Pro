import axios from 'axios';
import api from './axios-instance';
import { API_URL } from '@/utils/constants';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { Payment, PaymentGateway } from '@/types/models.types';

const publicAxios = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

export interface CreatePaymentPayload {
  invoice_id: string;
  amount: number;
  method?: string;
  gateway_transaction_id?: string;
  paid_at?: string;
  notes?: string;
  received_by?: string;
  custom_fields?: Record<string, unknown>;
}

export interface PortalPaymentPayload {
  invoice_token: string;
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
  screenshot_url?: string;
}

export interface UpdatePaymentPayload {
  amount?: number;
  method?: string;
  gateway_transaction_id?: string;
  status?: string;
  paid_at?: string;
  notes?: string;
  custom_fields?: Record<string, unknown>;
}

export const paymentsApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<Payment[]>>('/payments', { params });
  },

  getAllNonPaginated() {
    return api.get<ApiResponse<Payment[]>>('/payments/all');
  },

  getById(id: string) {
    return api.get<ApiResponse<Payment>>(`/payments/${id}`);
  },

  getByInvoiceId(invoiceId: string) {
    return api.get<ApiResponse<Payment[]>>(`/payments/invoice/${invoiceId}`);
  },

  create(payload: CreatePaymentPayload) {
    return api.post<ApiResponse<Payment>>('/payments', payload);
  },

  update(id: string, payload: UpdatePaymentPayload) {
    return api.put<ApiResponse<Payment>>(`/payments/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/payments/${id}`);
  },

  getPendingVerification() {
    return api.get<ApiResponse<Payment[]>>('/payments/pending-verification');
  },

  confirm(id: string) {
    return api.patch<ApiResponse<Payment>>(`/payments/${id}/confirm`);
  },

  reject(id: string, reason: string) {
    return api.patch<ApiResponse<Payment>>(`/payments/${id}/reject`, { reason });
  },

  submitFromPortal(payload: PortalPaymentPayload) {
    return publicAxios.post<ApiResponse<Payment>>(`${API_URL}/payments/portal`, payload);
  },
};

export interface CreatePaymentGatewayPayload {
  gateway_name: string;
  api_key_encrypted?: string;
  webhook_secret_encrypted?: string;
  is_active?: boolean;
  is_test_mode?: boolean;
  settings?: Record<string, unknown>;
}

export interface UpdatePaymentGatewayPayload {
  gateway_name?: string;
  api_key_encrypted?: string;
  webhook_secret_encrypted?: string;
  is_active?: boolean;
  is_test_mode?: boolean;
  settings?: Record<string, unknown>;
}

export const paymentGatewaysApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<PaymentGateway[]>>('/payment-gateways', { params });
  },

  getById(id: string) {
    return api.get<ApiResponse<PaymentGateway>>(`/payment-gateways/${id}`);
  },

  create(payload: CreatePaymentGatewayPayload) {
    return api.post<ApiResponse<PaymentGateway>>('/payment-gateways', payload);
  },

  update(id: string, payload: UpdatePaymentGatewayPayload) {
    return api.put<ApiResponse<PaymentGateway>>(`/payment-gateways/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/payment-gateways/${id}`);
  },
};
