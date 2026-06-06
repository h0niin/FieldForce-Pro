export type DocumentType =
  | 'INVOICE'
  | 'QUOTATION'
  | 'VENDOR'
  | 'CONTRACT'
  | 'DRAFT_INVOICE'
  | 'PRQ'
  | 'PO'
  | 'PROFORMA'
  | 'PAYMENT_REQUEST'
  | 'SERVICE_CONTRACT'
  | 'PETTY_CASH'
  | 'PURCHASE_REQUEST'
  | 'SERVICE_REQUEST'
  | 'PETTY_CASH_REPORT'
  | 'RESOURCE_BOOKING'
  | 'PURCHASE_ORDER'
  | 'WORK_ORDER'
  | 'ESTIMATE'
  | 'ESTIMATE_APPROVAL'
  | 'EXPENSE'
  | 'SCHEDULE'
  | 'FIELD_WORKFLOW'
  | 'JOB_SHEET'
  | 'JOB_SHEET_APPROVAL';

export type DocumentCategory =
  | 'PROCUREMENT'
  | 'SERVICE'
  | 'MAINTENANCE'
  | 'FINANCE'
  | 'VENDOR'
  | 'PROGRAM'
  | 'BUDGET'
  | 'OTHER'
  | 'OPERATIONS';

export type ApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SKIPPED'
  | 'CORRECTION_REQUIRED';

export type ApprovalAction =
  | 'APPROVE'
  | 'REJECT'
  | 'REQUEST_CORRECTION'
  | 'SKIP'
  | 'DELEGATE'
  | 'ESCALATE';

export interface WorkflowApprover {
  id: string;
  tenant_id: string;
  workflow_template_id: string;
  approver_id: string;
  approver?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  order_no: number;
  approval_authority?: number;
  amount_threshold_min?: number;
  amount_threshold_max?: number;
  budget_threshold?: number;
  is_required: boolean;
  is_active: boolean;
  notes?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  document_type: DocumentType;
  document_category: DocumentCategory;
  version: number;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  approvers?: WorkflowApprover[];
}

export interface DocumentApproval {
  id: string;
  tenant_id: string;
  document_id: string;
  document_type: DocumentType;
  workflow_id: string;
  workflow_template?: {
    id: string;
    name: string;
    document_type: DocumentType;
  };
  workflow_version: number;
  approver_id: string;
  approver?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  delegated_from_id?: string;
  order_no: number;
  status: ApprovalStatus;
  comments?: string;
  action_date?: string;
  due_date?: string;
  escalated_at?: string;
  escalated_to_id?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApprovalHistory {
  id: string;
  tenant_id: string;
  approval_id: string;
  document_id: string;
  action: ApprovalAction;
  old_status?: string;
  new_status: string;
  actor_id: string;
  actor?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  comments?: string;
  ip_address?: string;
  created_at: string;
}

export interface DashboardStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  overdue: number;
  approval_rate: number;
}

export interface CreateWorkflowTemplatePayload {
  name: string;
  description?: string;
  document_type: DocumentType;
  document_category: DocumentCategory;
  approvers?: {
    approver_id: string;
    order_no: number;
    approval_authority?: number;
    amount_threshold_min?: number;
    amount_threshold_max?: number;
    budget_threshold?: number;
    is_required?: boolean;
    notes?: string;
  }[];
}

export interface UpdateWorkflowTemplatePayload {
  name?: string;
  description?: string;
  document_type?: DocumentType;
  document_category?: DocumentCategory;
  approvers?: {
    approver_id: string;
    order_no: number;
    approval_authority?: number;
    amount_threshold_min?: number;
    amount_threshold_max?: number;
    budget_threshold?: number;
    is_required?: boolean;
    notes?: string;
  }[];
}

export interface CreateDocumentApprovalsPayload {
  document_id: string;
  document_type: DocumentType;
  workflow_id: string;
  amount?: number;
  due_date?: string;
}

export interface ProcessApprovalPayload {
  action: ApprovalAction;
  comments?: string;
}

export interface BulkProcessApprovalPayload {
  approval_ids: string[];
  action: ApprovalAction;
  comments?: string;
}

export interface DelegateApprovalPayload {
  delegate_to_id: string;
  comments?: string;
}
