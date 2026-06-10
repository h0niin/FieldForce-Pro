import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Breadcrumb,
  Tag,
  Button,
  Tabs,
  Card,
  Descriptions,
  Table,
  Timeline,
  Input,
  Empty,
  Spin,
  Space,
  Avatar,
  Typography,
  DatePicker,
  InputNumber,
  Form,
  Popconfirm,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  CarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import {
  useAppointment,
  useUpdateAppointmentStatus,
  useDeleteAppointment,
  useAddAppointmentTrip,
  useUpdateAppointmentTrip,
  useDeleteAppointmentTrip,
  useAddAppointmentNote,
} from '@/hooks/use-appointments';
import { useWorkOrderLineItems } from '@/hooks/use-work-order-line-items';
import { formatDate, formatDateTime } from '@/utils/format-date';
import {
  appointmentStatusColors,
  billingStatusColors,
  formatStatusLabel,
  formatBillingStatus,
  formatDurationHms,
  appointmentStatusTransitions,
} from '@/utils/appointment';
import type { ServiceAppointmentTrip } from '@/types/models.types';

const { TextArea } = Input;
const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const STATUS_ACTION_LABELS: Record<string, string> = {
  scheduled: 'Mark Scheduled',
  en_route: 'Mark En Route',
  on_site: 'Mark On Site',
  in_progress: 'Start',
  on_hold: 'Put On Hold',
  completed: 'Complete',
  cancelled: 'Cancel',
};

