import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Table, Space, Tooltip, Tag, Select, Tabs, Modal, Input, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useServiceRequests, useDeleteServiceRequest, useMyPendingApprovals, useProcessServiceRequestApproval, useQueue, useUpdatePriority, useApproveAndConvert, useUpdateServiceRequestStatus } from '@/hooks/use-service-requests';
import { serviceRequestsApi } from '@/api/service-requests.api';
import { usePermission } from '@/components/permissions/usePermission';
import { useAuthStore } from '@/store/auth.store';
import type { ServiceRequest } from '@/types/models.types';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';
import SearchFilter from '@/components/common/SearchFilter';
import { SlaCountdownCell } from '@/components/common/SlaCountdownCell';

const priorityColors: Record<string, string> = {
  urgent: 'red',
  high: 'orange',
  medium: 'blue',
  low: 'default',
};

const statusColors: Record<string, string> = {
  new: 'blue',
  triaged: 'cyan',
  estimated: 'gold',
  approved: 'green',
  converted_to_wo: 'purple',
  rejected: 'red',
  closed: 'default',
  spam: 'red',
};

interface ApprovalRecord {
  id: string;
  status: string;
  order_no: number;
  approver_id: string;
}

export default function RequestListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin } = usePermission();
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState(isAdmin ? 'all' : 'my-approvals');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    searchParams.get('status') || undefined,
  );

  // Approval modal state
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [approvalComments, setApprovalComments] = useState('');
  const [approvalSrId, setApprovalSrId] = useState('');
  const [approvalSrSubject, setApprovalSrSubject] = useState('');
  const [approvalProcessing, setApprovalProcessing] = useState(false);

  const allRequestsQuery = useServiceRequests(
    { page, take: pageSize, search, status: statusFilter },
    activeTab === 'all',
  );
  const myApprovalsQuery = useMyPendingApprovals(
    { page, take: pageSize, search },
    activeTab === 'my-approvals',
  );

  const deleteRequest = useDeleteServiceRequest();
  const processApproval = useProcessServiceRequestApproval();
  const approveAndConvert = useApproveAndConvert();
  const rejectSr = useUpdateServiceRequestStatus();

  const { data: queueData = [], isLoading: queueLoading } = useQueue();
  const updatePriority = useUpdatePriority();

  const currentQuery = activeTab === 'all' || activeTab === 'spam' ? allRequestsQuery : myApprovalsQuery;
  const requests = activeTab === 'queue' ? queueData : currentQuery.data?.data || [];
  const meta = activeTab === 'queue' ? { itemCount: queueData.length } : currentQuery.data?.meta;
  const isLoading = activeTab === 'queue' ? queueLoading : currentQuery.isLoading;

  const statusLabelsMap: Record<string, string> = {
    new: t('serviceRequests.status.new'),
    triaged: t('serviceRequests.status.triaged'),
    estimated: t('serviceRequests.status.estimated'),
    approved: t('serviceRequests.status.approved'),
    converted_to_wo: t('serviceRequests.status.convertedToWo'),
    rejected: t('serviceRequests.status.rejected'),
    closed: t('serviceRequests.status.closed'),
    spam: t('serviceRequests.status.flagged'),
  };

  const statusOptions = [
    { value: 'new', label: t('serviceRequests.statusOptions.new') },
    { value: 'approved', label: t('serviceRequests.statusOptions.approved') },
    { value: 'rejected', label: t('serviceRequests.statusOptions.rejected') },
  ];

  // Status filter is now handled server-side via the API query param
  useEffect(() => {
    if (activeTab === 'spam') {
      setStatusFilter('spam');
    } else if (activeTab === 'all') {
      setStatusFilter(searchParams.get('status') || undefined);
    }
  }, [activeTab, searchParams]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page when switching tabs
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPage(1);
    setSearch('');
    setSearchInput('');
    setStatusFilter(undefined);
    setSearchParams({}, { replace: true });
  };

  const handleDelete = (request: ServiceRequest) => {
    showConfirmDialog({
      title: t('serviceRequests.deleteRequestTitle'),
      content: t('serviceRequests.deleteRequestContent', { subject: request.subject }),
      onOk: async () => {
        await deleteRequest.mutateAsync(request.id);
      },
      danger: true,
    });
  };

  const openApprovalModal = (record: ServiceRequest, action: 'APPROVE' | 'REJECT') => {
    setApprovalSrId(record.id);
    setApprovalSrSubject(record.subject);
    setApprovalAction(action);
    setApprovalComments('');
    setApprovalModalOpen(true);
  };

  const handleProcessApproval = async () => {
    if (!approvalSrId || !user?.id) return;
    setApprovalProcessing(true);
    try {
      // Fetch the approval records for this SR, find the current user's pending one
      const response = await serviceRequestsApi.getApprovals(approvalSrId);
      const approvals = (response.data.data || []) as ApprovalRecord[];
      const myPending = approvals.find(
        (a) => a.approver_id === user.id && a.status === 'PENDING',
      );

      if (!myPending) {
        message.warning(t('serviceRequests.noPendingApprovalWarning'));
        setApprovalModalOpen(false);
        myApprovalsQuery.refetch();
        return;
      }

      // Check it's their turn (no earlier PENDING approvals)
      const hasPriorPending = approvals.some(
        (a) => a.order_no < myPending.order_no && a.status === 'PENDING',
      );
      if (hasPriorPending) {
        message.warning(t('serviceRequests.previousApproverWarning'));
        setApprovalModalOpen(false);
        return;
      }

      processApproval.mutate(
        {
          serviceRequestId: approvalSrId,
          approvalId: myPending.id,
          action: approvalAction,
          comments: approvalComments || undefined,
        },
        {
          onSuccess: () => {
            setApprovalModalOpen(false);
            setApprovalProcessing(false);
            message.success(t('serviceRequests.approvalSuccess'));
          },
          onError: () => {
            message.error(t('serviceRequests.approvalError'));
            setApprovalProcessing(false);
          },
        },
      );
    } catch {
      message.error(t('serviceRequests.approvalError'));
      setApprovalProcessing(false);
    }
  };

  // Shared columns (everything except Actions)
  const sharedColumns: ColumnsType<ServiceRequest> = [
    {
      title: t('serviceRequests.table.requestId'),
      dataIndex: 'request_number',
      key: 'request_number',
      width: 140,
      render: (num: string) => (
        <span style={{ fontWeight: 600, fontFamily: 'monospace', color: '#1890ff' }}>
          {num || '-'}
        </span>
      ),
      sorter: (a, b) => (a.request_number || '').localeCompare(b.request_number || ''),
    },
    {
      title: t('serviceRequests.table.subject'),
      dataIndex: 'subject',
      key: 'subject',
      render: (subject: string) => <span style={{ fontWeight: 500 }}>{subject}</span>,
      sorter: (a, b) => a.subject.localeCompare(b.subject),
    },
    {
      title: t('serviceRequests.table.priority'),
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={priorityColors[priority] || 'default'}>
          {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
        </Tag>
      ),
    },
    {
      title: t('serviceRequests.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'} style={{ whiteSpace: 'nowrap' }}>
          {statusLabelsMap[status] || status?.replace(/_/g, ' ').replace(/\\b\\w/g, (l) => l.toUpperCase())}
        </Tag>
      ),
    },
    {
      title: t('serviceRequests.table.channel'),
      dataIndex: 'channel',
      key: 'channel',
      width: 120,
      render: (channel: string) =>
        channel ? (
          <Tag style={{ whiteSpace: 'nowrap' }}>{channel.charAt(0).toUpperCase() + channel.slice(1)}</Tag>
        ) : (
          <span style={{ opacity: 0.5 }}>-</span>
        ),
    },
    {
      title: t('serviceRequests.table.customer'),
      key: 'contact',
      render: (_, record) =>
        record.contact
          ? `${record.contact.first_name} ${record.contact.last_name}`
          : <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('serviceRequests.table.technicians'),
      key: 'technicians',
      render: (_, record) =>
        record.technicians && record.technicians.length > 0 ? (
          <Space wrap size={[0, 4]}>
            {record.technicians.map((t) => (
              <Tooltip key={t.id} title={`${t.first_name} ${t.last_name}`}>
                <Tag color="blue" style={{ borderRadius: '50%', width: 24, height: 24, textAlign: 'center', lineHeight: '22px', padding: 0 }}>
                  {t.first_name?.charAt(0)}{t.last_name?.charAt(0)}
                </Tag>
              </Tooltip>
            ))}
          </Space>
        ) : (
          <span style={{ opacity: 0.5 }}>-</span>
        ),
    },
    {
      title: t('serviceRequests.table.created'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDateTime(date),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: 'Response SLA',
      key: 'response_sla',
      render: (_, record: any) => (
        record.sla ? <SlaCountdownCell deadline={record.sla.response_deadline} status={record.sla.response_status} /> : <span style={{ opacity: 0.5 }}>-</span>
      ),
    },
    {
      title: 'Completion SLA',
      key: 'resolution_sla',
      render: (_, record: any) => (
        record.sla ? <SlaCountdownCell deadline={record.sla.resolution_deadline} status={record.sla.resolution_status} /> : <span style={{ opacity: 0.5 }}>-</span>
      ),
    },
  ];

  // "All Requests" tab actions — View, Edit (admin), Delete (admin)
  const allRequestsColumns: ColumnsType<ServiceRequest> = [
    ...sharedColumns,
    {
      title: t('serviceRequests.table.actions'),
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('common.view')}>
            <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => navigate(`/service-requests/${record.id}`)} />
          </Tooltip>
          {isAdmin && (
            <>
              <Tooltip title={t('common.edit')}>
                <Button type="text" icon={<EditOutlined />} size="small" onClick={() => navigate(`/service-requests/${record.id}/edit`)} />
              </Tooltip>
              <Tooltip title={t('common.delete')}>
                <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record)} />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  // "Flagged (Spam)" tab actions — View, Restore (admin)
  const spamRequestsColumns: ColumnsType<ServiceRequest> = [
    ...sharedColumns,
    {
      title: t('serviceRequests.table.actions'),
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('common.viewDetails')}>
            <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => navigate(`/service-requests/${record.id}`)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // "My Approvals" tab actions — View, Approve, Reject
  const myApprovalsColumns: ColumnsType<ServiceRequest> = [
    ...sharedColumns,
    {
      title: t('serviceRequests.table.actions'),
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('common.view')}>
            <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => navigate(`/service-requests/${record.id}`)} />
          </Tooltip>
          <Tooltip title={t('common.approve')}>
            <Button
              type="text"
              icon={<CheckCircleOutlined />}
              size="small"
              style={{ color: '#52c41a' }}
              onClick={() => openApprovalModal(record, 'APPROVE')}
            />
          </Tooltip>
          <Tooltip title={t('common.reject')}>
            <Button
              type="text"
              icon={<CloseCircleOutlined />}
              size="small"
              danger
              onClick={() => openApprovalModal(record, 'REJECT')}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'all',
      label: t('serviceRequests.tabs.allRequests'),
    },
    {
      key: 'my-approvals',
      label: t('serviceRequests.tabs.myApprovals'),
    },
    {
      key: 'queue',
      label: t('serviceRequests.tabs.priorityQueue'),
    }
  ];

  if (isAdmin) {
    tabItems.push({
      key: 'spam',
      label: t('serviceRequests.tabs.flaggedRequests'),
    });
  }

  const handlePriorityChange = (id: string, priority: string) => {
    updatePriority.mutate({ id, priority });
  };

  const handleApproveFromQueue = (record: ServiceRequest) => {
    showConfirmDialog({
      title: t('serviceRequests.approveAndConvertTitle'),
      content: t('serviceRequests.approveAndConvertContent', { subject: record.subject }),
      onOk: async () => {
        const response = await approveAndConvert.mutateAsync(record.id);
        const wo = response.data.data?.workOrder;
        if (wo) {
          navigate(`/work-orders/${wo.id}`);
        }
      },
    });
  };

  const handleRejectFromQueue = (record: ServiceRequest) => {
    showConfirmDialog({
      title: t('serviceRequests.rejectRequestTitle'),
      content: t('serviceRequests.rejectRequestContent', { subject: record.subject }),
      onOk: async () => {
        await rejectSr.mutateAsync({ id: record.id, status: 'rejected' });
      },
      danger: true,
    });
  };

  const queueColumns: ColumnsType<ServiceRequest> = [
    {
      title: t('serviceRequests.table.requestId'),
      dataIndex: 'request_number',
      key: 'request_number',
      width: 140,
      render: (num: string) => (
        <span style={{ fontWeight: 600, fontFamily: 'monospace', color: '#1890ff' }}>
          {num || '-'}
        </span>
      ),
    },
    {
      title: t('serviceRequests.table.subject'),
      dataIndex: 'subject',
      key: 'subject',
      render: (subject: string) => <span style={{ fontWeight: 500 }}>{subject}</span>,
    },
    {
      title: t('serviceRequests.table.priority'),
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string, record: ServiceRequest) => (
        <Select
          value={priority}
          onChange={(value) => handlePriorityChange(record.id, value)}
          style={{ width: 120 }}
          loading={updatePriority.isPending}
          options={[
            { value: 'low', label: t('serviceRequests.priorityOptions.low') },
            { value: 'medium', label: t('serviceRequests.priorityOptions.medium') },
            { value: 'high', label: t('serviceRequests.priorityOptions.high') },
            { value: 'urgent', label: t('serviceRequests.priorityOptions.urgent') },
          ]}
        />
      ),
    },
    {
      title: t('serviceRequests.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'} style={{ whiteSpace: 'nowrap' }}>
          {statusLabelsMap[status] || status?.replace(/_/g, ' ').replace(/\\b\\w/g, (l) => l.toUpperCase())}
        </Tag>
      ),
    },
    {
      title: t('serviceRequests.table.created'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: 'Response SLA',
      key: 'response_sla',
      render: (_, record: any) => (
        record.sla ? <SlaCountdownCell deadline={record.sla.response_deadline} status={record.sla.response_status} /> : <span style={{ opacity: 0.5 }}>-</span>
      ),
    },
    {
      title: 'Completion SLA',
      key: 'resolution_sla',
      render: (_, record: any) => (
        record.sla ? <SlaCountdownCell deadline={record.sla.resolution_deadline} status={record.sla.resolution_status} /> : <span style={{ opacity: 0.5 }}>-</span>
      ),
    },
    {
      title: t('serviceRequests.table.actions'),
      key: 'actions',
      fixed: 'right',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('common.view')}>
            <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => navigate(`/service-requests/${record.id}`)} />
          </Tooltip>
          {isAdmin && !['converted_to_wo', 'closed', 'spam', 'rejected'].includes(record.status) && (
            <>
              <Tooltip title={t('serviceRequests.approveAndConvertTooltip')}>
                <Button
                  type="text"
                  icon={<CheckCircleOutlined />}
                  size="small"
                  style={{ color: '#52c41a' }}
                  loading={approveAndConvert.isPending}
                  onClick={() => handleApproveFromQueue(record)}
                />
              </Tooltip>
              <Tooltip title={t('common.reject')}>
                <Button
                  type="text"
                  icon={<CloseCircleOutlined />}
                  size="small"
                  danger
                  onClick={() => handleRejectFromQueue(record)}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  const columns = activeTab === 'queue' ? queueColumns : activeTab === 'spam' ? spamRequestsColumns : activeTab === 'my-approvals' ? myApprovalsColumns : allRequestsColumns;

  return (
    <div>
      <PageHeader
        title={t('nav.serviceRequests')}
        subtitle={t('serviceRequests.pageSubtitle')}
        extra={
          <PermissionGuard permission="service_requests:create">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/service-requests/new')}>
              {t('serviceRequests.addRequest')}
            </Button>
          </PermissionGuard>
        }
      />

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <SearchFilter
          placeholder={t('serviceRequests.searchPlaceholder')}
          allowClear
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ width: 400 }}
        />
        {activeTab === 'all' && (
          <Select
            placeholder={t('serviceRequests.filterByStatusPlaceholder')}
            allowClear
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
              if (value) {
                setSearchParams({ status: value }, { replace: true });
              } else {
                setSearchParams({}, { replace: true });
              }
            }}
            options={statusOptions}
            style={{ width: 200 }}
          />
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <Table
          columns={columns}
          dataSource={requests}
          scroll={{ x: 1200 }}
          rowKey="id"
          loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: meta?.itemCount || 0,
          showSizeChanger: true,
          showTotal: (total) => t('serviceRequests.paginationTotal', { total }),
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          },
        }}
        />
      </div>

      {/* Approval Action Modal */}
      <Modal
        title={approvalAction === 'APPROVE' ? t('serviceRequests.approveRequestTitle') : t('serviceRequests.rejectRequestTitle')}
        open={approvalModalOpen}
        onOk={handleProcessApproval}
        onCancel={() => setApprovalModalOpen(false)}
        confirmLoading={approvalProcessing}
        okText={approvalAction === 'APPROVE' ? t('common.approve') : t('common.reject')}
        okButtonProps={{
          danger: approvalAction === 'REJECT',
        }}
      >
        <p style={{ marginBottom: 12 }}>
          {approvalAction === 'APPROVE'
            ? <>{t('serviceRequests.approveModalContent', { subject: <strong>{approvalSrSubject}</strong> })}</>
            : <>{t('serviceRequests.rejectModalContent', { subject: <strong>{approvalSrSubject}</strong> })}</>}
        </p>
        <Input.TextArea
          rows={3}
          placeholder={t('common.addCommentsPlaceholder')}
          value={approvalComments}
          onChange={(e) => setApprovalComments(e.target.value)}
        />
      </Modal>
    </div>
  );
}