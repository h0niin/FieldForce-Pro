import api from './axios-instance';
import type { ApiResponse, PageOptions } from '@/types/api.types';
import type {
  WorkflowTemplate,
  DocumentApproval,
  ApprovalHistory,
  DashboardStats,
  CreateWorkflowTemplatePayload,
  UpdateWorkflowTemplatePayload,
  CreateDocumentApprovalsPayload,
  ProcessApprovalPayload,
  BulkProcessApprovalPayload,
  DelegateApprovalPayload,
} from '@/types/workflow.types';

// ─── Workflow Templates ────────────────────────────────────────────

export const workflowTemplatesApi = {
  getAll(params?: PageOptions) {
    return api.get<ApiResponse<WorkflowTemplate[]>>('/workflow-templates', { params });
  },

  getAllNonPaginated() {
    return api.get<ApiResponse<WorkflowTemplate[]>>('/workflow-templates/all');
  },

  getById(id: string) {
    return api.get<ApiResponse<WorkflowTemplate>>(`/workflow-templates/${id}`);
  },

  create(payload: CreateWorkflowTemplatePayload) {
    return api.post<ApiResponse<WorkflowTemplate>>('/workflow-templates', payload);
  },

  update(id: string, payload: UpdateWorkflowTemplatePayload) {
    return api.put<ApiResponse<WorkflowTemplate>>(`/workflow-templates/${id}`, payload);
  },

  activate(id: string) {
    return api.patch<ApiResponse<WorkflowTemplate>>(`/workflow-templates/${id}/activate`);
  },

  deactivate(id: string) {
    return api.patch<ApiResponse<WorkflowTemplate>>(`/workflow-templates/${id}/deactivate`);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/workflow-templates/${id}`);
  },
};

// ─── Document Approvals ────────────────────────────────────────────

export const documentApprovalsApi = {
  getAll(params?: PageOptions & { document_type?: string; status?: string; approver_id?: string; document_id?: string }) {
    return api.get<ApiResponse<DocumentApproval[]>>('/document-approvals', { params });
  },

  getMyPending(params?: PageOptions) {
    return api.get<ApiResponse<DocumentApproval[]>>('/document-approvals/my-pending', { params });
  },

  getSentToMe(params?: PageOptions) {
    return api.get<ApiResponse<DocumentApproval[]>>('/document-approvals/sent-to-me', { params });
  },

  getDashboard(approverId?: string) {
    return api.get<ApiResponse<DashboardStats>>('/document-approvals/dashboard', {
      params: approverId ? { approver_id: approverId } : undefined,
    });
  },

  getByDocument(documentId: string) {
    return api.get<ApiResponse<DocumentApproval[]>>(`/document-approvals/document/${documentId}`);
  },

  getById(id: string) {
    return api.get<ApiResponse<DocumentApproval>>(`/document-approvals/${id}`);
  },

  getHistory(id: string) {
    return api.get<ApiResponse<ApprovalHistory[]>>(`/document-approvals/${id}/history`);
  },

  getHistoryByDocument(documentId: string) {
    return api.get<ApiResponse<ApprovalHistory[]>>(`/document-approvals/document/${documentId}/history`);
  },

  create(payload: CreateDocumentApprovalsPayload) {
    return api.post<ApiResponse<DocumentApproval[]>>('/document-approvals', payload);
  },

  process(id: string, payload: ProcessApprovalPayload) {
    return api.post<ApiResponse<DocumentApproval>>(`/document-approvals/${id}/process`, payload);
  },

  bulkProcess(payload: BulkProcessApprovalPayload) {
    return api.post<ApiResponse<{ processed: number; failed: string[] }>>('/document-approvals/bulk-process', payload);
  },

  delegate(id: string, payload: DelegateApprovalPayload) {
    return api.post<ApiResponse<DocumentApproval>>(`/document-approvals/${id}/delegate`, payload);
  },

  delete(id: string) {
    return api.delete<ApiResponse<null>>(`/document-approvals/${id}`);
  },
};
