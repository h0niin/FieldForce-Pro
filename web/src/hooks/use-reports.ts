import { useQuery } from '@tanstack/react-query';
import { reportsApi, ReportQueryParams } from '@/api/reports.api';

export function useWorkOrderReport(params?: ReportQueryParams, enabled = true) {
  return useQuery({
    queryKey: ['reports', 'work-orders', params],
    queryFn: async () => {
      const response = await reportsApi.getWorkOrderReport(params);
      return response.data.data!;
    },
    enabled,
  });
}

export function useInvoiceReport(params?: ReportQueryParams, enabled = true) {
  return useQuery({
    queryKey: ['reports', 'invoices', params],
    queryFn: async () => {
      const response = await reportsApi.getInvoiceReport(params);
      return response.data.data!;
    },
    enabled,
  });
}

export function usePerformanceReport(params?: ReportQueryParams, enabled = true) {
  return useQuery({
    queryKey: ['reports', 'performance', params],
    queryFn: async () => {
      const response = await reportsApi.getPerformanceReport(params);
      return response.data.data!;
    },
    enabled,
  });
}

export function useServiceRequestReport(params?: ReportQueryParams, enabled = true) {
  return useQuery({
    queryKey: ['reports', 'service-requests', params],
    queryFn: async () => {
      const response = await reportsApi.getServiceRequestReport(params);
      return response.data.data!;
    },
    enabled,
  });
}

export function usePaymentReport(params?: ReportQueryParams, enabled = true) {
  return useQuery({
    queryKey: ['reports', 'payments', params],
    queryFn: async () => {
      const response = await reportsApi.getPaymentReport(params);
      return response.data.data!;
    },
    enabled,
  });
}
