import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Table, Space, Tooltip, Tag, Select, Tabs, Modal, Input, Form, Avatar, DatePicker } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, TeamOutlined, UserOutlined, CarOutlined, CalendarOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useWorkOrders, useDeleteWorkOrder } from '@/hooks/use-work-orders';
import { useMyPendingApprovals, useProcessApproval } from '@/hooks/use-workflow';
import { useMyAppointments } from '@/hooks/use-appointments';
import { useSlaTimer } from '@/hooks/use-sla-timers';
import { SlaTimerBadge } from '@/components/work-orders/SlaTimerBadge';
import FieldWorkflowCard from '@/components/work-orders/FieldWorkflowCard';
import type { WorkOrder } from '@/types/models.types';
import type { DocumentApproval } from '@/types/workflow.types';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import SearchFilter from '@/components/common/SearchFilter';
import { formatDateTime } from '@/utils/format-date';

const priorityColors: Record<string, string> = {
  urgent: 'red',
  high: 'orange',
  medium: 'blue',
  low: 'default',
};

const statusColors: Record<string, string> = {
  new: 'blue',
  estimated: 'gold',
  approved: 'green',
  scheduled: 'cyan',
  in_progress: 'processing',
  on_hold: 'orange',
  completed: 'green',
  closed: 'default',
  cancelled: 'red',
};

const { TextArea } = Input;

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

const approvalStatusColors: Record<string, string> = {
  APPROVED: 'success',
  REJECTED: 'error',
  PENDING: 'processing',
  SKIPPED: 'default',
};

function SlaTimerCell({ workOrderId }: { workOrderId: string }) {
  const { data: slaTimer } = useSlaTimer(workOrderId);
  if (!slaTimer) return <span style={{ color: '#999' }}>-</span>;
  return <SlaTimerBadge timer={slaTimer} compact />;
}
function CountdownCell({
  createdAt,
  slaHours,
  status,
}: {
  createdAt: string;
  slaHours?: number;
  status?: string;
}) {
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000); // update every minute

    return () => clearInterval(interval);
  }, []);

  if (!slaHours || !createdAt) {
    return <span style={{ color: '#999' }}>-</span>;
  }

  // Stop showing countdown if WO already accepted/completed
  const stoppedStatuses = ['accepted', 'completed', 'closed'];

  if (stoppedStatuses.includes(status || '')) {
    return <span>-</span>;
  }

  const deadline =
    new Date(createdAt).getTime() + slaHours * 60 * 60 * 1000;

  const diffMs = deadline - now;

  const formatDuration = (ms: number) => {
    const totalMinutes = Math.floor(Math.abs(ms) / (1000 * 60));

    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }

    return `${hours}h ${minutes}m`;
  };

  // SLA breached
  if (diffMs < 0) {
    return (
      <span
        style={{
          color: '#ff4d4f',
          fontWeight: 600,
        }}
      >
        Overdue: {formatDuration(diffMs)}
      </span>
    );
  }

  // SLA still running
  return (
    <span
      style={{
        color: '#52c41a',
        fontWeight: 500,
      }}
    >
      {formatDuration(diffMs)}
    </span>
  );
}

