import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  paymentsApi,
  paymentGatewaysApi,
  CreatePaymentPayload,
  UpdatePaymentPayload,
  CreatePaymentGatewayPayload,
  UpdatePaymentGatewayPayload,
} from '@/api/payments.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

// Payments
export function useAllPayments() {
  return useQuery({
    queryKey: ['payments', 'all'],
    queryFn: async () => {
      const response = await paymentsApi.getAllNonPaginated();
      return response.data.data || [];
    },
  });
}

export function usePayments(params?: PageOptions) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: async () => {
      const response = await paymentsApi.getAll(params);
      return { data: response.data.data!, meta: response.data.meta! };
    },
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: ['payments', id],
    queryFn: async () => {
      const response = await paymentsApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useInvoicePayments(invoiceId: string) {
  return useQuery({
    queryKey: ['payments', 'invoice', invoiceId],
    queryFn: async () => {
      const response = await paymentsApi.getByInvoiceId(invoiceId);
      return response.data.data!;
    },
    enabled: !!invoiceId,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => paymentsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      addNotification({ type: 'success', message: 'Payment recorded successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to record payment' });
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdatePaymentPayload & { id: string }) =>
      paymentsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      addNotification({ type: 'success', message: 'Payment updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update payment' });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => paymentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      addNotification({ type: 'success', message: 'Payment deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete payment' });
    },
  });
}

export function usePendingVerificationPayments() {
  return useQuery({
    queryKey: ['payments', 'pending-verification'],
    queryFn: async () => {
      const res = await paymentsApi.getPendingVerification();
      return res.data.data || [];
    },
    refetchInterval: 30000, // poll every 30 seconds
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);
  return useMutation({
    mutationFn: (id: string) => paymentsApi.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      addNotification({ type: 'success', message: 'Payment confirmed and invoice updated' });
    },
    onError: () => addNotification({ type: 'error', message: 'Failed to confirm payment' }),
  });
}

export function useRejectPayment() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => paymentsApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'pending-verification'] });
      addNotification({ type: 'success', message: 'Payment rejected' });
    },
    onError: () => addNotification({ type: 'error', message: 'Failed to reject payment' }),
  });
}

// Payment Gateways
export function usePaymentGateways(params?: PageOptions) {
  return useQuery({
    queryKey: ['payment-gateways', params],
    queryFn: async () => {
      const response = await paymentGatewaysApi.getAll(params);
      return { data: response.data.data!, meta: response.data.meta! };
    },
  });
}

export function usePaymentGateway(id: string) {
  return useQuery({
    queryKey: ['payment-gateways', id],
    queryFn: async () => {
      const response = await paymentGatewaysApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreatePaymentGateway() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreatePaymentGatewayPayload) => paymentGatewaysApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-gateways'] });
      addNotification({ type: 'success', message: 'Payment gateway created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create payment gateway' });
    },
  });
}

export function useUpdatePaymentGateway() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdatePaymentGatewayPayload & { id: string }) =>
      paymentGatewaysApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-gateways'] });
      addNotification({ type: 'success', message: 'Payment gateway updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update payment gateway' });
    },
  });
}

export function useDeletePaymentGateway() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => paymentGatewaysApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-gateways'] });
      addNotification({ type: 'success', message: 'Payment gateway deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete payment gateway' });
    },
  });
}
