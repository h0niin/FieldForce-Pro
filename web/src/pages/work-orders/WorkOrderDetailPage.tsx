import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Skeleton, Tag, Table, Tabs, Form, Input, Switch, Upload, Modal, Select, DatePicker, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import { EditOutlined, DeleteOutlined, PlusOutlined, PaperClipOutlined, FileTextOutlined, UploadOutlined, UserAddOutlined, CheckCircleOutlined, CloseCircleOutlined, PlayCircleOutlined, EnvironmentOutlined, CarOutlined, PhoneOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useWorkOrder, useDeleteWorkOrder, useUpdateWorkOrderStatus, useAcceptJob, useDeclineJob } from '@/hooks/use-work-orders';
import { useCreateAgentLocation } from '@/hooks/use-agent-locations';
import { useAuthStore } from '@/store/auth.store';
import { useWorkOrderLineItems, useDeleteWorkOrderLineItem } from '@/hooks/use-work-order-line-items';
import { useWorkOrderNotes, useCreateWorkOrderNote, useDeleteWorkOrderNote } from '@/hooks/use-work-order-notes';
import { useWorkOrderAttachments, useUploadWorkOrderAttachment, useDeleteWorkOrderAttachment } from '@/hooks/use-work-order-attachments';
import { useCreateAppointment } from '@/hooks/use-appointments';
import { useUsers } from '@/hooks/use-users';
import { useEstimatesByWorkOrder, useAdminApproveEstimate, useAdminRejectEstimate, useGenerateInvoiceFromEstimate } from '@/hooks/use-estimates';
import type { WorkOrderLineItem, WorkOrderNote, WorkOrderAttachment, Estimate } from '@/types/models.types';
import { useSlaTimer } from '@/hooks/use-sla-timers';
import { SlaTimerBadge } from '@/components/work-orders/SlaTimerBadge';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';
import { formatCurrency } from '@/utils/format-currency';
import TechnicianFeedbackModal from '@/components/feedback/TechnicianFeedbackModal';
import { useWorkOrderFeedback } from '@/hooks/use-feedback';
import { Alert, Rate } from 'antd';

const { TextArea } = Input;

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

