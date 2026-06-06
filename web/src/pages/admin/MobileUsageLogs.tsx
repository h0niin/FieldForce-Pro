import { useState, useEffect } from 'react';
import {
  Button,
  Table,
  Tag,
  Space,
  Tooltip,
  Select,
  DatePicker,
  Typography,
  Modal,
  Input,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { MobileOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuditLogs } from '@/hooks/use-audit-logs';
import PageHeader from '@/components/common/PageHeader';

const { RangePicker } = DatePicker;
const { Text } = Typography;

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditLogRow {
  id: string;
  user_id: string;
  action: string;
  module: string;
  record_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  login_success:                   'cyan',
  biometric_login:                 'blue',
  logout:                          'orange',
  work_order_status_changed:       'geekblue',
  work_order_note_added:           'purple',
  work_order_photo_uploaded:       'volcano',
  clock_in:                        'green',
  clock_out:                       'gold',
  service_request_accepted:        'success',
  service_request_rejected:        'error',
  service_request_status_changed:  'default',
  estimate_sent:                   'processing',
  estimate_signature_captured:     'magenta',
  appointment_signature_captured:  'pink',
};

const ACTION_OPTIONS = [
  { value: 'login_success',                  label: 'Login' },
  { value: 'biometric_login',                label: 'Biometric Login' },
  { value: 'logout',                         label: 'Logout' },
  { value: 'work_order_status_changed',      label: 'WO Status Changed' },
  { value: 'work_order_note_added',          label: 'WO Note Added' },
  { value: 'work_order_photo_uploaded',      label: 'WO Photo Uploaded' },
  { value: 'clock_in',                       label: 'Clock In' },
  { value: 'clock_out',                      label: 'Clock Out' },
  { value: 'service_request_accepted',       label: 'SR Accepted' },
  { value: 'service_request_rejected',       label: 'SR Rejected' },
  { value: 'estimate_sent',                  label: 'Estimate Sent' },
  { value: 'estimate_signature_captured',    label: 'Estimate Signed' },
];

const MODULE_OPTIONS = [
  { value: 'mobile_auth',       label: 'Authentication' },
  { value: 'work_orders',       label: 'Work Orders' },
  { value: 'timesheets',        label: 'Timesheets' },
  { value: 'service_requests',  label: 'Service Requests' },
  { value: 'estimates',         label: 'Estimates' },
  { value: 'appointments',      label: 'Appointments' },
];

function formatActionLabel(action: string): string {
  return action
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function DetailsCell({ values }: { values: Record<string, unknown> | null }) {
  if (!values) return <Text type="secondary">—</Text>;
  // Strip the internal _user_agent key from display
  const { _user_agent: _ua, ...display } = values;
  if (Object.keys(display).length === 0) return <Text type="secondary">—</Text>;
  return (
    <Text style={{ fontFamily: 'monospace', fontSize: 11 }}>
      {JSON.stringify(display)}
    </Text>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MobileUsageLogs() {
  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(20);
  const [userId, setUserId]       = useState<string | undefined>(undefined);
  const [userInput, setUserInput] = useState('');
  const [action, setAction]       = useState<string | undefined>(undefined);
  const [module, setModule]       = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate]     = useState<string | undefined>(undefined);

  // Detail modal
  const [detailRecord, setDetailRecord] = useState<AuditLogRow | null>(null);

  // Debounce user-id filter
  useEffect(() => {
    const t = setTimeout(() => {
      setUserId(userInput.trim() || undefined);
      setPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [userInput]);

  const { data, isLoading, refetch } = useAuditLogs({
    page,
    take: pageSize,
    user_id: userId,
    action,
    module,
    start_date: startDate,
    end_date: endDate,
  });

  const rows = (data?.data ?? []) as AuditLogRow[];
  const meta = data?.meta;

  const columns: ColumnsType<AuditLogRow> = [
    {
      title: 'Date / Time',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v: string) => (
        <Text style={{ fontSize: 12 }}>
          {v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '—'}
        </Text>
      ),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: 'User ID',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 110,
      render: (id: string) => (
        <Tooltip title={id}>
          <Text copyable={{ text: id }} style={{ fontFamily: 'monospace', fontSize: 11 }}>
            {id?.substring(0, 8)}…
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 200,
      render: (a: string) => (
        <Tag color={ACTION_COLORS[a] ?? 'default'} style={{ fontSize: 11 }}>
          {formatActionLabel(a)}
        </Tag>
      ),
    },
    {
      title: 'Module',
      dataIndex: 'module',
      key: 'module',
      width: 140,
      render: (m: string) => <Tag>{m?.replace('mobile_', '') ?? '—'}</Tag>,
    },
    {
      title: 'Record ID',
      dataIndex: 'record_id',
      key: 'record_id',
      width: 100,
      render: (id: string | null) =>
        id ? (
          <Tooltip title={id}>
            <Text style={{ fontFamily: 'monospace', fontSize: 11 }}>{id.substring(0, 8)}…</Text>
          </Tooltip>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Details',
      key: 'details',
      ellipsis: true,
      render: (_, r) => <DetailsCell values={r.new_values} />,
    },
    {
      title: 'Device',
      key: 'device',
      width: 180,
      render: (_, r) => {
        const ua = r.new_values?._user_agent as string | undefined;
        return ua ? (
          <Tooltip title={ua}>
            <Space size={4}>
              <MobileOutlined style={{ color: '#8c8c8c' }} />
              <Text style={{ fontSize: 11 }} ellipsis>
                {ua.replace('FieldForce-Pro Mobile/1.0 ', '')}
              </Text>
            </Space>
          </Tooltip>
        ) : (
          <Text type="secondary" style={{ fontSize: 11 }}>
            {r.user_agent?.substring(0, 30) ?? '—'}
          </Text>
        );
      },
    },
    {
      title: '',
      key: 'view',
      width: 48,
      fixed: 'right',
      render: (_, r) => (
        <Tooltip title="View full details">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setDetailRecord(r)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Mobile Usage Logs"
        subtitle="Audit trail of technician and field worker activity from the mobile app"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Refresh
          </Button>
        }
      />

      {/* Filters */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Input
          placeholder="Filter by User ID"
          allowClear
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          style={{ width: 200 }}
        />
        <Select
          placeholder="Filter by Action"
          allowClear
          value={action}
          onChange={(v) => { setAction(v); setPage(1); }}
          options={ACTION_OPTIONS}
          style={{ width: 200 }}
        />
        <Select
          placeholder="Filter by Module"
          allowClear
          value={module}
          onChange={(v) => { setModule(v); setPage(1); }}
          options={MODULE_OPTIONS}
          style={{ width: 180 }}
        />
        <RangePicker
          style={{ width: 300 }}
          onChange={(dates) => {
            setStartDate(dates?.[0]?.toISOString() ?? undefined);
            setEndDate(dates?.[1]?.toISOString() ?? undefined);
            setPage(1);
          }}
        />
      </div>

      <Table<AuditLogRow>
        columns={columns}
        dataSource={rows}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 1100 }}
        size="small"
        pagination={{
          current: page,
          pageSize,
          total: meta?.itemCount ?? 0,
          showSizeChanger: true,
          pageSizeOptions: ['20', '50', '100'],
          showTotal: (total) => `${total} events`,
          onChange: (p, ps) => {
            setPage(p);
            if (ps !== pageSize) { setPageSize(ps); setPage(1); }
          },
        }}
      />

      {/* Detail modal */}
      <Modal
        open={!!detailRecord}
        title="Audit Event Details"
        onCancel={() => setDetailRecord(null)}
        footer={null}
        width={640}
      >
        {detailRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><Text strong>ID: </Text><Text code>{detailRecord.id}</Text></div>
            <div><Text strong>User ID: </Text><Text code>{detailRecord.user_id}</Text></div>
            <div>
              <Text strong>Action: </Text>
              <Tag color={ACTION_COLORS[detailRecord.action] ?? 'default'}>
                {formatActionLabel(detailRecord.action)}
              </Tag>
            </div>
            <div><Text strong>Module: </Text><Tag>{detailRecord.module}</Tag></div>
            <div>
              <Text strong>Record ID: </Text>
              <Text code>{detailRecord.record_id ?? '—'}</Text>
            </div>
            <div>
              <Text strong>Timestamp: </Text>
              <Text>{dayjs(detailRecord.created_at).format('YYYY-MM-DD HH:mm:ss')}</Text>
            </div>
            <div>
              <Text strong>IP Address: </Text>
              <Text code>{detailRecord.ip_address ?? '—'}</Text>
            </div>
            {detailRecord.old_values && (
              <div>
                <Text strong>Previous Values:</Text>
                <pre style={{ fontSize: 12, background: '#f5f5f5', padding: 8, borderRadius: 4, marginTop: 4 }}>
                  {JSON.stringify(detailRecord.old_values, null, 2)}
                </pre>
              </div>
            )}
            {detailRecord.new_values && (
              <div>
                <Text strong>New Values / Metadata:</Text>
                <pre style={{ fontSize: 12, background: '#f5f5f5', padding: 8, borderRadius: 4, marginTop: 4 }}>
                  {JSON.stringify(detailRecord.new_values, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
