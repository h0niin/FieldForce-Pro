import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Table, Tag, Select, Input, DatePicker, Card } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import PageHeader from '@/components/common/PageHeader';
import { PermissionGuard } from '@/components/permissions';
import { useAppointments } from '@/hooks/use-appointments';
import type { AppointmentListParams } from '@/api/appointments.api';
import type { ServiceAppointment } from '@/types/models.types';
import { Order } from '@/types/enums';
import { formatDateTime } from '@/utils/format-date';
import {
  appointmentStatusColors,
  billingStatusColors,
  formatStatusLabel,
  formatBillingStatus,
} from '@/utils/appointment';
import CreateServiceAppointmentDrawer from '@/components/service-appointments/CreateServiceAppointmentDrawer';

const { RangePicker } = DatePicker;

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'en_route', label: 'En Route' },
  { value: 'on_site', label: 'On Site' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const SCHEDULE_TYPE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'time_bound', label: 'Time-bound' },
  { value: 'all_day', label: 'All Day' },
];

function contactName(appt: ServiceAppointment): string {
  const c = appt.work_order?.contact;
  if (!c) return '-';
  return `${c.first_name} ${c.last_name || ''}`.trim() || '-';
}

function companyName(appt: ServiceAppointment): string {
  return appt.work_order?.contact?.company?.name || '-';
}

export default function ServiceAppointmentsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Raw filter inputs
  const [range, setRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [scheduleType, setScheduleType] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [company, setCompany] = useState('');

  // Debounced text inputs → applied values
  const [applied, setApplied] = useState({ name: '', email: '', contact: '', company: '' });
  useEffect(() => {
    const timer = setTimeout(() => {
      setApplied({ name, email, contact, company });
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [name, email, contact, company]);

  const params: AppointmentListParams = useMemo(
    () => ({
      page,
      take: pageSize,
      order: Order.DESC,
      status: status || undefined,
      scheduleType: scheduleType || undefined,
      name: applied.name || undefined,
      email: applied.email || undefined,
      contact: applied.contact || undefined,
      company: applied.company || undefined,
      dateFrom: range?.[0] ? range[0].toISOString() : undefined,
      dateTo: range?.[1] ? range[1].toISOString() : undefined,
    }),
    [page, pageSize, status, scheduleType, applied, range],
  );

  const { data, isLoading } = useAppointments(params);
  const rows = data?.data || [];
  const total = data?.meta?.itemCount || 0;

  const columns: ColumnsType<ServiceAppointment> = [
    {
      title: 'Appointment #',
      dataIndex: 'appointment_number',
      key: 'appointment_number',
      sorter: (a, b) => (a.appointment_number || '').localeCompare(b.appointment_number || ''),
      render: (num: string, record) => (
        <Link to={`/service-appointments/${record.id}`}>
          <span style={{ fontWeight: 600 }}>{num || '-'}</span>
        </Link>
      ),
    },
    {
      title: 'Summary',
      dataIndex: 'summary',
      key: 'summary',
      sorter: (a, b) => (a.summary || '').localeCompare(b.summary || ''),
      render: (summary: string) => summary || <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={appointmentStatusColors[s] || 'default'}>{formatStatusLabel(s)}</Tag>,
    },
    {
      title: 'Billing Status',
      dataIndex: 'billing_status',
      key: 'billing_status',
      render: (s: string) => (
        <Tag color={billingStatusColors[s] || 'default'}>{formatBillingStatus(s)}</Tag>
      ),
    },
    {
      title: 'Scheduled Start',
      dataIndex: 'scheduled_start',
      key: 'scheduled_start',
      render: (d: string) => (d ? formatDateTime(d) : <span style={{ opacity: 0.5 }}>-</span>),
    },
    {
      title: 'Scheduled End',
      dataIndex: 'scheduled_end',
      key: 'scheduled_end',
      render: (d: string) => (d ? formatDateTime(d) : <span style={{ opacity: 0.5 }}>-</span>),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => contactName(record),
    },
    {
      title: 'Company',
      key: 'company',
      render: (_, record) => companyName(record),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      render: (d: string) => formatDateTime(d),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader title="Service Appointments" subtitle="Schedule and track service appointments" />
        <PermissionGuard permission="service_appointments:create">
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setDrawerOpen(true)}>
            Create
          </Button>
        </PermissionGuard>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Left filter panel */}
        <Card size="small" title="Filters" style={{ width: 280, flexShrink: 0 }} bodyStyle={{ padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Appointment Time Range</div>
              <RangePicker
                style={{ width: '100%' }}
                value={range as never}
                onChange={(v) => {
                  setRange(v as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null);
                  setPage(1);
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Schedule Type</div>
              <Select
                style={{ width: '100%' }}
                value={scheduleType}
                onChange={(v) => {
                  setScheduleType(v);
                  setPage(1);
                }}
                options={SCHEDULE_TYPE_OPTIONS}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Service Appointment Name</div>
              <Input allowClear placeholder="Search name / number" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Status</div>
              <Select
                style={{ width: '100%' }}
                value={status}
                onChange={(v) => {
                  setStatus(v);
                  setPage(1);
                }}
                options={STATUS_OPTIONS}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Email</div>
              <Input allowClear placeholder="Contact email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Contact</div>
              <Input allowClear placeholder="Contact name" value={contact} onChange={(e) => setContact(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Company</div>
              <Input allowClear placeholder="Company name" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
          </div>
        </Card>

        {/* Table */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Table
            columns={columns}
            dataSource={rows}
            rowKey="id"
            loading={isLoading}
            scroll={{ x: 1100 }}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (t) => `Total ${t} items`,
              onChange: (newPage, newPageSize) => {
                setPage(newPage);
                setPageSize(newPageSize);
              },
            }}
          />
        </div>
      </div>

      <CreateServiceAppointmentDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
