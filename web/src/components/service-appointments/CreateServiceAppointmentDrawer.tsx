import { useState, useEffect, useMemo } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Radio,
  DatePicker,
  Button,
  Space,
  Tag,
  Typography,
  Divider,
  Empty,
} from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useAllWorkOrders } from '@/hooks/use-work-orders';
import { useAllServicesCatalog } from '@/hooks/use-services-catalog';
import { useAgents } from '@/hooks/use-users';
import { useServiceRequest } from '@/hooks/use-service-requests';
import { useScheduleAppointment } from '@/hooks/use-appointments';
import type { WorkOrder } from '@/types/models.types';
import { formatDurationHm } from '@/utils/appointment';

const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const priorityColors: Record<string, string> = {
  urgent: 'red',
  high: 'orange',
  medium: 'blue',
  low: 'default',
};

const woStatusColors: Record<string, string> = {
  new: 'blue',
  estimated: 'gold',
  approved: 'green',
  scheduled: 'cyan',
  in_progress: 'processing',
  on_hold: 'orange',
};

const TYPE_OPTIONS = ['Service', 'Installation', 'Maintenance', 'Inspection'].map((v) => ({ value: v, label: v }));

export default function CreateServiceAppointmentDrawer({ open, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [selectedWoId, setSelectedWoId] = useState<string | null>(null);
  const [scheduleType, setScheduleType] = useState<'time_bound' | 'all_day'>('time_bound');
  const [start, setStart] = useState<dayjs.Dayjs | null>(null);
  const [end, setEnd] = useState<dayjs.Dayjs | null>(null);

  const { data: workOrders = [], isLoading: woLoading } = useAllWorkOrders();
  const { data: services = [] } = useAllServicesCatalog();
  const { data: agents = [] } = useAgents();
  const schedule = useScheduleAppointment();

  // Exclude completed and cancelled work orders.
  const selectableWorkOrders = useMemo(
    () => (workOrders || []).filter((wo) => wo.status !== 'completed' && wo.status !== 'cancelled'),
    [workOrders],
  );

  const selectedWo: WorkOrder | undefined = useMemo(
    () => selectableWorkOrders.find((wo) => wo.id === selectedWoId),
    [selectableWorkOrders, selectedWoId],
  );

  // Pull preferred date/time from the linked service request (read-only display).
  const { data: linkedRequest } = useServiceRequest(selectedWo?.request_id || '');
  const preferred = (linkedRequest?.custom_fields as Record<string, unknown> | undefined) || {};

  useEffect(() => {
    if (open) {
      form.resetFields();
      setSelectedWoId(null);
      setScheduleType('time_bound');
      setStart(null);
      setEnd(null);
    }
  }, [open, form]);

  // Auto-fill form fields when a work order is chosen.
  useEffect(() => {
    if (!selectedWo) return;
    const woDueDate = (selectedWo.custom_fields as Record<string, unknown>)?.due_date as string | undefined;
    form.setFieldsValue({
      summary: selectedWo.summary,
      type: 'Service',
      schedule_type: 'time_bound',
      due_date: woDueDate ? dayjs(woDueDate) : undefined,
    });
  }, [selectedWo, form]);

  const scheduledDurationSeconds = useMemo(() => {
    if (!start || !end) return null;
    const diff = end.diff(start, 'second');
    return diff > 0 ? diff : null;
  }, [start, end]);

  const buildPayload = (status: string) => {
    const values = form.getFieldsValue();
    return {
      work_order_id: selectedWoId!,
      agent_id: values.service_resource_id || undefined,
      summary: values.summary || undefined,
      type: values.type || 'Service',
      schedule_type: scheduleType,
      status,
      scheduled_start: (start || dayjs()).toISOString(),
      scheduled_end: (end || start || dayjs()).toISOString(),
      due_date: values.due_date ? dayjs(values.due_date).format('YYYY-MM-DD') : undefined,
      custom_fields: values.service_id
        ? {
            service_id: values.service_id,
            service_name: services.find((s) => s.id === values.service_id)?.name,
          }
        : undefined,
    };
  };

  const handleSubmit = async (dispatch: boolean) => {
    try {
      await form.validateFields();
    } catch {
      return;
    }
    if (!start || !end) {
      form.setFields([{ name: 'scheduled_start', errors: ['Scheduled start and end are required'] }]);
      return;
    }
    try {
      const appointment = await schedule.mutateAsync(buildPayload('scheduled'));
      onSuccess?.();
      onClose();
      if (dispatch && appointment?.id) {
        navigate(`/scheduling?appointment=${appointment.id}`);
      }
    } catch {
      // toast handled by hook
    }
  };

  const footer = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
      <Button onClick={onClose}>Cancel</Button>
      <Button
        type="default"
        disabled={!selectedWoId}
        loading={schedule.isPending}
        onClick={() => handleSubmit(false)}
      >
        Schedule
      </Button>
      <Button
        type="primary"
        disabled={!selectedWoId}
        loading={schedule.isPending}
        onClick={() => handleSubmit(true)}
      >
        Schedule And Dispatch
      </Button>
    </div>
  );

  return (
    <Drawer
      title="Create Service Appointment"
      open={open}
      onClose={onClose}
      width={520}
      footer={footer}
      destroyOnClose
    >
      {/* Step 1 — Work Order selection */}
      <Form.Item label={<Text strong>Choose Work Order</Text>} style={{ marginBottom: 4 }}>
        <Select
          showSearch
          allowClear
          loading={woLoading}
          placeholder="Search work orders by name or number"
          value={selectedWoId || undefined}
          onChange={(v) => setSelectedWoId(v || null)}
          optionFilterProp="searchlabel"
          notFoundContent={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No work orders" />}
          style={{ width: '100%' }}
          options={selectableWorkOrders.map((wo) => ({
            value: wo.id,
            searchlabel: `${wo.wo_number || ''} ${wo.summary || ''} ${wo.contact?.first_name || ''} ${wo.contact?.last_name || ''}`,
            label: (
              <div style={{ display: 'flex', flexDirection: 'column', padding: '2px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600 }}>{wo.wo_number || '—'}</span>
                  <span style={{ color: '#555' }}>· {wo.summary}</span>
                  <Tag color={woStatusColors[wo.status] || 'default'} style={{ marginInlineEnd: 0 }}>
                    {wo.status}
                  </Tag>
                  <Tag color={priorityColors[wo.priority] || 'default'} style={{ marginInlineEnd: 0 }}>
                    {wo.priority}
                  </Tag>
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>
                  {wo.contact ? `${wo.contact.first_name} ${wo.contact.last_name || ''}` : 'No contact'}
                  {wo.contact?.company ? ` · ${wo.contact.company.name}` : ''}
                </div>
              </div>
            ),
          }))}
        />
      </Form.Item>
      <Text type="secondary" style={{ fontSize: 12 }}>
        Completed and cancelled work orders are excluded
      </Text>

      {/* Step 2 — Appointment form */}
      {selectedWoId && (
        <>
          <Divider />
          <Form form={form} layout="vertical" autoComplete="off">
            <Form.Item name="service_id" label="Service">
              <Select
                showSearch
                allowClear
                optionFilterProp="label"
                placeholder="Select a service"
                options={services.map((s) => ({ value: s.id, label: s.name }))}
              />
            </Form.Item>

            <Form.Item name="summary" label="Summary" rules={[{ required: true, message: 'Summary is required' }]}>
              <Input placeholder="Appointment summary" />
            </Form.Item>

            <Form.Item name="type" label="Type" initialValue="Service">
              <Select options={TYPE_OPTIONS} />
            </Form.Item>

            <Form.Item name="schedule_type" label="Schedule Type" initialValue="time_bound">
              <Radio.Group
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="time_bound">Time-bound</Radio.Button>
                <Radio.Button value="all_day">All Day</Radio.Button>
              </Radio.Group>
            </Form.Item>

            {selectedWo?.request_id && (
              <div
                style={{
                  background: '#fafafa',
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <Text strong style={{ fontSize: 13 }}>
                  From Service Request
                </Text>
                <div style={{ display: 'flex', gap: 24, marginTop: 8, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#999' }}>Preferred Date 1</div>
                    <div>{(preferred.preferred_date_1 as string) || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#999' }}>Preferred Date 2</div>
                    <div>{(preferred.preferred_date_2 as string) || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#999' }}>Preferred Time</div>
                    <div>{(preferred.preferred_time as string) || '—'}</div>
                  </div>
                </div>
              </div>
            )}

            <Form.Item label="Scheduled Start Time" name="scheduled_start" required>
              <DatePicker
                showTime={scheduleType === 'time_bound'}
                format={scheduleType === 'time_bound' ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'}
                style={{ width: '100%' }}
                value={start}
                onChange={(d) => setStart(d)}
              />
            </Form.Item>

            <Form.Item label="Scheduled End Time" required>
              <DatePicker
                showTime={scheduleType === 'time_bound'}
                format={scheduleType === 'time_bound' ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'}
                style={{ width: '100%' }}
                value={end}
                onChange={(d) => setEnd(d)}
              />
            </Form.Item>

            <Form.Item label="Scheduled Duration">
              <Input readOnly value={formatDurationHm(scheduledDurationSeconds)} />
            </Form.Item>

            <Form.Item name="due_date" label="Due Date">
              <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="service_resource_id" label="Service Resource">
              <Select
                showSearch
                allowClear
                optionFilterProp="label"
                placeholder="Assign a technician"
                options={(agents || [])
                  .filter((a) => a.is_active !== false)
                  .map((a) => ({
                    value: a.id,
                    label: `${a.first_name} ${a.last_name || ''}`.trim() || a.email,
                  }))}
              />
            </Form.Item>
          </Form>
        </>
      )}
    </Drawer>
  );
}
