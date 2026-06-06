import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { estimatesApi, CreateEstimatePayload, UpdateEstimatePayload } from '@/api/estimates.api';
import type { PageOptions } from '@/types/api.types';
import type { Invoice } from '@/types/models.types';
import { useNotificationStore } from '@/store/notification.store';

export function useEstimates(params?: PageOptions & { status?: string; excludeStatus?: string; createdBy?: string }, enabled = true) {
  return useQuery({
    queryKey: ['estimates', params],
    queryFn: async () => {
      const response = await estimatesApi.getAll(params);
      return {
        data: response.data.data!,
        meta: response.data.meta!,
      };
    },
    enabled,
  });
}

export function useMyEstimateDrafts(params?: PageOptions, enabled = true) {
  return useQuery({
    queryKey: ['estimates', 'my-drafts', params],
    queryFn: async () => {
      const response = await estimatesApi.getMyDrafts(params);
      return {
        data: response.data.data!,
        meta: response.data.meta!,
      };
    },
    enabled,
  });
}

export function useMyEstimateApprovals(params?: PageOptions, enabled = true) {
  return useQuery({
    queryKey: ['estimates', 'my-approvals', params],
    queryFn: async () => {
      const response = await estimatesApi.getMyApprovals(params);
      return {
        data: response.data.data!,
        meta: response.data.meta!,
      };
    },
    enabled,
  });
}

export function useEstimateAssignedCreator() {
  return useQuery({
    queryKey: ['estimates-config', 'assigned-creator'],
    queryFn: async () => {
      const response = await estimatesApi.getAssignedCreator();
      return response.data.data?.creator_id ?? null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — this is config data, rarely changes
    retry: false, // Don't retry — non-critical, avoids blocking the page
  });
}

export function useAllEstimates() {
  return useQuery({
    queryKey: ['estimates', 'all'],
    queryFn: async () => {
      const response = await estimatesApi.getAllNonPaginated();
      return response.data.data!;
    },
  });
}

export function useEstimate(id: string) {
  return useQuery({
    queryKey: ['estimates', id],
    queryFn: async () => {
      const response = await estimatesApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateEstimate() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateEstimatePayload) => estimatesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      addNotification({ type: 'success', message: 'Estimate created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create estimate' });
    },
  });
}

export function useUpdateEstimate() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateEstimatePayload & { id: string }) =>
      estimatesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      addNotification({ type: 'success', message: 'Estimate updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update estimate' });
    },
  });
}

export function useUpdateEstimateStatus() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      estimatesApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      addNotification({ type: 'success', message: 'Estimate status updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update estimate status' });
    },
  });
}

export function useDeleteEstimate() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => estimatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      addNotification({ type: 'success', message: 'Estimate deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete estimate' });
    },
  });
}

export function useSendEstimate() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => estimatesApi.sendToCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      addNotification({ type: 'success', message: 'Estimate sent to customer' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to send estimate' });
    },
  });
}

export function useGenerateEstimateLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => estimatesApi.generateLink(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    },
  });
}

export function useRevertEstimateToDraft() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);
  return useMutation({
    mutationFn: (id: string) => estimatesApi.revertToDraft(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      addNotification({ type: 'success', message: 'Estimate reverted to draft' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to revert estimate' });
    },
  });
}

export function useApproveEstimate() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, signatureUrl }: { id: string; signatureUrl?: string }) =>
      estimatesApi.recordApproval(id, signatureUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      addNotification({ type: 'success', message: 'Estimate approved' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to approve estimate' });
    },
  });
}

export function useRejectEstimate() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      estimatesApi.recordRejection(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      addNotification({ type: 'success', message: 'Estimate rejected' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to reject estimate' });
    },
  });
}

export function useEstimatesByWorkOrder(workOrderId: string, enabled = true) {
  return useQuery({
    queryKey: ['estimates', 'work-order', workOrderId],
    queryFn: async () => {
      const response = await estimatesApi.getByWorkOrderId(workOrderId);
      return response.data.data!;
    },
    enabled: enabled && !!workOrderId,
  });
}

export function useEstimatesByServiceRequest(requestId: string, enabled = true) {
  return useQuery({
    queryKey: ['estimates', 'service-request', requestId],
    queryFn: async () => {
      const response = await estimatesApi.getByServiceRequestId(requestId);
      return response.data.data!;
    },
    enabled: enabled && !!requestId,
  });
}

export function usePendingInternalApprovals(params?: { page?: number; take?: number }, enabled = true) {
  return useQuery({
    queryKey: ['estimates', 'pending-internal', params],
    queryFn: async () => {
      const response = await estimatesApi.getPendingInternalApprovals(params);
      return response.data.data!;
    },
    enabled,
    refetchInterval: 60000,
  });
}

export function useSubmitForInternalApproval() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);
  return useMutation({
    mutationFn: (id: string) => estimatesApi.submitForInternalApproval(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      addNotification({ type: 'success', message: 'Estimate submitted for manager review' });
    },
    onError: () => addNotification({ type: 'error', message: 'Failed to submit estimate' }),
  });
}

export function useInternalApproveEstimate() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);
  return useMutation({
    mutationFn: (id: string) => estimatesApi.internalApprove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      addNotification({ type: 'success', message: 'Estimate approved and sent to customer' });
    },
    onError: () => addNotification({ type: 'error', message: 'Failed to approve estimate' }),
  });
}

export function useInternalRejectEstimate() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => estimatesApi.internalReject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      addNotification({ type: 'success', message: 'Estimate sent back for revision' });
    },
    onError: () => addNotification({ type: 'error', message: 'Failed to reject estimate' }),
  });
}

export function useSubmitEstimateForApproval() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => estimatesApi.submitForApproval(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      addNotification({ type: 'success', message: 'Estimate submitted for approval' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to submit estimate for approval' });
    },
  });
}

export function useAdminApproveEstimate() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => estimatesApi.adminApprove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      addNotification({ type: 'success', message: 'Estimate approved' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to approve estimate' });
    },
  });
}

export function useAdminRejectEstimate() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      estimatesApi.adminReject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      addNotification({ type: 'success', message: 'Estimate rejected' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to reject estimate' });
    },
  });
}

export function useGenerateInvoiceFromEstimate() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => estimatesApi.generateInvoice(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      const inv = response.data.data as Invoice | undefined;
      addNotification({ type: 'success', message: `Invoice ${inv?.invoice_number || ''} generated` });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to generate invoice' });
    },
  });
}

export function useConvertEstimateToWorkOrder() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({
      id,
      priority,
      category,
      scheduledDate,
      assignedTo,
      locationId,
    }: {
      id: string;
      priority?: string;
      category?: string;
      scheduledDate?: string;
      assignedTo?: string;
      locationId?: string;
    }) =>
      estimatesApi.convertToWorkOrder(id, { priority, category, scheduledDate, assignedTo, locationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      addNotification({ type: 'success', message: 'Work order created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to convert estimate to work order' });
    },
  });
}