export default function WorkOrderListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>(undefined);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectApprovalId, setRejectApprovalId] = useState<string | null>(null);
  const [rejectComments, setRejectComments] = useState('');
  const [processingApprovalId, setProcessingApprovalId] = useState<string | null>(null);
  const [fieldWorkDate, setFieldWorkDate] = useState<dayjs.Dayjs>(dayjs());

  const { data, isLoading } = useWorkOrders({ page, take: pageSize, search });
  const deleteWorkOrder = useDeleteWorkOrder();
  const { data: pendingApprovalsData, isLoading: approvalsLoading } = useMyPendingApprovals({ page: 1, take: 100 });
  const processApproval = useProcessApproval();

  const statusOptions = [
    { value: 'new', label: t('workOrders.status.new') },
    { value: 'estimated', label: t('workOrders.status.estimated') },
    { value: 'approved', label: t('workOrders.status.approved') },
    { value: 'scheduled', label: t('workOrders.status.scheduled') },
    { value: 'in_progress', label: t('workOrders.status.inProgress') },
    { value: 'on_hold', label: t('workOrders.status.onHold') },
    { value: 'completed', label: t('workOrders.status.completed') },
    { value: 'closed', label: t('workOrders.status.closed') },
    { value: 'cancelled', label: t('workOrders.status.cancelled') },
  ];

  const priorityOptions = [
    { value: 'low', label: t('workOrders.priority.low') },
    { value: 'medium', label: t('workOrders.priority.medium') },
    { value: 'high', label: t('workOrders.priority.high') },
    { value: 'urgent', label: t('workOrders.priority.urgent') },
  ];

  const approvalStatusLabels: Record<string, string> = {
    APPROVED: t('workOrders.approvalStatus.approved'),
    REJECTED: t('workOrders.approvalStatus.rejected'),
    PENDING: t('workOrders.approvalStatus.awaitingReview'),
    SKIPPED: t('workOrders.approvalStatus.skipped'),
  };

  const statusKeyMap: Record<string, string> = {
    new: 'new',
    estimated: 'estimated',
    approved: 'approved',
    scheduled: 'scheduled',
    in_progress: 'inProgress',
    on_hold: 'onHold',
    completed: 'completed',
    closed: 'closed',
    cancelled: 'cancelled'
  };

  // Filter pending approvals for WORK_ORDER type only
  const woApprovals = (pendingApprovalsData?.data || []).filter(
    (a) => a.document_type === 'WORK_ORDER',
  );

  // Parse wo_id query param for notification deep-linking
  const searchParams = new URLSearchParams(location.search);
  const deepLinkWoId = searchParams.get('wo_id');

  // My appointments for the Field Workflow tab
  const { data: myAppointments, isLoading: myAppointmentsLoading } = useMyAppointments();

  // Extract unique work orders from appointments
  const myWorkOrders = React.useMemo(() => {
    if (!myAppointments) return [];
    const seen = new Set<string>();
    const result: typeof myAppointments = [];
    for (const appt of myAppointments) {
      if (appt.work_order && !seen.has(appt.work_order_id)) {
        seen.add(appt.work_order_id);
        result.push(appt);
      }
    }
    return result;
  }, [myAppointments]);

  // Build a set of dates that have scheduled work orders
  const scheduledDatesSet = React.useMemo(() => {
    const dates = new Set<string>();
    for (const appt of myWorkOrders) {
      const dateStr = appt.work_order?.scheduled_start || appt.scheduled_start;
      if (dateStr) dates.add(dayjs(dateStr).format('YYYY-MM-DD'));
    }
    return dates;
  }, [myWorkOrders]);

  // Filter field work orders by selected date
  const filteredFieldWorkOrders = React.useMemo(() => {
    if (!fieldWorkDate) return myWorkOrders;
    const selected = fieldWorkDate.format('YYYY-MM-DD');
    return myWorkOrders.filter((appt) => {
      const dateStr = appt.work_order?.scheduled_start || appt.scheduled_start;
      if (!dateStr) return false;
      return dayjs(dateStr).format('YYYY-MM-DD') === selected;
    });
  }, [myWorkOrders, fieldWorkDate]);

  // Auto-switch tabs when arriving via hash links (from notifications)
  useEffect(() => {
    if (location.hash === '#approvals') {
      setActiveTab('approvals');
    } else if (location.hash === '#field-workflow') {
      setActiveTab('field-workflow');
    }
  }, [location.hash]);

  const workOrders = data?.data || [];
  const meta = data?.meta;

  // Client-side filtering
  const filteredWorkOrders = workOrders.filter((wo) => {
    if (statusFilter && wo.status !== statusFilter) return false;
    if (priorityFilter && wo.priority !== priorityFilter) return false;
    return true;
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = (workOrder: WorkOrder) => {
    showConfirmDialog({
      title: t('workOrders.delete.title'),
      content: t('workOrders.delete.confirmContent', { id: workOrder.wo_number || workOrder.id }),
      onOk: async () => {
        await deleteWorkOrder.mutateAsync(workOrder.id);
      },
      danger: true,
    });
  };

  const columns: ColumnsType<WorkOrder> = [
    {
      title: t('workOrders.columns.woNumber'),
      dataIndex: 'wo_number',
      key: 'wo_number',
      render: (num: string) => <span style={{ fontWeight: 500 }}>{num || '-'}</span>,
    },
    {
      title: t('workOrders.columns.summary'),
      dataIndex: 'summary',
      key: 'summary',
      render: (summary: string) => <span style={{ fontWeight: 500 }}>{summary}</span>,
      sorter: (a, b) => a.summary.localeCompare(b.summary),
    },
    {
      title: t('workOrders.columns.priority'),
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={priorityColors[priority] || 'default'}>
          {t(`workOrders.priority.${priority}`, { defaultValue: priority })}
        </Tag>
      ),
    },
    {
      title: t('workOrders.columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {t(`workOrders.status.${statusKeyMap[status] || status}`, { defaultValue: formatStatus(status) })}
        </Tag>
      ),
    },
    {
      title: t('workOrders.columns.customer'),
      key: 'contact',
      render: (_, record) =>
        record.contact
          ? `${record.contact.first_name} ${record.contact.last_name}`
          : <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('workOrders.columns.category'),
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => category ? <Tag>{category}</Tag> : <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('workOrders.columns.scheduledDate'),
      dataIndex: 'scheduled_start',
      key: 'scheduled_start',
      render: (date: string) => date ? formatDateTime(date) : <span style={{ opacity: 0.5 }}>-</span>,
      sorter: (a, b) => {
        if (!a.scheduled_start) return 1;
        if (!b.scheduled_start) return -1;
        return new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime();
      },
    },
    {
      title: t('workOrders.columns.assignedTo'),
      dataIndex: 'assigned_to',
      key: 'assigned_to',
      render: (assignee: string) => assignee || <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('workOrders.columns.created'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDateTime(date),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: t('workOrders.columns.sla'),
      key: 'sla',
      render: (_, record) => (
        <span>{record.slaHours ? `${record.slaHours} Hours` : '-'}</span>
      ),
    },
    {
      title: 'Countdown',
      key: 'countdown',
      width: 160,
      render: (_, record) => (
        <CountdownCell
          createdAt={record.created_at}
          slaHours={record.slaHours}
          status={record.status}
        />
      ),
    },
    {
      title: t('workOrders.columns.actions'),
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard permission="work-orders:read">
            <Tooltip title={t('workOrders.tooltips.view')}>
              <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => navigate(`/work-orders/${record.id}`)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="work-orders:update">
            <Tooltip title={t('workOrders.tooltips.edit')}>
              <Button type="text" icon={<EditOutlined />} size="small" onClick={() => navigate(`/work-orders/${record.id}/edit`)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="work-orders:delete">
            <Tooltip title={t('workOrders.tooltips.delete')}>
              <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record)} />
            </Tooltip>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  const approvalColumns: ColumnsType<DocumentApproval> = [
    {
      title: t('workOrders.approvals.columns.workOrder'),
      dataIndex: 'document_id',
      key: 'document_id',
      render: (docId: string) => (
        <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate(`/work-orders/${docId}`)}>
          {docId.slice(0, 8)}...
        </Button>
      ),
    },
    {
      title: t('workOrders.approvals.columns.approver'),
      key: 'approver',
      render: (_, record) => {
        const approver = record.approver;
        if (!approver) return <span style={{ opacity: 0.5 }}>-</span>;
        const initials = `${(approver.first_name || '').charAt(0)}${(approver.last_name || '').charAt(0)}`.toUpperCase();
        return (
          <Space size={8}>
            <Avatar size={28} style={{ background: '#1677ff', fontSize: 11 }}>
              {initials || <UserOutlined />}
            </Avatar>
            <div>
              <div style={{ fontWeight: 500, fontSize: 13, lineHeight: '18px' }}>{approver.first_name} {approver.last_name}</div>
              <div style={{ fontSize: 12, color: '#999', lineHeight: '16px' }}>{approver.email}</div>
            </div>
          </Space>
        );
      },
    },
    {
      title: t('workOrders.approvals.columns.workflow'),
      key: 'workflow',
      render: (_, record) => record.workflow_template?.name || <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('workOrders.approvals.columns.step'),
      dataIndex: 'order_no',
      key: 'order_no',
      width: 80,
      render: (step: number) => <Tag>{t('workOrders.approvals.step', { step })}</Tag>,
    },
    {
      title: t('workOrders.approvals.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <Tag color={approvalStatusColors[status] || 'default'}>
          {approvalStatusLabels[status] || status}
        </Tag>
      ),
    },
    {
      title: t('workOrders.approvals.columns.requested'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDateTime(date),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: t('workOrders.approvals.columns.actions'),
      key: 'actions',
      width: 240,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('workOrders.tooltips.viewWorkOrder')}>
            <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => navigate(`/work-orders/${record.document_id}`)} />
          </Tooltip>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            loading={processingApprovalId === record.id && processApproval.isPending}
            disabled={processingApprovalId !== null && processingApprovalId !== record.id}
            onClick={async () => {
              setProcessingApprovalId(record.id);
              try {
                await processApproval.mutateAsync({ id: record.id, action: 'APPROVE' });
              } finally {
                setProcessingApprovalId(null);
              }
            }}
          >
            {t('workOrders.approvals.actions.approve')}
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseCircleOutlined />}
            onClick={() => {
              setRejectApprovalId(record.id);
              setRejectComments('');
              setRejectOpen(true);
            }}
          >
            {t('workOrders.approvals.actions.reject')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <PageHeader
          title={t('nav.workOrders')}
          subtitle={t('workOrders.subtitle')}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => navigate('/work-orders/new')}
          style={{ marginTop: 16 }}
        >
          {t('workOrders.actions.create')}
        </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'all',
            label: t('workOrders.tabs.allWorkOrders'),
            children: (
              <>
                <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <SearchFilter
                    placeholder={t('workOrders.searchPlaceholder')}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  <Select
                    placeholder={t('workOrders.filters.status')}
                    allowClear
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value)}
                    options={statusOptions}
                    style={{ width: 180 }}
                  />
                  <Select
                    placeholder={t('workOrders.filters.priority')}
                    allowClear
                    value={priorityFilter}
                    onChange={(value) => setPriorityFilter(value)}
                    options={priorityOptions}
                    style={{ width: 180 }}
                  />
                </div>

                <Table
                  columns={columns}
                  dataSource={filteredWorkOrders}
                  rowKey="id"
                  loading={isLoading}
                  scroll={{ x: 1400 }}
                  pagination={{
                    current: page,
                    pageSize,
                    total: meta?.itemCount || 0,
                    showSizeChanger: true,
                    showTotal: (total) => t('workOrders.pagination.total', { total }),
                    onChange: (newPage, newPageSize) => {
                      setPage(newPage);
                      setPageSize(newPageSize);
                    },
                  }}
                />
              </>
            ),
          },
          {
            key: 'approvals',
            label: (
              <span>
                <TeamOutlined style={{ marginRight: 4 }} />
                {t('workOrders.tabs.approvals')}
                {woApprovals.length > 0 && (
                  <Tag color="warning" style={{ marginLeft: 6 }}>{woApprovals.length}</Tag>
                )}
              </span>
            ),
            children: (
              <Table
                columns={approvalColumns}
                dataSource={woApprovals}
                rowKey="id"
                loading={approvalsLoading}
                locale={{ emptyText: t('workOrders.approvals.empty') }}
                pagination={false}
              />
            ),
          },
          {
            key: 'field-workflow',
            label: (
              <span>
                <CarOutlined style={{ marginRight: 4 }} />
                {t('workOrders.tabs.fieldWorkflow')}
              </span>
            ),
            children: activeTab === 'field-workflow' ? (
              myAppointmentsLoading ? (
                <div style={{ textAlign: 'center', padding: 48 }}>{t('workOrders.loading')}</div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <CalendarOutlined style={{ fontSize: 16, color: '#1677ff' }} />
                    <DatePicker
                      value={fieldWorkDate}
                      onChange={(date) => setFieldWorkDate(date || dayjs())}
                      format="YYYY-MM-DD"
                      allowClear={false}
                      style={{ width: 200 }}
                      cellRender={(current, info) => {
                        if (info.type !== 'date') return info.originNode;
                        const dateStr = (current as dayjs.Dayjs).format('YYYY-MM-DD');
                        const hasSchedule = scheduledDatesSet.has(dateStr);
                        return (
                          <div className="ant-picker-cell-inner" style={{ position: 'relative' }}>
                            {(current as dayjs.Dayjs).date()}
                            {hasSchedule && (
                              <span style={{
                                position: 'absolute',
                                bottom: 2,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: '#1677ff',
                              }} />
                            )}
                          </div>
                        );
                      }}
                    />
                    <span style={{ color: '#999', fontSize: 13 }}>
                      {t('workOrders.fieldWorkflow.countSummary', { count: filteredFieldWorkOrders.length, total: myWorkOrders.length })}
                    </span>
                  </div>
                  {filteredFieldWorkOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
                      {t('workOrders.fieldWorkflow.empty', { date: fieldWorkDate.format('MMMM D, YYYY') })}
                    </div>
                  ) : (
                    filteredFieldWorkOrders.map((appt) => (
                      <FieldWorkflowCard
                        key={appt.work_order_id}
                        workOrderId={appt.work_order_id}
                        workOrder={appt.work_order!}
                        defaultExpanded={deepLinkWoId === appt.work_order_id}
                      />
                    ))
                  )}
                </div>
              )
            ) : null,
          },
        ]}
      />

      <Modal
        title={t('workOrders.rejectModal.title')}
        open={rejectOpen}
        onCancel={() => { setRejectOpen(false); setRejectApprovalId(null); setRejectComments(''); }}
        onOk={async () => {
          if (!rejectApprovalId) return;
          await processApproval.mutateAsync({
            id: rejectApprovalId,
            action: 'REJECT',
            comments: rejectComments || undefined,
          });
          setRejectOpen(false);
          setRejectApprovalId(null);
          setRejectComments('');
        }}
        okText={t('workOrders.rejectModal.okText')}
        okButtonProps={{ danger: true, loading: processApproval.isPending }}
      >
        <Form layout="vertical">
          <Form.Item label={t('workOrders.rejectModal.reasonLabel')}>
            <TextArea
              rows={3}
              placeholder={t('workOrders.rejectModal.reasonPlaceholder')}
              value={rejectComments}
              onChange={(e) => setRejectComments(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}