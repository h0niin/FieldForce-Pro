import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  invoicesApi,
  invoiceLineItemsApi,
  CreateInvoicePayload,
  UpdateInvoicePayload,
  CreateInvoiceLineItemPayload,
  UpdateInvoiceLineItemPayload,
} from '@/api/invoices.api';
import type { PageOptions } from '@/types/api.types';
import { useNotificationStore } from '@/store/notification.store';

// Invoices
export function useInvoices(params?: PageOptions) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: async () => {
      const response = await invoicesApi.getAll(params);
      return { data: response.data.data!, meta: response.data.meta! };
    },
  });
}

export function useAllInvoices() {
  return useQuery({
    queryKey: ['invoices', 'all'],
    queryFn: async () => {
      const response = await invoicesApi.getAllNonPaginated();
      return response.data.data!;
    },
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: async () => {
      const response = await invoicesApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateInvoicePayload) => invoicesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      addNotification({ type: 'success', message: 'Invoice created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create invoice' });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateInvoicePayload & { id: string }) =>
      invoicesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      addNotification({ type: 'success', message: 'Invoice updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update invoice' });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      invoicesApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      addNotification({ type: 'success', message: 'Invoice status updated' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update invoice status' });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => invoicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      addNotification({ type: 'success', message: 'Invoice deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete invoice' });
    },
  });
}

// Invoice Line Items
export function useInvoiceLineItems(invoiceId: string) {
  return useQuery({
    queryKey: ['invoice-line-items', 'invoice', invoiceId],
    queryFn: async () => {
      const response = await invoiceLineItemsApi.getByInvoiceId(invoiceId);
      return response.data.data!;
    },
    enabled: !!invoiceId,
  });
}

export function useCreateInvoiceLineItem() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateInvoiceLineItemPayload) => invoiceLineItemsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-line-items'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      addNotification({ type: 'success', message: 'Line item added' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to add line item' });
    },
  });
}

export function useUpdateInvoiceLineItem() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateInvoiceLineItemPayload & { id: string }) =>
      invoiceLineItemsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-line-items'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      addNotification({ type: 'success', message: 'Line item updated' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update line item' });
    },
  });
}

export function useDeleteInvoiceLineItem() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => invoiceLineItemsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-line-items'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      addNotification({ type: 'success', message: 'Line item removed' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to remove line item' });
    },
  });
}

export function useGenerateInvoicePortalLink() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => invoicesApi.generatePortalLink(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      addNotification({ type: 'success', message: 'Customer portal link generated' });
    },
    onError: () => addNotification({ type: 'error', message: 'Failed to generate portal link' }),
  });
}