function rupees(value?: number | null): string {
  if (value == null) return '₹0.00';
  return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ServiceAppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: appointment, isLoading } = useAppointment(id!);
  const updateStatus = useUpdateAppointmentStatus();
  const deleteAppointment = useDeleteAppointment();
  const addTrip = useAddAppointmentTrip(id!);
  const updateTrip = useUpdateAppointmentTrip(id!);
  const deleteTrip = useDeleteAppointmentTrip(id!);
  const addNote = useAddAppointmentNote(id!);
  const { data: lineItems = [] } = useWorkOrderLineItems(appointment?.work_order_id || '');

  const [newNote, setNewNote] = useState('');
  const [tripFormOpen, setTripFormOpen] = useState(false);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [tripForm] = Form.useForm();

  const activity = useMemo(() => {
    const items = appointment?.activity || [];
    return [...items].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [appointment]);

  const groupedActivity = useMemo(() => {
    const groups: Record<string, typeof activity> = {};
    activity.forEach((a) => {
      const key = formatDate(a.at);
      (groups[key] = groups[key] || []).push(a);
    });
    return groups;
  }, [activity]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!appointment) {
    return <Empty description="Service appointment not found" style={{ marginTop: 80 }} />;
  }

  const services = lineItems.filter((li) => li.type === 'service');
  const parts = lineItems.filter((li) => li.type === 'part');
  const servicesSubtotal = services.reduce((sum, li) => sum + Number(li.total || 0), 0);
  const customFields = (appointment.custom_fields as Record<string, unknown>) || {};
  const serviceName = (customFields.service_name as string) || '-';

  const validTransitions = appointmentStatusTransitions[appointment.status] || [];

  const handleStatus = (status: string) => {
    updateStatus.mutate({ id: appointment.id, status });
  };

  const handleDelete = () => {
    showConfirmDialog({
      title: 'Delete Service Appointment',
      content: `Delete appointment ${appointment.appointment_number || ''}? This cannot be undone.`,
      danger: true,
      onOk: async () => {
        await deleteAppointment.mutateAsync(appointment.id);
        navigate('/service-appointments');
      },
    });
  };

  const openAddTrip = () => {
    setEditingTripId(null);
    tripForm.resetFields();
    setTripFormOpen(true);
  };

  const openEditTrip = (trip: ServiceAppointmentTrip) => {
    setEditingTripId(trip.id);
    tripForm.setFieldsValue({
      trip_date: trip.trip_date ? dayjs(trip.trip_date) : null,
      start_location: trip.start_location,
      end_location: trip.end_location,
      window: [
        trip.departure_time ? dayjs(trip.departure_time) : null,
        trip.arrival_time ? dayjs(trip.arrival_time) : null,
      ],
      distance_km: trip.distance_km,
      notes: trip.notes,
    });
    setTripFormOpen(true);
  };

  const submitTrip = async () => {
    const values = await tripForm.validateFields();
    const payload = {
      trip_date: dayjs(values.trip_date).format('YYYY-MM-DD'),
      start_location: values.start_location,
      end_location: values.end_location,
      departure_time: values.window?.[0] ? dayjs(values.window[0]).toISOString() : undefined,
      arrival_time: values.window?.[1] ? dayjs(values.window[1]).toISOString() : undefined,
      distance_km: values.distance_km ?? undefined,
      notes: values.notes || undefined,
    };
    if (editingTripId) {
      await updateTrip.mutateAsync({ tripId: editingTripId, ...payload });
    } else {
      await addTrip.mutateAsync(payload);
    }
    setTripFormOpen(false);
    setEditingTripId(null);
    tripForm.resetFields();
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    await addNote.mutateAsync(newNote.trim());
    setNewNote('');
  };

  const agentName = appointment.agent
    ? `${appointment.agent.first_name} ${appointment.agent.last_name || ''}`.trim()
    : null;

  const tripColumns = [
    { title: 'Date', dataIndex: 'trip_date', key: 'trip_date', render: (d: string) => formatDate(d) },
    { title: 'From', dataIndex: 'start_location', key: 'start_location' },
    { title: 'To', dataIndex: 'end_location', key: 'end_location' },
    {
      title: 'Departure',
      dataIndex: 'departure_time',
      key: 'departure_time',
      render: (d: string) => (d ? formatDateTime(d) : '-'),
    },
    {
      title: 'Arrival',
      dataIndex: 'arrival_time',
      key: 'arrival_time',
      render: (d: string) => (d ? formatDateTime(d) : '-'),
    },
    {
      title: 'Distance',
      dataIndex: 'distance_km',
      key: 'distance_km',
      render: (d: number) => (d != null ? `${d} km` : '-'),
    },
    { title: 'Notes', dataIndex: 'notes', key: 'notes', render: (n: string) => n || '-' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, trip: ServiceAppointmentTrip) => (
        <Space size="small">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditTrip(trip)} />
          <Popconfirm title="Delete this trip?" onConfirm={() => deleteTrip.mutate(trip.id)}>
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const lineItemColumns = (kind: 'service' | 'part') => [
    { title: `${kind === 'service' ? 'Service' : 'Part'} Line Item Name`, dataIndex: 'name', key: 'name' },
    { title: kind === 'service' ? 'Service' : 'Part', dataIndex: 'name', key: 'name2', render: (n: string) => n },
    {
      title: 'Status',
      key: 'status',
      render: () => <Tag color={appointmentStatusColors[appointment.status]}>{formatStatusLabel(appointment.status)}</Tag>,
    },
    {
      title: 'Billing Status',
      key: 'billing',
      render: () => <Tag color={billingStatusColors[appointment.billing_status || 'not_invoiced']}>{formatBillingStatus(appointment.billing_status)}</Tag>,
    },
    {
      title: 'Quantity | Unit',
      key: 'qty',
      render: (_: unknown, li: { quantity: number }) => `${li.quantity} | -`,
    },
    { title: 'List Price (₹)', dataIndex: 'unit_price', key: 'unit_price', render: (v: number) => rupees(v) },
    { title: 'Line Item Amount (₹)', dataIndex: 'total', key: 'total', render: (v: number) => rupees(v) },
  ];

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 12 }}
        items={[
          { title: <Link to="/service-appointments">Service Appointments</Link> },
          {
            title: appointment.work_order ? (
              <Link to={`/work-orders/${appointment.work_order_id}`}>
                {appointment.work_order.wo_number || 'Work Order'}
              </Link>
            ) : (
              'Work Order'
            ),
          },
          { title: appointment.appointment_number || 'Appointment' },
        ]}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            {appointment.summary || appointment.appointment_number}
          </Title>
          <Space size={8} wrap style={{ marginTop: 8 }}>
            <Tag color={appointmentStatusColors[appointment.status] || 'default'}>{formatStatusLabel(appointment.status)}</Tag>
            {appointment.type && <Tag>{appointment.type}</Tag>}
            <Tag color={billingStatusColors[appointment.billing_status || 'not_invoiced']}>
              {formatBillingStatus(appointment.billing_status)}
            </Tag>
            <Tag icon={<ClockCircleOutlined />} color="blue">
              {formatDurationHms(appointment.scheduled_duration)}
            </Tag>
          </Space>
        </div>
        <Space>
          <PermissionGuard permission="service_appointments:update">
            <Button icon={<EditOutlined />} onClick={() => navigate(`/scheduling/${appointment.id}/edit`)}>
              Edit
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="service_appointments:delete">
            <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
              Delete
            </Button>
          </PermissionGuard>
        </Space>
      </div>

      {/* Contextual status transitions */}
      {validTransitions.length > 0 && (
        <Space style={{ marginTop: 12, marginBottom: 4 }} wrap>
          {validTransitions.map((next) => (
            <Button
              key={next}
              type={next === 'cancelled' ? 'default' : 'primary'}
              danger={next === 'cancelled'}
              loading={updateStatus.isPending}
              icon={next === 'completed' ? <CheckCircleOutlined /> : next === 'in_progress' ? <SyncOutlined /> : undefined}
              onClick={() => handleStatus(next)}
            >
              {STATUS_ACTION_LABELS[next] || formatStatusLabel(next)}
            </Button>
          ))}
        </Space>
      )}

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginTop: 16 }}>
        {/* Left info panel */}
        <Card title="Service Appointment Information" style={{ width: 340, flexShrink: 0 }} size="small">
          <Descriptions column={1} size="small" labelStyle={{ width: 140, color: '#888' }}>
            <Descriptions.Item label="Service(s)">{serviceName}</Descriptions.Item>
            <Descriptions.Item label="Schedule Type">{formatStatusLabel(appointment.schedule_type || '-')}</Descriptions.Item>
            <Descriptions.Item label="Scheduled Time">
              {formatDateTime(appointment.scheduled_start)} → {formatDateTime(appointment.scheduled_end)}
            </Descriptions.Item>
            <Descriptions.Item label="Scheduled Duration">{formatDurationHms(appointment.scheduled_duration)}</Descriptions.Item>
            <Descriptions.Item label="Actual Time">
              {appointment.actual_start
                ? `${formatDateTime(appointment.actual_start)} → ${appointment.actual_end ? formatDateTime(appointment.actual_end) : 'In progress'}`
                : 'Not yet started'}
            </Descriptions.Item>
            <Descriptions.Item label="Actual Duration">
              {appointment.actual_duration ? formatDurationHms(appointment.actual_duration) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Service Resource">{agentName || 'Unassigned'}</Descriptions.Item>
            <Descriptions.Item label="Due Date">{formatDate(appointment.due_date)}</Descriptions.Item>
            {appointment.preferred_date_1 && (
              <Descriptions.Item label="Preferred Date 1">{formatDate(appointment.preferred_date_1)}</Descriptions.Item>
            )}
            {appointment.preferred_date_2 && (
              <Descriptions.Item label="Preferred Date 2">{formatDate(appointment.preferred_date_2)}</Descriptions.Item>
            )}
            {appointment.preferred_time && (
              <Descriptions.Item label="Preferred Time">{appointment.preferred_time}</Descriptions.Item>
            )}
            <Descriptions.Item label="Billing Status">
              <Tag color={billingStatusColors[appointment.billing_status || 'not_invoiced']}>
                {formatBillingStatus(appointment.billing_status)}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Right tabs */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Card size="small">
            <Tabs
              defaultActiveKey="overview"
              items={[
                {
                  key: 'overview',
                  label: 'Overview',
                  children:
                    activity.length === 0 ? (
                      <Empty description="No activity yet" />
                    ) : (
                      <div>
                        {Object.entries(groupedActivity).map(([date, events]) => (
                          <div key={date} style={{ marginBottom: 20 }}>
                            <Text strong style={{ color: '#666' }}>
                              {date}
                            </Text>
                            <Timeline style={{ marginTop: 12 }}>
                              {events.map((ev) => (
                                <Timeline.Item key={ev.id}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{ev.description}</span>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      {dayjs(ev.at).format('h:mm A')}
                                    </Text>
                                  </div>
                                  {ev.user_name && (
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      {ev.user_name}
                                    </Text>
                                  )}
                                </Timeline.Item>
                              ))}
                            </Timeline>
                          </div>
                        ))}
                      </div>
                    ),
                },
                {
                  key: 'job-execution',
                  label: 'Job Execution',
                  children: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Job Sheets and Service Reports coming soon"
                      style={{ padding: 32 }}
                    />
                  ),
                },
                {
                  key: 'services-parts',
                  label: 'Services & Parts',
                  children: (
                    <div>
                      <Text strong>Services</Text>
                      <Table
                        style={{ marginTop: 8, marginBottom: 8 }}
                        size="small"
                        rowKey="id"
                        pagination={false}
                        columns={lineItemColumns('service')}
                        dataSource={services}
                        locale={{ emptyText: 'No Records Found' }}
                      />
                      <div style={{ textAlign: 'right', color: '#555', marginBottom: 24 }}>
                        <div>Subtotal: {rupees(servicesSubtotal)}</div>
                        <div>Discount: --</div>
                        <div>Adjustment: --</div>
                      </div>

                      <Text strong>Parts</Text>
                      <Table
                        style={{ marginTop: 8 }}
                        size="small"
                        rowKey="id"
                        pagination={false}
                        columns={lineItemColumns('part')}
                        dataSource={parts}
                        locale={{ emptyText: 'No Records Found' }}
                      />
                    </div>
                  ),
                },
                {
                  key: 'time-travel',
                  label: 'Time & Travel',
                  children: (
                    <div>
                      {/* Timesheets */}
                      <Card size="small" title={<><ClockCircleOutlined /> Timesheets</>} style={{ marginBottom: 16 }}>
                        <Space size={48}>
                          <div>
                            <div style={{ fontSize: 12, color: '#999' }}>Scheduled Duration</div>
                            <div style={{ fontSize: 18, fontWeight: 600 }}>{formatDurationHms(appointment.scheduled_duration)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 12, color: '#999' }}>Actual Duration</div>
                            <div style={{ fontSize: 18, fontWeight: 600 }}>
                              {appointment.status === 'completed' && appointment.actual_start && appointment.actual_end
                                ? formatDurationHms(appointment.actual_duration)
                                : appointment.actual_start
                                  ? formatDurationHms(appointment.actual_duration)
                                  : '—'}
                            </div>
                          </div>
                        </Space>
                        {!appointment.actual_start && (
                          <div style={{ color: '#999', marginTop: 8 }}>Service Appointment not yet started</div>
                        )}
                      </Card>

                      {/* Trips */}
                      <Card
                        size="small"
                        title={<><CarOutlined /> Trips</>}
                        extra={
                          <Button type="link" icon={<PlusOutlined />} onClick={openAddTrip}>
                            Add Trip
                          </Button>
                        }
                      >
                        <Table
                          size="small"
                          rowKey="id"
                          pagination={false}
                          columns={tripColumns}
                          dataSource={appointment.trips || []}
                          locale={{ emptyText: 'No Records Found' }}
                        />

                        {tripFormOpen && (
                          <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 16, paddingTop: 16 }}>
                            <Form form={tripForm} layout="vertical">
                              <Space wrap align="start" style={{ width: '100%' }}>
                                <Form.Item name="trip_date" label="Trip Date" rules={[{ required: true, message: 'Required' }]}>
                                  <DatePicker format="YYYY-MM-DD" />
                                </Form.Item>
                                <Form.Item name="window" label="Departure → Arrival">
                                  <RangePicker showTime format="MM-DD HH:mm" />
                                </Form.Item>
                                <Form.Item name="distance_km" label="Distance (km)">
                                  <InputNumber min={0} step={0.1} />
                                </Form.Item>
                              </Space>
                              <Space wrap align="start" style={{ width: '100%' }}>
                                <Form.Item name="start_location" label="Start Location" rules={[{ required: true, message: 'Required' }]}>
                                  <Input placeholder="From" style={{ width: 220 }} />
                                </Form.Item>
                                <Form.Item name="end_location" label="End Location" rules={[{ required: true, message: 'Required' }]}>
                                  <Input placeholder="To" style={{ width: 220 }} />
                                </Form.Item>
                              </Space>
                              <Form.Item name="notes" label="Notes">
                                <TextArea rows={2} />
                              </Form.Item>
                              <Space>
                                <Button
                                  type="primary"
                                  loading={addTrip.isPending || updateTrip.isPending}
                                  onClick={submitTrip}
                                >
                                  Save Trip
                                </Button>
                                <Button
                                  onClick={() => {
                                    setTripFormOpen(false);
                                    setEditingTripId(null);
                                    tripForm.resetFields();
                                  }}
                                >
                                  Cancel
                                </Button>
                              </Space>
                            </Form>
                          </div>
                        )}
                      </Card>
                    </div>
                  ),
                },
                {
                  key: 'notes-attachments',
                  label: 'Notes & Attachments',
                  children: (
                    <div>
                      <Card size="small" title={<><FileTextOutlined /> Notes</>} style={{ marginBottom: 16 }}>
                        <TextArea
                          rows={3}
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Write a note..."
                          style={{ marginBottom: 12 }}
                        />
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          loading={addNote.isPending}
                          disabled={!newNote.trim()}
                          onClick={handleAddNote}
                        >
                          Add Note
                        </Button>

                        <div style={{ marginTop: 16 }}>
                          {(appointment.note_entries || []).length === 0 ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No notes yet" />
                          ) : (
                            [...(appointment.note_entries || [])]
                              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                              .map((note) => (
                                <div key={note.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                                  <Avatar icon={<UserOutlined />} size="small" />
                                  <div>
                                    <Space size={8}>
                                      <Text strong style={{ fontSize: 13 }}>{note.user_name || 'User'}</Text>
                                      <Text type="secondary" style={{ fontSize: 12 }}>{formatDateTime(note.created_at)}</Text>
                                    </Space>
                                    <div style={{ whiteSpace: 'pre-wrap' }}>{note.content}</div>
                                  </div>
                                </div>
                              ))
                          )}
                        </div>
                      </Card>

                      <Card size="small" title="Attachments">
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description="Attachment upload coming soon"
                          style={{ padding: 16 }}
                        />
                      </Card>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
