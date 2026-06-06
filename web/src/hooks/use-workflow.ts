import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  workflowTemplatesApi,
  documentApprovalsApi,
} from '@/api/workflow.api';
import type { PageOptions } from '@/types/api.types';
import type {
  CreateWorkflowTemplatePayload,
  UpdateWorkflowTemplatePayload,
  CreateDocumentApprovalsPayload,
  ProcessApprovalPayload,
  BulkProcessApprovalPayload,
  DelegateApprovalPayload,
} from '@/types/workflow.types';
import { useNotificationStore } from '@/store/notification.store';

// ─── Workflow Templates ────────────────────────────────────────────

export function useWorkflowTemplates(params?: PageOptions) {
  return useQuery({
    queryKey: ['workflow-templates', params],
    queryFn: async () => {
      const response = await workflowTemplatesApi.getAll(params);
      return {
        data: response.data.data!,
        meta: response.data.meta!,
      };
    },
  });
}

export function useAllWorkflowTemplates() {
  return useQuery({
    queryKey: ['workflow-templates', 'all'],
    queryFn: async () => {
      const response = await workflowTemplatesApi.getAllNonPaginated();
      return response.data.data!;
    },
  });
}

export function useWorkflowTemplate(id: string) {
  return useQuery({
    queryKey: ['workflow-templates', id],
    queryFn: async () => {
      const response = await workflowTemplatesApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useCreateWorkflowTemplate() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateWorkflowTemplatePayload) =>
      workflowTemplatesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] });
      addNotification({ type: 'success', message: 'Workflow template created successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create workflow template' });
    },
  });
}

export function useUpdateWorkflowTemplate() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateWorkflowTemplatePayload & { id: string }) =>
      workflowTemplatesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] });
      addNotification({ type: 'success', message: 'Workflow template updated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to update workflow template' });
    },
  });
}

export function useActivateWorkflowTemplate() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => workflowTemplatesApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] });
      addNotification({ type: 'success', message: 'Workflow template activated' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to activate workflow template' });
    },
  });
}

export function useDeactivateWorkflowTemplate() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => workflowTemplatesApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] });
      addNotification({ type: 'success', message: 'Workflow template deactivated' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to deactivate workflow template' });
    },
  });
}

export function useDeleteWorkflowTemplate() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => workflowTemplatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-templates'] });
      addNotification({ type: 'success', message: 'Workflow template deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete workflow template' });
    },
  });
}

// ─── Document Approvals ────────────────────────────────────────────

export function useDocumentApprovals(
  params?: PageOptions & { document_type?: string; status?: string; approver_id?: string; document_id?: string },
) {
  return useQuery({
    queryKey: ['document-approvals', params],
    queryFn: async () => {
      const response = await documentApprovalsApi.getAll(params);
      return {
        data: response.data.data!,
        meta: response.data.meta!,
      };
    },
    enabled: params !== undefined,
  });
}

export function useMyPendingApprovals(params?: PageOptions) {
  return useQuery({
    queryKey: ['document-approvals', 'my-pending', params],
    queryFn: async () => {
      const response = await documentApprovalsApi.getMyPending(params);
      return {
        data: response.data.data!,
        meta: response.data.meta!,
      };
    },
    enabled: params !== undefined,
  });
}

export function useSentToMeApprovals(params?: PageOptions) {
  return useQuery({
    queryKey: ['document-approvals', 'sent-to-me', params],
    queryFn: async () => {
      const response = await documentApprovalsApi.getSentToMe(params);
      return {
        data: response.data.data!,
        meta: response.data.meta!,
      };
    },
    enabled: params !== undefined,
  });
}

export function useApprovalDashboard(approverId?: string) {
  return useQuery({
    queryKey: ['document-approvals', 'dashboard', approverId],
    queryFn: async () => {
      const response = await documentApprovalsApi.getDashboard(approverId);
      return response.data.data!;
    },
  });
}

export function useDocumentApproval(id: string) {
  return useQuery({
    queryKey: ['document-approvals', id],
    queryFn: async () => {
      const response = await documentApprovalsApi.getById(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useApprovalsByDocument(documentId: string) {
  return useQuery({
    queryKey: ['document-approvals', 'document', documentId],
    queryFn: async () => {
      const response = await documentApprovalsApi.getByDocument(documentId);
      return response.data.data!;
    },
    enabled: !!documentId,
  });
}

export function useApprovalHistory(id: string) {
  return useQuery({
    queryKey: ['document-approvals', id, 'history'],
    queryFn: async () => {
      const response = await documentApprovalsApi.getHistory(id);
      return response.data.data!;
    },
    enabled: !!id,
  });
}

export function useHistoryByDocument(documentId: string) {
  return useQuery({
    queryKey: ['document-approvals', 'document-history', documentId],
    queryFn: async () => {
      const response = await documentApprovalsApi.getHistoryByDocument(documentId);
      return response.data.data!;
    },
    enabled: !!documentId,
  });
}

export function useCreateDocumentApprovals() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: CreateDocumentApprovalsPayload) =>
      documentApprovalsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-approvals'] });
      addNotification({ type: 'success', message: 'Approval workflow started' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to create approval workflow' });
    },
  });
}

export function useProcessApproval() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: ProcessApprovalPayload & { id: string }) =>
      documentApprovalsApi.process(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-approvals'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['job-sheet-instances'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      addNotification({ type: 'success', message: 'Approval processed successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to process approval' });
    },
  });
}

export function useBulkProcessApproval() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (payload: BulkProcessApprovalPayload) =>
      documentApprovalsApi.bulkProcess(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['document-approvals'], refetchType: 'all' });
      const data = response.data.data;
      addNotification({
        type: 'success',
        message: `Processed ${data?.processed} approvals${data?.failed?.length ? `, ${data.failed.length} failed` : ''}`,
      });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to process bulk approvals' });
    },
  });
}

export function useDelegateApproval() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: ({ id, ...payload }: DelegateApprovalPayload & { id: string }) =>
      documentApprovalsApi.delegate(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-approvals'], refetchType: 'all' });
      addNotification({ type: 'success', message: 'Approval delegated successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delegate approval' });
    },
  });
}

export function useDeleteDocumentApproval() {
  const queryClient = useQueryClient();
  const addNotification = useNotificationStore((s) => s.add);

  return useMutation({
    mutationFn: (id: string) => documentApprovalsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-approvals'] });
      addNotification({ type: 'success', message: 'Approval deleted successfully' });
    },
    onError: () => {
      addNotification({ type: 'error', message: 'Failed to delete approval' });
    },
  });
}
