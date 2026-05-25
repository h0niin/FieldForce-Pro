import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Skeleton, Tag, Table, Tabs, Form, Input, Switch, Upload, Modal, Select, DatePicker, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import { EditOutlined, DeleteOutlined, PlusOutlined, PaperClipOutlined, FileTextOutlined, UploadOutlined, UserAddOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useWorkOrder, useDeleteWorkOrder, useUpdateWorkOrderStatus } from '@/hooks/use-work-orders';
import { useWorkOrderLineItems, useDeleteWorkOrderLineItem } from '@/hooks/use-work-order-line-items';
import { useWorkOrderNotes, useCreateWorkOrderNote, useDeleteWorkOrderNote } from '@/hooks/use-work-order-notes';
import { useWorkOrderAttachments, useUploadWorkOrderAttachment, useDeleteWorkOrderAttachment } from '@/hooks/use-work-order-attachments';
import { useCreateAppointment } from '@/hooks/use-appointments';
import { useUsers } from '@/hooks/use-users';
import type { WorkOrderLineItem, WorkOrderNote, WorkOrderAttachment } from '@/types/models.types';
import { useSlaTimers } from '@/hooks/use-sla-timers';
import { SlaTimerBadge } from '@/components/work-orders/SlaTimerBadge';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';
import { formatCurrency } from '@/utils/format-currency';

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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [noteForm] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('details');
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const { data: workOrder, isLoading } = useWorkOrder(id!);
  const { data: slaTimers } = useSlaTimers(id!);
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
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleAssignTechnician = async (values: { agent_id: string; scheduled_start: dayjs.Dayjs; scheduled_end: dayjs.Dayjs }) => {
    if (!workOrder) return;
    try {
      await createAppointment.mutateAsync({
        work_order_id: workOrder.id,
        agent_id: values.agent_id,
        scheduled_start: values.scheduled_start.toISOString(),
        scheduled_end: values.scheduled_end.toISOString(),
      });
      message.success('Technician assigned successfully!');
      setAssignModalOpen(false);
      assignForm.resetFields();
    } catch {
      message.error('Failed to assign technician');
    }
  };

  const handleDelete = () => {
    if (!workOrder) return;
    showConfirmDialog({
      title: 'Delete Work Order',
      content: `Are you sure you want to delete work order ${workOrder.wo_number || workOrder.id}?`,
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
        <PageHeader title="Work Order Details" />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div>
        <PageHeader title="Work Order Not Found" />
        <Card>Work order not found</Card>
      </div>
    );
  }

  const availableTransitions = statusTransitions[workOrder.status] || [];

  const lineItemColumns: ColumnsType<WorkOrderLineItem> = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag>{type.charAt(0).toUpperCase() + type.slice(1)}</Tag>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => desc || <span style={{ color: '#999' }}>-</span>,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Unit Price',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price: number) => formatCurrency(price),
    },
    {
      title: 'Tax Rate',
      dataIndex: 'tax_rate',
      key: 'tax_rate',
      render: (rate: number) => `${rate || 0}%`,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => <span style={{ fontWeight: 500 }}>{formatCurrency(total)}</span>,
    },
    {
      title: 'Actions',
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
                title: 'Delete Line Item',
                content: `Are you sure you want to delete "${record.name}"?`,
                onOk: () => deleteLineItem.mutateAsync(record.id),
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
      title: 'Note',
      dataIndex: 'content',
      key: 'content',
    },
    {
      title: 'Internal',
      dataIndex: 'is_internal',
      key: 'is_internal',
      render: (internal: boolean) =>
        internal ? <Tag color="orange">Internal</Tag> : <Tag color="blue">External</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: 'Actions',
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
                title: 'Delete Note',
                content: 'Are you sure you want to delete this note?',
                onOk: () => deleteNote.mutateAsync(record.id),
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
      title: 'File Name',
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
      title: 'Type',
      dataIndex: 'file_type',
      key: 'file_type',
      render: (type: string) => type || <span style={{ color: '#999' }}>-</span>,
    },
    {
      title: 'Size',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size: number | null) => {
        if (!size) return <span style={{ color: '#999' }}>-</span>;
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
      },
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: 'Actions',
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
                title: 'Delete Attachment',
                content: `Are you sure you want to delete "${record.file_name}"?`,
                onOk: () => deleteAttachment.mutateAsync(record.id),
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
      label: 'Details',
      children: (
        <Card>
          <Descriptions column={2} bordered>
            <Descriptions.Item label="WO Number">
              {workOrder.wo_number || <span style={{ color: '#999' }}>-</span>}
            </Descriptions.Item>

            <Descriptions.Item label="Status">
              <Tag color={statusColors[workOrder.status] || 'default'}>
                {formatStatus(workOrder.status)}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Summary" span={2}>
              {workOrder.summary}
            </Descriptions.Item>

            <Descriptions.Item label="Priority">
              <Tag color={priorityColors[workOrder.priority] || 'default'}>
                {workOrder.priority?.charAt(0).toUpperCase() + workOrder.priority?.slice(1)}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Category">
              {workOrder.category ? <Tag>{workOrder.category}</Tag> : <span style={{ color: '#999' }}>-</span>}
            </Descriptions.Item>

            <Descriptions.Item label="Customer">
              {workOrder.contact
                ? `${workOrder.contact.first_name} ${workOrder.contact.last_name}`
                : <span style={{ color: '#999' }}>-</span>}
            </Descriptions.Item>

            <Descriptions.Item label="Location">
              {workOrder.location?.address || <span style={{ color: '#999' }}>-</span>}
            </Descriptions.Item>

            <Descriptions.Item label="Asset">
              {workOrder.asset?.name || <span style={{ color: '#999' }}>-</span>}
            </Descriptions.Item>

            <Descriptions.Item label="Assigned To">
              {workOrder.assigned_to || <span style={{ color: '#999' }}>-</span>}
            </Descriptions.Item>

            <Descriptions.Item label="Scheduled Date">
              {workOrder.scheduled_start ? formatDateTime(workOrder.scheduled_start) : <span style={{ color: '#999' }}>-</span>}
            </Descriptions.Item>

            <Descriptions.Item label="Actual Start">
              {workOrder.actual_start ? formatDateTime(workOrder.actual_start) : <span style={{ color: '#999' }}>-</span>}
            </Descriptions.Item>

            <Descriptions.Item label="Actual End">
              {workOrder.actual_end ? formatDateTime(workOrder.actual_end) : <span style={{ color: '#999' }}>-</span>}
            </Descriptions.Item>

            <Descriptions.Item label="Description" span={2}>
              {workOrder.description || <span style={{ color: '#999' }}>-</span>}
            </Descriptions.Item>

            <Descriptions.Item label="Tags" span={2}>
              {workOrder.tags && workOrder.tags.length > 0
                ? workOrder.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)
                : <span style={{ color: '#999' }}>-</span>}
            </Descriptions.Item>

            <Descriptions.Item label="Recurring">
              {workOrder.is_recurring ? <Tag color="blue">Yes</Tag> : <Tag>No</Tag>}
            </Descriptions.Item>

            <Descriptions.Item label="Recurrence Rule">
              {workOrder.recurrence_rule || <span style={{ color: '#999' }}>-</span>}
            </Descriptions.Item>

            <Descriptions.Item label="Created At">
              {formatDateTime(workOrder.created_at)}
            </Descriptions.Item>
            <Descriptions.Item label="Updated At">
              {formatDateTime(workOrder.updated_at)}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'line-items',
      label: 'Line Items',
      children: (
        <Card>
          <Table
            columns={lineItemColumns}
            dataSource={lineItems || []}
            rowKey="id"
            loading={lineItemsLoading}
            pagination={false}
            locale={{ emptyText: 'No line items added' }}
          />
        </Card>
      ),
    },
    {
      key: 'notes',
      label: (
        <span>
          <FileTextOutlined style={{ marginRight: 4 }} />
          Notes
        </span>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Card title="Add Note">
            <Form
              form={noteForm}
              onFinish={handleAddNote}
              layout="vertical"
              initialValues={{ is_internal: false }}
            >
              <Form.Item
                name="content"
                label="Note"
                rules={[{ required: true, message: 'Please enter a note' }]}
              >
                <TextArea rows={3} placeholder="Write a note..." />
              </Form.Item>
              <Space>
                <Form.Item name="is_internal" valuePropName="checked" style={{ marginBottom: 0 }}>
                  <Switch checkedChildren="Internal" unCheckedChildren="External" />
                </Form.Item>
                <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={createNote.isPending}>
                  Add Note
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
              locale={{ emptyText: 'No notes added' }}
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
          Attachments
        </span>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Card title="Upload Attachment">
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
                <Button icon={<UploadOutlined />}>Select File</Button>
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
                Upload
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
              locale={{ emptyText: 'No attachments added' }}
            />
          </Card>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Work Order ${workOrder.wo_number || ''}`}
        onBack={() => navigate('/work-orders')}
        extra={
          <Space>
            <PermissionGuard permission="service_appointments:create">
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => setAssignModalOpen(true)}
              >
                Assign Technician
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="work-orders:update">
              <Button icon={<EditOutlined />} onClick={() => navigate(`/work-orders/${workOrder.id}/edit`)}>
                Edit
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="work-orders:delete">
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                Delete
              </Button>
            </PermissionGuard>
          </Space>
        }
      />

      {availableTransitions.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <span style={{ fontWeight: 500 }}>Transition to:</span>
            {availableTransitions.map((status) => (
              <Button
                key={status}
                type="primary"
                size="small"
                loading={updateStatus.isPending}
                onClick={() => handleStatusChange(status)}
              >
                {formatStatus(status)}
              </Button>
            ))}
          </Space>
        </Card>
      )}

      {slaTimers && (
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {slaTimers.acceptance && (
            <SlaTimerBadge timer={slaTimers.acceptance} label="Acceptance SLA" compact={slaTimers.acceptance.status.startsWith('completed')} />
          )}
          {slaTimers.travel && (
            <SlaTimerBadge timer={slaTimers.travel} label="Travel SLA" compact={slaTimers.travel.status.startsWith('completed')} />
          )}
          {slaTimers.on_site_prep && (
            <SlaTimerBadge timer={slaTimers.on_site_prep} label="On-Site Prep SLA" compact={slaTimers.on_site_prep.status.startsWith('completed')} />
          )}
          {slaTimers.work_completion && (
            <SlaTimerBadge timer={slaTimers.work_completion} label="Work Completion SLA" />
          )}
          {slaTimers.total_resolution && (
            <SlaTimerBadge timer={slaTimers.total_resolution} label="Total Resolution SLA" compact={!!slaTimers.work_completion} />
          )}
        </div>
      )}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      <Modal
        title="Assign Technician"
        open={assignModalOpen}
        onCancel={() => { setAssignModalOpen(false); assignForm.resetFields(); }}
        onOk={() => assignForm.submit()}
        okText="Assign"
        confirmLoading={createAppointment.isPending}
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssignTechnician}>
          <Form.Item name="agent_id" label="Technician" rules={[{ required: true, message: 'Please select a technician' }]}>
            <Select
              showSearch
              placeholder="Select a technician"
              optionFilterProp="label"
              options={(usersData?.data || []).map((u: any) => ({
                value: u.id,
                label: `${u.first_name} ${u.last_name} (${u.email})`,
              }))}
            />
          </Form.Item>
          <Form.Item name="scheduled_start" label="Scheduled Start" rules={[{ required: true, message: 'Required' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="scheduled_end" label="Scheduled End" rules={[{ required: true, message: 'Required' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
}
