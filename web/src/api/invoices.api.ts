import axios from 'axios';
import api from './axios-instance';
import { API_URL } from '@/utils/constants';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type { Invoice, InvoiceLineItem } from '@/types/models.types';

const publicAxios = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

export interface CreateInvoicePayload {
  work_order_id?: string;
  contact_id?: string;
  subtotal?: number;
  tax?: number;
  discount?: number;
  total?: number;
  due_date?: string;
  currency?: string;
  notes?: string;
  custom_fields?: Record<string, unknown>;
}

export interface UpdateInvoicePayload {
  contact_id?: string;
  subtotal?: number;
  tax?: number;
  discount?: number;
  total?: number;
  due_date?: string;
  paid_amount?: number;
  currency?: string;
  notes?: string;
  pdf_url?: string;
  custom_fields?: Record<string, unknown>;
}

export interface CreateInvoiceLineItemPayload {
  invoice_id: string;
  type?: 'service' | 'part' | 'travel' | 'other';
  name: string;
  description?: string;
  quantity?: number;
  unit_price?: number;
  tax_rate?: number;
  discount?: number;
  total?: number;
}

export interface UpdateInvoiceLineItemPayload {
  type?: string;
  name?: string;
  description?: string;
  quantity?: number;
  unit_price?: number;
  tax_rate?: number;
  discount?: number;
  total?: number;
}

export const invoicesApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<Invoice[]>>('/invoices', { params });
  },

  getAllNonPaginated() {
    return api.get<ApiResponse<Invoice[]>>('/invoices/all');
  },

  getById(id: string) {
    return api.get<ApiResponse<Invoice>>(`/invoices/${id}`);
  },

  create(payload: CreateInvoicePayload) {
    return api.post<ApiResponse<Invoice>>('/invoices', payload);
  },

  update(id: string, payload: UpdateInvoicePayload) {
    return api.put<ApiResponse<Invoice>>(`/invoices/${id}`, payload);
  },

  updateStatus(id: string, status: string) {
    return api.patch<ApiResponse<Invoice>>(`/invoices/${id}/status`, { status });
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/invoices/${id}`);
  },

  generatePortalLink(id: string) {
    return api.post<ApiResponse<{ portal_url: string; public_token: string }>>(`/invoices/${id}/generate-portal-link`);
  },

  getByPublicToken(token: string) {
    return publicAxios.get<ApiResponse<Invoice>>(`${API_URL}/invoices/public/${token}`);
  },
};

export const invoiceLineItemsApi = {
  getByInvoiceId(invoiceId: string) {
    return api.get<ApiResponse<InvoiceLineItem[]>>(`/invoice-line-items/invoice/${invoiceId}`);
  },

  getById(id: string) {
    return api.get<ApiResponse<InvoiceLineItem>>(`/invoice-line-items/${id}`);
  },

  create(payload: CreateInvoiceLineItemPayload) {
    return api.post<ApiResponse<InvoiceLineItem>>('/invoice-line-items', payload);
  },

  update(id: string, payload: UpdateInvoiceLineItemPayload) {
    return api.put<ApiResponse<InvoiceLineItem>>(`/invoice-line-items/${id}`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/invoice-line-items/${id}`);
  },
};
