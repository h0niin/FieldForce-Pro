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
import { useSlaTimers } from '@/hooks/use-sla-timers';
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

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'estimated', label: 'Estimated' },
  { value: 'approved', label: 'Approved' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

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

const approvalStatusLabels: Record<string, string> = {
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PENDING: 'Awaiting Review',
  SKIPPED: 'Skipped',
};

const TIMER_PRIORITY: Array<'acceptance' | 'travel' | 'on_site_prep' | 'work_completion'> = [
  'acceptance', 'travel', 'on_site_prep', 'work_completion',
];

const TIMER_LABELS: Record<string, string> = {
  acceptance: 'Acceptance',
  travel: 'Travel',
  on_site_prep: 'On-Site Prep',
  work_completion: 'Work',
  total_resolution: 'Total',
};

function SlaTimerCell({ workOrderId }: { workOrderId: string }) {
  const { data: slaTimers } = useSlaTimers(workOrderId);
  if (!slaTimers) return <span style={{ color: '#999' }}>-</span>;

  // Show the first non-completed timer in priority order
  for (const key of TIMER_PRIORITY) {
    const timer = slaTimers[key];
    if (timer && !timer.status.startsWith('completed')) {
      return <SlaTimerBadge timer={timer} compact label={TIMER_LABELS[key]} />;
    }
  }

  // All done — show work_completion result if available
  if (slaTimers.work_completion) {
    return <SlaTimerBadge timer={slaTimers.work_completion} compact label="Work" />;
  }

  return <span style={{ color: '#999' }}>-</span>;
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
      title: 'Delete Work Order',
      content: `Are you sure you want to delete work order ${workOrder.wo_number || workOrder.id}?`,
      onOk: async () => {
        await deleteWorkOrder.mutateAsync(workOrder.id);
      },
      danger: true,
    });
  };

  const columns: ColumnsType<WorkOrder> = [
    {
      title: 'WO #',
      dataIndex: 'wo_number',
      key: 'wo_number',
      render: (num: string) => <span style={{ fontWeight: 500 }}>{num || '-'}</span>,
    },
    {
      title: 'Summary',
      dataIndex: 'summary',
      key: 'summary',
      render: (summary: string) => <span style={{ fontWeight: 500 }}>{summary}</span>,
      sorter: (a, b) => a.summary.localeCompare(b.summary),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={priorityColors[priority] || 'default'}>
          {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {formatStatus(status)}
        </Tag>
      ),
    },
    {
      title: 'Customer',
      key: 'contact',
      render: (_, record) =>
        record.contact
          ? `${record.contact.first_name} ${record.contact.last_name}`
          : <span style={{ color: '#999' }}>-</span>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => category ? <Tag>{category}</Tag> : <span style={{ color: '#999' }}>-</span>,
    },
    {
      title: 'Scheduled Date',
      dataIndex: 'scheduled_start',
      key: 'scheduled_start',
      render: (date: string) => date ? formatDateTime(date) : <span style={{ color: '#999' }}>-</span>,
      sorter: (a, b) => {
        if (!a.scheduled_start) return 1;
        if (!b.scheduled_start) return -1;
        return new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime();
      },
    },
    {
      title: 'Assigned To',
      key: 'assigned_to',
      render: (_: unknown, record: WorkOrder) => {
        const a = (record as any).assignee;
        return a ? `${a.first_name} ${a.last_name}`.trim() : <span style={{ color: '#999' }}>-</span>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDateTime(date),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: 'SLA',
      key: 'sla',
      render: (_, record) => <SlaTimerCell workOrderId={record.id} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard permission="work-orders:read">
            <Tooltip title="View">
              <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => navigate(`/work-orders/${record.id}`)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="work-orders:update">
            <Tooltip title="Edit">
              <Button type="text" icon={<EditOutlined />} size="small" onClick={() => navigate(`/work-orders/${record.id}/edit`)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="work-orders:delete">
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record)} />
            </Tooltip>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  const approvalColumns: ColumnsType<DocumentApproval> = [
    {
      title: 'Work Order',
      dataIndex: 'document_id',
      key: 'document_id',
      render: (docId: string) => (
        <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate(`/work-orders/${docId}`)}>
          {docId.slice(0, 8)}...
        </Button>
      ),
    },
    {
      title: 'Approver',
      key: 'approver',
      render: (_, record) => {
        const approver = record.approver;
        if (!approver) return <span style={{ color: '#999' }}>-</span>;
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
      title: 'Workflow',
      key: 'workflow',
      render: (_, record) => record.workflow_template?.name || <span style={{ color: '#999' }}>-</span>,
    },
    {
      title: 'Step',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 80,
      render: (step: number) => <Tag>{`Step ${step}`}</Tag>,
    },
    {
      title: 'Status',
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
      title: 'Requested',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDateTime(date),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 240,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Work Order">
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
            Approve
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
            Reject
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
          subtitle="Manage work orders"
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => navigate('/work-orders/new')}
          style={{ marginTop: 16 }}
        >
          Create Work Order
        </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'all',
            label: 'All Work Orders',
            children: (
              <>
                <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <SearchFilter
                    placeholder="Search work orders by summary or WO number"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  <Select
                    placeholder="Filter by status"
                    allowClear
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value)}
                    options={statusOptions}
                    style={{ width: 180 }}
                  />
                  <Select
                    placeholder="Filter by priority"
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
                    showTotal: (total) => `Total ${total} work orders`,
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
                Approvals
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
                locale={{ emptyText: 'No approvals for work orders' }}
                pagination={false}
              />
            ),
          },
          {
            key: 'field-workflow',
            label: (
              <span>
                <CarOutlined style={{ marginRight: 4 }} />
                Field Workflow
              </span>
            ),
            children: activeTab === 'field-workflow' ? (
              myAppointmentsLoading ? (
                <div style={{ textAlign: 'center', padding: 48 }}>Loading...</div>
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
                      {filteredFieldWorkOrders.length} of {myWorkOrders.length} work order{myWorkOrders.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {filteredFieldWorkOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
                      No work orders scheduled for {fieldWorkDate.format('MMMM D, YYYY')}
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
        title="Reject Work Order"
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
        okText="Reject"
        okButtonProps={{ danger: true, loading: processApproval.isPending }}
      >
        <Form layout="vertical">
          <Form.Item label="Reason (optional)">
            <TextArea
              rows={3}
              placeholder="Enter rejection reason..."
              value={rejectComments}
              onChange={(e) => setRejectComments(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