// Status transitions: New -> Estimated -> Approved -> Scheduled -> In Progress -> On Hold -> Completed -> Closed | Cancelled
const statusTransitions: Record<string, string[]> = {
  new: ['estimated', 'cancelled'],
  estimated: ['approved', 'cancelled'],
  approved: ['scheduled', 'cancelled'],
  scheduled: ['in_progress', 'cancelled'],
  in_progress: ['on_hold', 'completed', 'cancelled'],
  on_hold: ['in_progress', 'cancelled'],
  completed: ['closed'],
  closed: [],
  cancelled: [],
};

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function WorkOrderDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [noteForm] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [declineForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('details');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);

  const currentUser = useAuthStore((s) => s.user);

  const { data: workOrder, isLoading } = useWorkOrder(id!);
  const { data: slaTimer } = useSlaTimer(id!);
  const { data: feedbackData, isLoading: feedbackLoading } = useWorkOrderFeedback(id!);
  const { data: lineItems, isLoading: lineItemsLoading } = useWorkOrderLineItems(id!);
  const { data: notes, isLoading: notesLoading } = useWorkOrderNotes(id!);
  const { data: attachments, isLoading: attachmentsLoading } = useWorkOrderAttachments(id!);
  const { data: usersData } = useUsers();
  const deleteWorkOrder = useDeleteWorkOrder();
  const updateStatus = useUpdateWorkOrderStatus();
  const deleteLineItem = useDeleteWorkOrderLineItem();
  const createNote = useCreateWorkOrderNote();
  const deleteNote = useDeleteWorkOrderNote();
  const uploadAttachment = useUploadWorkOrderAttachment();
  const deleteAttachment = useDeleteWorkOrderAttachment();
  const createAppointment = useCreateAppointment();
  const acceptJob = useAcceptJob();
  const declineJob = useDeclineJob();
  const createAgentLocation = useCreateAgentLocation();
  const { data: woEstimates, isLoading: woEstimatesLoading } = useEstimatesByWorkOrder(id!);
  const adminApproveEstimate = useAdminApproveEstimate();
  const adminRejectEstimate = useAdminRejectEstimate();
  const generateInvoiceFromEstimate = useGenerateInvoiceFromEstimate();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isTripActive, setIsTripActive] = useState(false);
  const tripIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendLocation = () => {
    if (!currentUser) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      createAgentLocation.mutate({
        user_id: currentUser.id,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        speed: pos.coords.speed ?? undefined,
        heading: pos.coords.heading ?? undefined,
        recorded_at: new Date().toISOString(),
      });
    });
  };

  const startTrip = () => {
    if (!navigator.geolocation) {
      message.error(t('workOrderDetails.messages.geolocationNotSupported'));
      return;
    }
    sendLocation();
    tripIntervalRef.current = setInterval(sendLocation, 30000);
    setIsTripActive(true);
    message.success(t('workOrderDetails.messages.tripStarted'));
  };

  const stopTrip = () => {
    if (tripIntervalRef.current) {
      clearInterval(tripIntervalRef.current);
      tripIntervalRef.current = null;
    }
    setIsTripActive(false);
    message.info(t('workOrderDetails.messages.tripStopped'));
  };

  useEffect(() => {
    return () => {
      if (tripIntervalRef.current) clearInterval(tripIntervalRef.current);
    };
  }, []);

  const handleAssignTechnician = async (values: { agent_ids: string[]; scheduled_start: dayjs.Dayjs; scheduled_end: dayjs.Dayjs }) => {
    if (!workOrder) return;
    try {
      await Promise.all(
        values.agent_ids.map((agent_id) =>
          createAppointment.mutateAsync({
            work_order_id: workOrder.id,
            agent_id,
            scheduled_start: values.scheduled_start.toISOString(),
            scheduled_end: values.scheduled_end.toISOString(),
          })
        )
      );
      message.success(t('workOrderDetails.messages.assignSuccess'));
      setAssignModalOpen(false);
      assignForm.resetFields();
    } catch {
      message.error(t('workOrderDetails.messages.assignFailed'));
    }
  };

  const handleDelete = () => {
    if (!workOrder) return;
    showConfirmDialog({
      title: t('workOrderDetails.dialogs.deleteWorkOrderTitle'),
      content: t('workOrderDetails.dialogs.deleteWorkOrderConfirm', { id: workOrder.wo_number || workOrder.id }),
      onOk: async () => {
        await deleteWorkOrder.mutateAsync(workOrder.id);
        navigate('/work-orders');
      },
      danger: true,
    });
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!workOrder) return;
    await updateStatus.mutateAsync({ id: workOrder.id, status: newStatus });
  };

  const handleAddNote = async (values: { content: string; is_internal: boolean }) => {
    if (!workOrder) return;
    await createNote.mutateAsync({
      work_order_id: workOrder.id,
      content: values.content,
      is_internal: values.is_internal,
    });
    noteForm.resetFields();
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title={t('workOrderDetails.pageTitle')} />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div>
        <PageHeader title={t('workOrderDetails.notFoundTitle')} />
        <Card>{t('workOrderDetails.notFoundMessage')}</Card>
      </div>
    );
  }

  const availableTransitions = statusTransitions[workOrder.status] || [];

  const lineItemColumns: ColumnsType<WorkOrderLineItem> = [
    {
      title: t('workOrderDetails.lineItems.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag>{t(`workOrderDetails.lineItemTypes.${type}`, { defaultValue: type.charAt(0).toUpperCase() + type.slice(1) })}</Tag>,
    },
    {
      title: t('workOrderDetails.lineItems.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
    },
    {
      title: t('workOrderDetails.lineItems.description'),
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => desc || <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('workOrderDetails.lineItems.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: t('workOrderDetails.lineItems.unitPrice'),
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price: number) => formatCurrency(price),
    },
    {
      title: t('workOrderDetails.lineItems.taxRate'),
      dataIndex: 'tax_rate',
      key: 'tax_rate',
      render: (rate: number) => `${rate || 0}%`,
    },
    {
      title: t('workOrderDetails.lineItems.total'),
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => <span style={{ fontWeight: 500 }}>{formatCurrency(total)}</span>,
    },
    {
      title: t('workOrderDetails.actions'),
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <PermissionGuard permission="work-orders:update">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => {
              showConfirmDialog({
                title: t('workOrderDetails.dialogs.deleteLineItemTitle'),
                content: t('workOrderDetails.dialogs.deleteLineItemConfirm', { name: record.name }),
                onOk: async () => { await deleteLineItem.mutateAsync(record.id); },
                danger: true,
              });
            }}
          />
        </PermissionGuard>
      ),
    },
  ];

  const noteColumns: ColumnsType<WorkOrderNote> = [
    {
      title: t('workOrderDetails.notes.note'),
      dataIndex: 'content',
      key: 'content',
    },
    {
      title: t('workOrderDetails.notes.internal'),
      dataIndex: 'is_internal',
      key: 'is_internal',
      render: (internal: boolean) =>
        internal ? <Tag color="orange">{t('workOrderDetails.notes.internalLabel')}</Tag> : <Tag color="blue">{t('workOrderDetails.notes.externalLabel')}</Tag>,
    },
    {
      title: t('workOrderDetails.notes.created'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('workOrderDetails.actions'),
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <PermissionGuard permission="work-orders:update">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => {
              showConfirmDialog({
                title: t('workOrderDetails.dialogs.deleteNoteTitle'),
                content: t('workOrderDetails.dialogs.deleteNoteConfirm'),
                onOk: async () => { await deleteNote.mutateAsync(record.id); },
                danger: true,
              });
            }}
          />
        </PermissionGuard>
      ),
    },
  ];

  const attachmentColumns: ColumnsType<WorkOrderAttachment> = [
    {
      title: t('workOrderDetails.attachments.fileName'),
      dataIndex: 'file_name',
      key: 'file_name',
      render: (name: string, record) => (
        <a href={record.file_url} target="_blank" rel="noopener noreferrer">
          <PaperClipOutlined style={{ marginRight: 4 }} />
          {name}
        </a>
      ),
    },
    {
      title: t('workOrderDetails.attachments.type'),
      dataIndex: 'file_type',
      key: 'file_type',
      render: (type: string) => type || <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('workOrderDetails.attachments.size'),
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size: number | null) => {
        if (!size) return <span style={{ opacity: 0.5 }}>-</span>;
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
      },
    },
    {
      title: t('workOrderDetails.attachments.created'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('workOrderDetails.actions'),
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <PermissionGuard permission="work-orders:update">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => {
              showConfirmDialog({
                title: t('workOrderDetails.dialogs.deleteAttachmentTitle'),
                content: t('workOrderDetails.dialogs.deleteAttachmentConfirm', { name: record.file_name }),
                onOk: async () => { await deleteAttachment.mutateAsync(record.id); },
                danger: true,
              });
            }}
          />
        </PermissionGuard>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'details',
      label: t('workOrderDetails.tabs.details'),
      children: (
        <Card>
          <Descriptions column={2} bordered>
            <Descriptions.Item label={t('workOrderDetails.fields.woNumber')}>
              {workOrder.wo_number || <span style={{ opacity: 0.5 }}>-</span>}
            </Descriptions.Item>

            <Descriptions.Item label={t('workOrderDetails.fields.status')}>
              <Tag color={statusColors[workOrder.status] || 'default'}>
                {t(`workOrderDetails.statuses.${workOrder.status}`, { defaultValue: formatStatus(workOrder.status) })}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label={t('workOrderDetails.fields.summary')} span={2}>
              {workOrder.summary}
            </Descriptions.Item>

            <Descriptions.Item label={t('workOrderDetails.fields.priority')}>
              <Tag color={priorityColors[workOrder.priority] || 'default'}>
                {t(`workOrderDetails.priorities.${workOrder.priority}`, { defaultValue: workOrder.priority?.charAt(0).toUpperCase() + workOrder.priority?.slice(1) })}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label={t('workOrderDetails.fields.category')}>
              {workOrder.category ? <Tag>{workOrder.category}</Tag> : <span style={{ opacity: 0.5 }}>-</span>}
            </Descriptions.Item>

            <Descriptions.Item label={t('workOrderDetails.fields.customer')}>
              {workOrder.contact
                ? `${workOrder.contact.first_name} ${workOrder.contact.last_name}`
                : <span style={{ opacity: 0.5 }}>-</span>}
            </Descriptions.Item>

            <Descriptions.Item label={t('workOrderDetails.fields.location')}>
              {workOrder.location?.address || <span style={{ opacity: 0.5 }}>-</span>}
            </Descriptions.Item>

            <Descriptions.Item label={t('workOrderDetails.fields.asset')}>
              {workOrder.asset?.name || <span style={{ opacity: 0.5 }}>-</span>}
            </Descriptions.Item>

            <Descriptions.Item label={t('workOrderDetails.fields.assignedTo')}>
              {workOrder.assigned_to || <span style={{ opacity: 0.5 }}>-</span>}
            </Descriptions.Item>

            <Descriptions.Item label={t('workOrderDetails.fields.scheduledDate')}>
              {workOrder.scheduled_start ? formatDateTime(workOrder.scheduled_start) : <span style={{ opacity: 0.5 }}>-</span>}
            </Descriptions.Item>

            <Descriptions.Item label={t('workOrderDetails.fields.actualStart')}>
              {workOrder.actual_start ? formatDateTime(workOrder.actual_start) : <span style={{ opacity: 0.5 }}>-</span>}
            </Descriptions.Item>

            <Descriptions.Item label={t('workOrderDetails.fields.actualEnd')}>
              {workOrder.actual_end ? formatDateTime(workOrder.actual_end) : <span style={{ opacity: 0.5 }}>-</span>}
            </Descriptions.Item>

            <Descriptions.Item label={t('workOrderDetails.fields.description')} span={2}>
              {workOrder.description || <span style={{ opacity: 0.5 }}>-</span>}
            </Descriptions.Item>

            <Descriptions.Item label={t('workOrderDetails.fields.tags')} span={2}>
              {workOrder.tags && workOrder.tags.length > 0
                ? workOrder.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)
                : <span style={{ opacity: 0.5 }}>-</span>}
            </Descriptions.Item>

            <Descriptions.Item label={t('workOrderDetails.fields.recurring')}>
              {workOrder.is_recurring ? <Tag color="blue">{t('workOrderDetails.yes')}</Tag> : <Tag>{t('workOrderDetails.no')}</Tag>}
            </Descriptions.Item>

            <Descriptions.Item label={t('workOrderDetails.fields.recurrenceRule')}>
              {workOrder.recurrence_rule || <span style={{ opacity: 0.5 }}>-</span>}
            </Descriptions.Item>

            <Descriptions.Item label={t('workOrderDetails.fields.createdAt')}>
              {formatDateTime(workOrder.created_at)}
            </Descriptions.Item>
            <Descriptions.Item label={t('workOrderDetails.fields.updatedAt')}>
              {formatDateTime(workOrder.updated_at)}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'location',
      label: <span><EnvironmentOutlined style={{ marginRight: 4 }} />{t('workOrderDetails.tabs.location')}</span>,
      children: (() => {
        const lat = workOrder.location?.lat as number | undefined;
        const lng = workOrder.location?.lng as number | undefined;
        const address = workOrder.location?.address;
        if (!lat || !lng) {
          return (
            <Card>
              <p style={{ color: '#999', textAlign: 'center', padding: '32px 0' }}>
                {t('workOrderDetails.noGpsLocation')}
              </p>
            </Card>
          );
        }
        const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${Number(lng) - 0.01},${Number(lat) - 0.01},${Number(lng) + 0.01},${Number(lat) + 0.01}&layer=mapnik&marker=${lat},${lng}`;
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        return (
          <Card>
            {address && <p style={{ marginBottom: 8, fontWeight: 500, fontSize: 15 }}>{address}</p>}
            <p style={{ marginBottom: 12, color: '#666', fontSize: 13 }}>
              {t('workOrderDetails.gpsCoordinates', { lat: Number(lat).toFixed(6), lng: Number(lng).toFixed(6) })}
            </p>
            <iframe
              src={mapSrc}
              title={t('workOrderDetails.mapTitle')}
              style={{ width: '100%', height: 300, border: '1px solid #e8e8e8', borderRadius: 4, marginBottom: 16 }}
              loading="lazy"
            />
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <Button type="primary" icon={<EnvironmentOutlined />}>{t('workOrderDetails.getDirections')}</Button>
            </a>
          </Card>
        );
      })(),
    },
    {
      key: 'line-items',
      label: t('workOrderDetails.tabs.lineItems'),
      children: (
        <Card>
          <Table
            columns={lineItemColumns}
            dataSource={lineItems || []}
            rowKey="id"
            loading={lineItemsLoading}
            pagination={false}
            locale={{ emptyText: t('workOrderDetails.noLineItems') }}
          />
        </Card>
      ),
    },
    {
      key: 'notes',
      label: (
        <span>
          <FileTextOutlined style={{ marginRight: 4 }} />
          {t('workOrderDetails.tabs.notes')}
        </span>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Card title={t('workOrderDetails.addNoteTitle')}>
            <Form
              form={noteForm}
              onFinish={handleAddNote}
              layout="vertical"
              initialValues={{ is_internal: false }}
            >
              <Form.Item
                name="content"
                label={t('workOrderDetails.notes.note')}
                rules={[{ required: true, message: t('workOrderDetails.errors.enterNote') }]}
              >
                <TextArea rows={3} placeholder={t('workOrderDetails.placeholders.writeNote')} />
              </Form.Item>
              <Space>
                <Form.Item name="is_internal" valuePropName="checked" style={{ marginBottom: 0 }}>
                  <Switch checkedChildren={t('workOrderDetails.notes.internalLabel')} unCheckedChildren={t('workOrderDetails.notes.externalLabel')} />
                </Form.Item>
                <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={createNote.isPending}>
                  {t('workOrderDetails.buttons.addNote')}
                </Button>
              </Space>
            </Form>
          </Card>
          <Card>
            <Table
              columns={noteColumns}
              dataSource={notes || []}
              rowKey="id"
              loading={notesLoading}
              pagination={false}
              locale={{ emptyText: t('workOrderDetails.noNotes') }}
            />
          </Card>
        </Space>
      ),
    },
    {
      key: 'attachments',
      label: (
        <span>
          <PaperClipOutlined style={{ marginRight: 4 }} />
          {t('workOrderDetails.tabs.attachments')}
        </span>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Card title={t('workOrderDetails.uploadAttachmentTitle')}>
            <Space>
              <Upload
                fileList={fileList}
                beforeUpload={(file) => {
                  setFileList([file]);
                  return false;
                }}
                onRemove={() => setFileList([])}
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>{t('workOrderDetails.buttons.selectFile')}</Button>
              </Upload>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                loading={uploadAttachment.isPending}
                disabled={fileList.length === 0}
                onClick={async () => {
                  if (!workOrder || fileList.length === 0) return;
                  try {
                    await uploadAttachment.mutateAsync({
                      file: fileList[0] as unknown as File,
                      workOrderId: workOrder.id,
                    });
                    setFileList([]);
                  } catch {
                    // Error handled by mutation hook
                  }
                }}
              >
                {t('workOrderDetails.buttons.upload')}
              </Button>
            </Space>
          </Card>
          <Card>
            <Table
              columns={attachmentColumns}
              dataSource={attachments || []}
              rowKey="id"
              loading={attachmentsLoading}
              pagination={false}
              locale={{ emptyText: t('workOrderDetails.noAttachments') }}
            />
          </Card>
        </Space>
      ),
    },
    {
      key: 'estimates',
      label: (
        <span>
          <FileTextOutlined style={{ marginRight: 4 }} />
          {t('workOrderDetails.tabs.estimates')}
        </span>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Card
            extra={
              <Space>
                {['in_progress', 'scheduled'].includes(workOrder.status) && (
                  <PermissionGuard permission="estimates:create">
                    <Button
                      type="primary"
                      icon={<FileTextOutlined />}
                      onClick={() => navigate(`/estimates/new?work_order_id=${workOrder.id}&estimate_type=on_site`)}
                    >
                      Create On-Site Estimate
                    </Button>
                  </PermissionGuard>
                )}
                <PermissionGuard permission="estimates:create">
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => navigate(`/estimates/new?work_order_id=${workOrder.id}`)}
                  >
                    {t('workOrderDetails.buttons.createEstimate')}
                  </Button>
                </PermissionGuard>
              </Space>
            }
          >
            <Table
              columns={[
                {
                  title: t('workOrderDetails.estimates.estimateNum'),
                  dataIndex: 'estimate_number',
                  key: 'estimate_number',
                  render: (num: string, record: Estimate) => (
                    <Button type="link" size="small" onClick={() => navigate(`/estimates/${record.id}`)}>
                      {num || record.id.slice(0, 8)}
                    </Button>
                  ),
                },
                {
                  title: t('workOrderDetails.estimates.status'),
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) => {
                    const colors: Record<string, string> = {
                      draft: 'default',
                      pending_approval: 'orange',
                      sent: 'blue',
                      viewed: 'purple',
                      approved: 'green',
                      rejected: 'red',
                      expired: 'volcano',
                      converted_to_wo: 'cyan',
                      converted_to_invoice: 'geekblue',
                    };
                    return (
                      <Tag color={colors[status] || 'default'}>
                        {t(`workOrderDetails.estimateStatuses.${status}`, { defaultValue: status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) })}
                      </Tag>
                    );
                  },
                },
                {
                  title: t('workOrderDetails.estimates.total'),
                  dataIndex: 'total',
                  key: 'total',
                  render: (total: number) => formatCurrency(total),
                },
                {
                  title: t('workOrderDetails.estimates.created'),
                  dataIndex: 'created_at',
                  key: 'created_at',
                  render: (date: string) => formatDateTime(date),
                },
                {
                  title: t('workOrderDetails.actions'),
                  key: 'actions',
                  width: 240,
                  render: (_: unknown, record: Estimate) => (
                    <Space size="small">
                      {['draft', 'pending_approval'].includes(record.status) && (
                        <PermissionGuard permission="estimates:update">
                          <Button
                            size="small"
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            loading={adminApproveEstimate.isPending}
                            onClick={() => {
                              showConfirmDialog({
                                title: t('workOrderDetails.dialogs.approveEstimateTitle'),
                                content: t('workOrderDetails.dialogs.approveEstimateConfirm', { id: record.estimate_number || record.id.slice(0, 8) }),
                                onOk: async () => { await adminApproveEstimate.mutateAsync(record.id); },
                              });
                            }}
                          >
                            {t('workOrderDetails.buttons.approve')}
                          </Button>
                          <Button
                            size="small"
                            danger
                            icon={<CloseCircleOutlined />}
                            loading={adminRejectEstimate.isPending}
                            onClick={() => {
                              showConfirmDialog({
                                title: t('workOrderDetails.dialogs.rejectEstimateTitle'),
                                content: t('workOrderDetails.dialogs.rejectEstimateConfirm', { id: record.estimate_number || record.id.slice(0, 8) }),
                                onOk: async () => { await adminRejectEstimate.mutateAsync({ id: record.id }); },
                                danger: true,
                              });
                            }}
                          >
                            {t('workOrderDetails.buttons.reject')}
                          </Button>
                        </PermissionGuard>
                      )}
                      {record.status === 'approved' && (
                        <PermissionGuard permission="invoices:create">
                          <Button
                            size="small"
                            icon={<FileTextOutlined />}
                            loading={generateInvoiceFromEstimate.isPending}
                            onClick={async () => {
                              const res = await generateInvoiceFromEstimate.mutateAsync(record.id);
                              const inv = res.data.data;
                              if (inv?.id) navigate(`/invoices/${inv.id}`);
                            }}
                          >
                            {t('workOrderDetails.buttons.generateInvoice')}
                          </Button>
                        </PermissionGuard>
                      )}
                    </Space>
                  ),
                },
              ]}
              dataSource={woEstimates || []}
              rowKey="id"
              loading={woEstimatesLoading}
              pagination={false}
              locale={{ emptyText: t('workOrderDetails.noEstimates') }}
            />
          </Card>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('workOrderDetails.mainPageTitle', { num: workOrder.wo_number || '' })}
        onBack={() => navigate('/work-orders')}
        extra={
          <Space>
            <PermissionGuard permission="service_appointments:create">
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => setAssignModalOpen(true)}
              >
                {t('workOrderDetails.buttons.assignTechnician')}
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="work-orders:update">
              <Button icon={<EditOutlined />} onClick={() => navigate(`/work-orders/${workOrder.id}/edit`)}>
                {t('workOrderDetails.buttons.edit')}
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="work-orders:delete">
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                {t('workOrderDetails.buttons.delete')}
              </Button>
            </PermissionGuard>
          </Space>
        }
      />

      {availableTransitions.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <span style={{ fontWeight: 500 }}>{t('workOrderDetails.transitionTo')}</span>
            {availableTransitions.map((status) => (
              <Button
                key={status}
                type="primary"
                size="small"
                loading={updateStatus.isPending}
                onClick={() => handleStatusChange(status)}
              >
                {t(`workOrderDetails.statuses.${status}`, { defaultValue: formatStatus(status) })}
              </Button>
            ))}
          </Space>
        </Card>
      )}

      {currentUser && workOrder.assigned_to === currentUser.id && (
        <Card style={{ marginBottom: 16, borderColor: '#1677ff', background: '#f0f5ff' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space wrap>
              {['new', 'approved', 'estimated'].includes(workOrder.status) && (
                <>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    loading={acceptJob.isPending}
                    onClick={() => {
                      showConfirmDialog({
                        title: t('workOrderDetails.dialogs.acceptJobTitle'),
                        content: t('workOrderDetails.dialogs.acceptJobConfirm'),
                        onOk: async () => { await acceptJob.mutateAsync(workOrder.id); },
                      });
                    }}
                  >
                    {t('workOrderDetails.buttons.acceptJob')}
                  </Button>
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => setDeclineModalOpen(true)}
                  >
                    {t('workOrderDetails.buttons.declineJob')}
                  </Button>
                </>
              )}
              {workOrder.status === 'scheduled' && (
                <>
                  <Tag color="green" style={{ padding: '4px 8px', fontSize: 13 }}>
                    <CheckCircleOutlined style={{ marginRight: 4 }} />
                    {t('workOrderDetails.jobAccepted')}
                  </Tag>
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    loading={updateStatus.isPending}
                    onClick={() => handleStatusChange('in_progress')}
                  >
                    {t('workOrderDetails.buttons.startJob')}
                  </Button>
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => setDeclineModalOpen(true)}
                  >
                    {t('workOrderDetails.buttons.declineJob')}
                  </Button>
                </>
              )}
              {workOrder.status === 'in_progress' && (
                <Button
                  type="primary"
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                  icon={<CheckCircleOutlined />}
                  loading={updateStatus.isPending}
                  onClick={() => handleStatusChange('completed')}
                >
                  {t('workOrderDetails.buttons.completeJob')}
                </Button>
              )}
            </Space>

            {['scheduled', 'in_progress'].includes(workOrder.status) && (
              <Space wrap style={{ borderTop: '1px solid #d6e4ff', paddingTop: 12 }}>
                {workOrder.location?.lat && workOrder.location?.lng && (
                  <>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${workOrder.location.lat},${workOrder.location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button icon={<CarOutlined />}>{t('workOrderDetails.buttons.googleMaps')}</Button>
                    </a>
                    <a
                      href={`https://waze.com/ul?ll=${workOrder.location.lat},${workOrder.location.lng}&navigate=yes`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button icon={<CarOutlined />}>{t('workOrderDetails.buttons.waze')}</Button>
                    </a>
                  </>
                )}
                {workOrder.contact?.phone && (
                  <a href={`tel:${workOrder.contact.phone}`}>
                    <Button icon={<PhoneOutlined />}>{t('workOrderDetails.buttons.callCustomer')}</Button>
                  </a>
                )}
                <Button
                  type={isTripActive ? 'default' : 'primary'}
                  danger={isTripActive}
                  icon={<EnvironmentOutlined />}
                  onClick={isTripActive ? stopTrip : startTrip}
                >
                  {isTripActive ? t('workOrderDetails.buttons.stopTrip') : t('workOrderDetails.buttons.startTrip')}
                </Button>
              </Space>
            )}
          </Space>
        </Card>
      )}

      {slaTimer && (
        <div style={{ marginBottom: 16 }}>
          <SlaTimerBadge timer={slaTimer} />
        </div>
      )}

      {feedbackData && feedbackData.length > 0 && (
        <Card style={{ marginBottom: 16 }} title={t('workOrderDetails.feedback.title')}>
          {feedbackData.map((fb: any) => (
            <Alert
              key={fb.id}
              message={
                <Space>
                  <span>{t('workOrderDetails.feedback.ratingLabel')}</span>
                  <Rate disabled defaultValue={Number(fb.rating)} allowHalf />
                  {fb.is_customer_facing && <Tag color="blue">{t('workOrderDetails.feedback.sharedWithCustomer')}</Tag>}
                </Space>
              }
              description={fb.comments || t('workOrderDetails.feedback.noComments')}
              type="info"
              style={{ marginBottom: 8 }}
            />
          ))}
        </Card>
      )}

      {workOrder.status === 'completed' && (!feedbackData || feedbackData.length === 0) && (
        <Card style={{ marginBottom: 16, backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
          <Space>
            <span>{t('workOrderDetails.feedback.successBanner')}</span>
            <Button type="primary" onClick={() => setIsFeedbackModalOpen(true)}>
              {t('workOrderDetails.buttons.submitFeedback')}
            </Button>
          </Space>
        </Card>
      )}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      <Modal
        title={t('workOrderDetails.assignModal.title')}
        open={assignModalOpen}
        onCancel={() => { setAssignModalOpen(false); assignForm.resetFields(); }}
        onOk={() => assignForm.submit()}
        okText={t('workOrderDetails.buttons.assign')}
        confirmLoading={createAppointment.isPending}
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssignTechnician}>
          <Form.Item name="agent_ids" label={t('workOrderDetails.assignModal.fields.technicians')} rules={[{ required: true, message: t('workOrderDetails.errors.selectTechnician') }]}>
            <Select
              mode="multiple"
              showSearch
              placeholder={t('workOrderDetails.placeholders.selectTechnicians')}
              optionFilterProp="label"
              options={(usersData?.data || []).map((u: any) => ({
                value: u.id,
                label: `${u.first_name} ${u.last_name} (${u.email})`,
              }))}
            />
          </Form.Item>
          <Form.Item name="scheduled_start" label={t('workOrderDetails.assignModal.fields.scheduledStart')} rules={[{ required: true, message: t('workOrderDetails.errors.required') }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="scheduled_end" label={t('workOrderDetails.assignModal.fields.scheduledEnd')} rules={[{ required: true, message: t('workOrderDetails.errors.required') }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <TechnicianFeedbackModal
        workOrderId={workOrder.id}
        open={isFeedbackModalOpen}
        onCancel={() => setIsFeedbackModalOpen(false)}
        onSuccess={() => setIsFeedbackModalOpen(false)}
      />

      <Modal
        title={t('workOrderDetails.declineModal.title')}
        open={declineModalOpen}
        onCancel={() => { setDeclineModalOpen(false); declineForm.resetFields(); }}
        onOk={() => declineForm.submit()}
        okText={t('workOrderDetails.buttons.decline')}
        okButtonProps={{ danger: true, loading: declineJob.isPending }}
      >
        <Form
          form={declineForm}
          layout="vertical"
          onFinish={async (values: { reason: string }) => {
            await declineJob.mutateAsync({ id: workOrder.id, reason: values.reason });
            setDeclineModalOpen(false);
            declineForm.resetFields();
          }}
        >
          <Form.Item
            name="reason"
            label={t('workOrderDetails.declineModal.fields.reason')}
            rules={[{ required: true, message: t('workOrderDetails.errors.provideReason') }, { min: 5, message: t('workOrderDetails.errors.minReasonLength') }]}
          >
            <Input.TextArea rows={4} placeholder={t('workOrderDetails.placeholders.enterReason')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}