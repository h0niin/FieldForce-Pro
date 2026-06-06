import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Space, Card, Select, Tooltip, Tabs } from 'antd';
import {
  EyeOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { formatDateTime } from '@/utils/format-date';
import {
  useDocumentApprovals,
  useSentToMeApprovals,
} from '@/hooks/use-workflow';
import type { DocumentApproval } from '@/types/workflow.types';
import ApprovalDetailsModal from './components/ApprovalDetailsModal';
import DocumentTimeline from './components/DocumentTimeline';
import { useTranslation } from 'react-i18next'; // Rule 1

const statusColors: Record<string, string> = {
  PENDING: 'orange',
  APPROVED: 'green',
  REJECTED: 'red',
  SKIPPED: 'default',
  CORRECTION_REQUIRED: 'gold',
};

const documentTypeColors: Record<string, string> = {
  INVOICE: 'blue',
  QUOTATION: 'purple',
  VENDOR: 'orange',
  CONTRACT: 'cyan',
  DRAFT_INVOICE: 'blue',
  PRQ: 'gold',
  PO: 'gold',
  PROFORMA: 'geekblue',
  PAYMENT_REQUEST: 'volcano',
  SERVICE_CONTRACT: 'lime',
  PETTY_CASH: 'magenta',
  PURCHASE_REQUEST: 'gold',
  SERVICE_REQUEST: 'green',
  PETTY_CASH_REPORT: 'magenta',
  RESOURCE_BOOKING: 'geekblue',
  PURCHASE_ORDER: 'gold',
  WORK_ORDER: 'geekblue',
  ESTIMATE: 'magenta',
  ESTIMATE_APPROVAL: 'magenta',
  EXPENSE: 'red',
  SCHEDULE: 'cyan',
  FIELD_WORKFLOW: 'lime',
};

// Navigate to the related document based on type
const documentRoutes: Record<string, (docId: string) => string> = {
  SERVICE_REQUEST: (id) => `/service-requests/${id}`,
  WORK_ORDER: (id) => `/work-orders/${id}`,
  ESTIMATE: (id) => `/estimates/${id}`,
  ESTIMATE_APPROVAL: (id) => `/estimates/${id}`,
  INVOICE: (id) => `/invoices/${id}`,
  DRAFT_INVOICE: (id) => `/invoices/${id}`,
  SCHEDULE: (id) => `/scheduling?tab=review&appointment_id=${id}`,
  FIELD_WORKFLOW: (id) => `/work-orders?wo_id=${id}#field-workflow`,
};

export default function DocumentApprovalListPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(); // Rule 2
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [docTypeFilter, setDocTypeFilter] = useState<string | undefined>(undefined);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedApprovalId, setSelectedApprovalId] = useState('');

  // All approvals query (the "Invoice Approvals" tab forces document_type=INVOICE)
  const allApprovalsQuery = useDocumentApprovals(
    activeTab === 'all'
      ? { page, take: pageSize, status: statusFilter, document_type: docTypeFilter }
      : activeTab === 'invoices'
        ? { page, take: pageSize, status: statusFilter, document_type: 'INVOICE' }
        : undefined,
  );

  // Sent to me (all statuses) query
  const sentToMeQuery = useSentToMeApprovals(
    activeTab === 'sent-to-me' ? { page, take: pageSize } : undefined,
  );

  const currentQuery = activeTab === 'sent-to-me' ? sentToMeQuery : allApprovalsQuery;

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPage(1);
    setStatusFilter(undefined);
    setDocTypeFilter(undefined);
  };

  const handleViewDetails = (id: string) => {
    setSelectedApprovalId(id);
    setDetailsModalOpen(true);
  };

  // Helper for translating status display in tags
  const getTranslatedStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return t('documentApprovals.statusOptions.pending');
      case 'APPROVED': return t('documentApprovals.statusOptions.approved');
      case 'REJECTED': return t('documentApprovals.statusOptions.rejected');
      case 'SKIPPED': return t('documentApprovals.statusOptions.skipped');
      case 'CORRECTION_REQUIRED': return t('documentApprovals.statusOptions.correctionRequired');
      default: return status.replace(/_/g, ' '); // Fallback for unknown statuses
    }
  };

  // Helper for translating document type display in tags
  const getTranslatedDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'INVOICE': return t('documentApprovals.documentTypeOptions.invoice');
      case 'QUOTATION': return t('documentApprovals.documentTypeOptions.quotation');
      case 'VENDOR': return t('documentApprovals.documentTypeOptions.vendor');
      case 'CONTRACT': return t('documentApprovals.documentTypeOptions.contract');
      case 'DRAFT_INVOICE': return t('documentApprovals.documentTypeOptions.draftInvoice');
      case 'PRQ': return t('documentApprovals.documentTypeOptions.prq');
      case 'PO': return t('documentApprovals.documentTypeOptions.po');
      case 'PROFORMA': return t('documentApprovals.documentTypeOptions.proforma');
      case 'PAYMENT_REQUEST': return t('documentApprovals.documentTypeOptions.paymentRequest');
      case 'SERVICE_CONTRACT': return t('documentApprovals.documentTypeOptions.serviceContract');
      case 'PETTY_CASH': return t('documentApprovals.documentTypeOptions.pettyCash');
      case 'PURCHASE_REQUEST': return t('documentApprovals.documentTypeOptions.purchaseRequest');
      case 'SERVICE_REQUEST': return t('documentApprovals.documentTypeOptions.serviceRequest');
      case 'PETTY_CASH_REPORT': return t('documentApprovals.documentTypeOptions.pettyCashReport');
      case 'RESOURCE_BOOKING': return t('documentApprovals.documentTypeOptions.resourceBooking');
      case 'PURCHASE_ORDER': return t('documentApprovals.documentTypeOptions.purchaseOrder');
      case 'WORK_ORDER': return t('documentApprovals.documentTypeOptions.workOrder');
      case 'ESTIMATE': return t('documentApprovals.documentTypeOptions.estimate');
      case 'ESTIMATE_APPROVAL': return t('documentApprovals.documentTypeOptions.estimateApproval');
      case 'EXPENSE': return t('documentApprovals.documentTypeOptions.expense');
      case 'SCHEDULE': return t('documentApprovals.documentTypeOptions.schedule');
      case 'FIELD_WORKFLOW': return t('documentApprovals.documentTypeOptions.fieldWorkflow');
      default: return type.replace(/_/g, ' '); // Fallback for unknown document types
    }
  };

  const columns: ColumnsType<DocumentApproval> = [
    {
      title: t('documentApprovals.columns.document'),
      key: 'document',
      render: (_: unknown, record) => {
        const route = documentRoutes[record.document_type];
        return (
          <div>
            <Tag color={documentTypeColors[record.document_type] || 'default'}>
              {getTranslatedDocumentTypeLabel(record.document_type)}
            </Tag>
            <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
              {record.document_id.slice(0, 8)}...
              {route && (
                <Tooltip title={t('documentApprovals.goToDocumentTooltip')}>
                  <Button
                    type="link"
                    size="small"
                    icon={<LinkOutlined />}
                    style={{ padding: '0 4px', fontSize: 12 }}
                    onClick={() => navigate(route(record.document_id))}
                  />
                </Tooltip>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: t('documentApprovals.columns.workflow'),
      key: 'workflow',
      render: (_: unknown, record) => record.workflow_template?.name || '-',
    },
    {
      title: t('documentApprovals.columns.step'),
      dataIndex: 'order_no',
      key: 'order_no',
      width: 70,
      align: 'center',
      render: (v: number) => `#${v}`,
    },
    {
      title: t('documentApprovals.columns.approver'),
      key: 'approver',
      render: (_: unknown, record) =>
        record.approver
          ? `${record.approver.first_name} ${record.approver.last_name}`
          : record.approver_id.slice(0, 8),
    },
    {
      title: t('documentApprovals.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>{getTranslatedStatusLabel(status)}</Tag>
      ),
    },
    {
      title: t('documentApprovals.columns.dueDate'),
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date: string) => (date ? formatDateTime(date) : '-'),
    },
    {
      title: t('documentApprovals.columns.actionDate'),
      dataIndex: 'action_date',
      key: 'action_date',
      render: (date: string) => (date ? formatDateTime(date) : '-'),
    },
    {
      title: t('documentApprovals.columns.actions'),
      key: 'actions',
      width: 80,
      render: (_: unknown, record) => (
        <Tooltip title={t('documentApprovals.viewDetailsTooltip')}>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record.id)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 16 }}>{t('documentApprovals.pageTitle')}</h2>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          { key: 'all', label: t('documentApprovals.allApprovalsTab') },
          { key: 'invoices', label: 'Invoice Approvals' },
          { key: 'sent-to-me', label: t('documentApprovals.sentToMeTab') },
        ]}
        style={{ marginBottom: 16 }}
      />

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <Space wrap>
            {(activeTab === 'all' || activeTab === 'invoices') && (
              <Select
                placeholder={t('documentApprovals.filterByStatusPlaceholder')}
                allowClear
                style={{ width: 180 }}
                value={statusFilter}
                onChange={(v) => { setStatusFilter(v); setPage(1); }}
                options={[
                  { value: 'PENDING', label: t('documentApprovals.statusOptions.pending') },
                  { value: 'APPROVED', label: t('documentApprovals.statusOptions.approved') },
                  { value: 'REJECTED', label: t('documentApprovals.statusOptions.rejected') },
                  { value: 'SKIPPED', label: t('documentApprovals.statusOptions.skipped') },
                  { value: 'CORRECTION_REQUIRED', label: t('documentApprovals.statusOptions.correctionRequired') },
                ]}
              />
            )}
            {activeTab === 'all' && (
              <>
                <Select
                  placeholder={t('documentApprovals.filterByDocumentTypePlaceholder')}
                  allowClear
                  style={{ width: 200 }}
                  value={docTypeFilter}
                  onChange={(v) => { setDocTypeFilter(v); setPage(1); }}
                  options={[
                    { value: 'INVOICE', label: t('documentApprovals.documentTypeOptions.invoice') },
                    { value: 'QUOTATION', label: t('documentApprovals.documentTypeOptions.quotation') },
                    { value: 'VENDOR', label: t('documentApprovals.documentTypeOptions.vendor') },
                    { value: 'CONTRACT', label: t('documentApprovals.documentTypeOptions.contract') },
                    { value: 'DRAFT_INVOICE', label: t('documentApprovals.documentTypeOptions.draftInvoice') },
                    { value: 'PRQ', label: t('documentApprovals.documentTypeOptions.prq') },
                    { value: 'PO', label: t('documentApprovals.documentTypeOptions.po') },
                    { value: 'PROFORMA', label: t('documentApprovals.documentTypeOptions.proforma') },
                    { value: 'PAYMENT_REQUEST', label: t('documentApprovals.documentTypeOptions.paymentRequest') },
                    { value: 'SERVICE_CONTRACT', label: t('documentApprovals.documentTypeOptions.serviceContract') },
                    { value: 'PETTY_CASH', label: t('documentApprovals.documentTypeOptions.pettyCash') },
                    { value: 'PURCHASE_REQUEST', label: t('documentApprovals.documentTypeOptions.purchaseRequest') },
                    { value: 'SERVICE_REQUEST', label: t('documentApprovals.documentTypeOptions.serviceRequest') },
                    { value: 'PETTY_CASH_REPORT', label: t('documentApprovals.documentTypeOptions.pettyCashReport') },
                    { value: 'RESOURCE_BOOKING', label: t('documentApprovals.documentTypeOptions.resourceBooking') },
                    { value: 'PURCHASE_ORDER', label: t('documentApprovals.documentTypeOptions.purchaseOrder') },
                    { value: 'WORK_ORDER', label: t('documentApprovals.documentTypeOptions.workOrder') },
                    { value: 'ESTIMATE', label: t('documentApprovals.documentTypeOptions.estimate') },
                    { value: 'ESTIMATE_APPROVAL', label: t('documentApprovals.documentTypeOptions.estimateApproval') },
                    { value: 'EXPENSE', label: t('documentApprovals.documentTypeOptions.expense') },
                    { value: 'SCHEDULE', label: t('documentApprovals.documentTypeOptions.schedule') },
                    { value: 'FIELD_WORKFLOW', label: t('documentApprovals.documentTypeOptions.fieldWorkflow') },
                  ]}
                />
              </>
            )}
          </Space>

        </div>

        <Table
          columns={columns}
          dataSource={currentQuery.data?.data || []}
          loading={currentQuery.isLoading}
          rowKey="id"
          expandable={{
            expandedRowRender: (record) => (
              <DocumentTimeline documentId={record.document_id} />
            ),
          }}
          pagination={{
            current: page,
            pageSize,
            total: currentQuery.data?.meta?.itemCount || 0,
            showSizeChanger: true,
            showTotal: (total) => t('documentApprovals.paginationTotal', { total }),
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      <ApprovalDetailsModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        approvalId={selectedApprovalId}
      />
    </div>
  );
}