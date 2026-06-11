import { useState } from 'react';
import {
  Typography,
  Button,
  Table,
  Tag,
  Switch,
  Modal,
  Form,
  Select,
  Input,
  TimePicker,
  Dropdown,
  Empty,
  Space,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useUiStore } from '@/store/ui.store';
import {
  useScheduledReports,
  useCreateScheduledReport,
  useUpdateScheduledReport,
  useDeleteScheduledReport,
} from '@/hooks/use-scheduled-reports';
import { ScheduledReport } from '@/types/models.types';

const { Title, Text } = Typography;

const REPORTS = [
  'Work Order Summary',
  'Technician Performance',
  'Revenue Report',
  'Service Request Summary',
  'Appointment Utilization',
  'Customer Satisfaction',
  'Asset Maintenance Report',
  'Invoice Aging Report',
];

const FREQUENCIES = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
];

const DAYS_OF_WEEK = [
  { label: 'Monday', value: 'MON' },
  { label: 'Tuesday', value: 'TUE' },
  { label: 'Wednesday', value: 'WED' },
  { label: 'Thursday', value: 'THU' },
  { label: 'Friday', value: 'FRI' },
  { label: 'Saturday', value: 'SAT' },
  { label: 'Sunday', value: 'SUN' },
];

export default function ScheduledReportsPage() {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === 'dark';

  const [search, setSearch] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedFreq, setSelectedFreq] = useState<string>('weekly');
  const [form] = Form.useForm();

  const textPrimary = isDark ? '#e5e7eb' : '#1a1a2e';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';

  const { data: reportsData, isLoading } = useScheduledReports();
  const createReport = useCreateScheduledReport();
  const updateReport = useUpdateScheduledReport();
  const deleteReport = useDeleteScheduledReport();

  const reports = (reportsData?.data || []) as ScheduledReport[];

  const filtered = reports.filter((r) => {
    if (search && !r.report_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (frequencyFilter && r.frequency !== frequencyFilter) return false;
    return true;
  });

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await createReport.mutateAsync({
        report_name: values.report_name,
        frequency: values.frequency,
        send_time: values.send_time ? values.send_time.format('HH:mm') : '08:00',
        format: values.format,
        recipients: values.recipients ? values.recipients.split(',').map((e: string) => e.trim()) : [],
        is_active: true,
      });
      setCreateModalOpen(false);
      form.resetFields();
    } catch {}
  };

  const handleToggle = (id: string, checked: boolean) => {
    updateReport.mutate({ id, is_active: checked });
  };

  const handleDelete = (id: string, name: string) => {
    Modal.confirm({
      title: 'Delete Scheduled Report?',
      content: `Are you sure you want to delete "${name}"?`,
      okType: 'danger',
      onOk: () => deleteReport.mutate(id),
    });
  };

  const FREQ_COLORS: Record<string, string> = {
    daily: 'green',
    weekly: 'blue',
    monthly: 'purple',
    quarterly: 'orange',
  };

  const columns: ColumnsType<ScheduledReport> = [
    {
      title: 'Report',
      dataIndex: 'report_name',
      key: 'report_name',
      render: (name: string) => (
        <Text strong style={{ color: '#2f54eb', fontSize: 13 }}>{name}</Text>
      ),
    },
    {
      title: 'Recipients',
      dataIndex: 'recipients',
      key: 'recipients',
      render: (recipients: string[]) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {recipients.slice(0, 2).map((r) => (
            <Tag key={r} style={{ fontSize: 11 }}>{r}</Tag>
          ))}
          {recipients.length > 2 && (
            <Tag style={{ fontSize: 11 }}>+{recipients.length - 2} more</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Frequency',
      dataIndex: 'frequency',
      key: 'frequency',
      render: (freq: string) => (
        <Tag color={FREQ_COLORS[freq] || 'default'} style={{ textTransform: 'capitalize' }}>
          {freq}
        </Tag>
      ),
    },
    {
      title: 'Next Run',
      dataIndex: 'next_run',
      key: 'next_run',
      render: (date: string) => (
        <Text style={{ fontSize: 12, color: textSecondary }}>
          {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, record: ScheduledReport) => (
        <Switch
          size="small"
          checked={record.is_active}
          onChange={(checked) => handleToggle(record.id, checked)}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 48,
      render: (_: unknown, record: ScheduledReport) => (
        <Dropdown
          menu={{
            items: [
              { key: 'edit', label: 'Edit', icon: <EditOutlined /> },
              { type: 'divider' },
              {
                key: 'delete',
                label: 'Delete',
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => handleDelete(record.id, record.report_name),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} size="small" />
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0, color: textPrimary }}>
              Scheduled Reports
            </Title>
            <Text style={{ color: textSecondary, fontSize: 13 }}>
              Schedule automated report delivery to keep your team informed with regular insights.
              Reports are sent via email to specified recipients on a defined schedule.
            </Text>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, marginTop: 16 }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          placeholder="Search scheduled reports..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280, borderRadius: 6 }}
          allowClear
        />
        <div style={{ marginLeft: 'auto' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ background: '#00a86b', borderColor: '#00a86b', borderRadius: 6 }}
            onClick={() => setCreateModalOpen(true)}
          >
            Schedule Report
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filtered}
        loading={isLoading}
        rowKey="id"
        pagination={false}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<Text style={{ color: textSecondary }}>No Scheduled Reports Found</Text>}
            />
          ),
        }}
        style={{ borderRadius: 8, overflow: 'hidden' }}
      />

      {/* Schedule Modal */}
      <Modal
        title={
          <Space>
            <ScheduleOutlined style={{ color: '#722ed1' }} />
            <span>Schedule a Report</span>
          </Space>
        }
        open={createModalOpen}
        onCancel={() => { setCreateModalOpen(false); form.resetFields(); setSelectedFreq('weekly'); }}
        onOk={handleCreate}
        okText="Schedule"
        okButtonProps={{ style: { background: '#00a86b', borderColor: '#00a86b' }, loading: createReport.isPending }}
        width={520}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} initialValues={{ frequency: 'weekly' }}>
          <Form.Item
            label="Report"
            name="report_name"
            rules={[{ required: true, message: 'Please select a report' }]}
          >
            <Select
              placeholder="Select a report"
              showSearch
              options={REPORTS.map((r) => ({ label: r, value: r }))}
            />
          </Form.Item>

          <Form.Item
            label="Recipients (Email)"
            name="recipients"
            rules={[{ required: true, message: 'Add at least one recipient' }]}
          >
            <Select
              mode="tags"
              placeholder="Enter email addresses..."
              tokenSeparators={[',', ' ']}
            />
          </Form.Item>

          <Form.Item
            label="Frequency"
            name="frequency"
            rules={[{ required: true }]}
          >
            <Select
              options={FREQUENCIES}
              onChange={(v) => setSelectedFreq(v)}
            />
          </Form.Item>

          {selectedFreq === 'weekly' && (
            <Form.Item label="Day of Week" name="day_of_week">
              <Select
                options={DAYS_OF_WEEK}
                defaultValue="MON"
              />
            </Form.Item>
          )}

          {selectedFreq === 'monthly' && (
            <Form.Item label="Day of Month" name="day_of_month">
              <Select
                options={Array.from({ length: 28 }, (_, i) => ({
                  label: `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}`,
                  value: i + 1,
                }))}
                defaultValue={1}
              />
            </Form.Item>
          )}

          <Form.Item label="Time" name="send_time">
            <TimePicker
              format="h:mm A"
              use12Hours
              defaultValue={dayjs('09:00', 'HH:mm')}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="Format" name="format">
            <Select
              defaultValue="pdf"
              options={[
                { label: 'PDF', value: 'pdf' },
                { label: 'Excel (.xlsx)', value: 'xlsx' },
                { label: 'CSV', value: 'csv' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
