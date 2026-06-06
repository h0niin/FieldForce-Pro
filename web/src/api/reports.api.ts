import api from './axios-instance';
import type { ApiResponse } from '@/types/api.types';

export interface ReportQueryParams {
  start_date?: string;
  end_date?: string;
  filters?: Record<string, unknown>;
}

export const reportsApi = {
  getWorkOrderReport(params?: ReportQueryParams) {
    return api.get<ApiResponse<Record<string, unknown>>>('/reports/work-orders', { params });
  },

  getInvoiceReport(params?: ReportQueryParams) {
    return api.get<ApiResponse<Record<string, unknown>>>('/reports/invoices', { params });
  },

  getPerformanceReport(params?: ReportQueryParams) {
    return api.get<ApiResponse<Record<string, unknown>>>('/reports/performance', { params });
  },

  getServiceRequestReport(params?: ReportQueryParams) {
    return api.get<ApiResponse<Record<string, unknown>>>('/reports/service-requests', { params });
  },

  getPaymentReport(params?: ReportQueryParams) {
    return api.get<ApiResponse<Record<string, unknown>>>('/reports/payments', { params });
  },
};
