import { useState } from 'react';
import {
  Typography,
  Button,
  Input,
  Table,
  Tag,
  Switch,
  Modal,
  Form,
  Select,
  Dropdown,
  Empty,
  Space,
  DatePicker,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useUiStore } from '@/store/ui.store';
import {
  useTimeBasedRules,
  useCreateTimeBasedRule,
  useUpdateTimeBasedRule,
  useDeleteTimeBasedRule,
} from '@/hooks/use-time-based-rules';
import { TimeBasedRule } from '@/types/models.types';

const { Title, Text } = Typography;

const MODULES = [
  'Addresses', 'Assets', 'Attendance Logs', 'Companies', 'Contacts',
  'Equipment', 'Estimates', 'Requests', 'Routes', 'Service Appointments',
  'Service Reports', 'Services And Parts', 'Time Off', 'Timesheets', 'Work Orders',
];

const DATE_FIELDS: Record<string, string[]> = {
  'Work Orders': ['Scheduled Start', 'Scheduled End', 'Actual Start', 'Actual End', 'Created Date'],
  'Service Appointments': ['Scheduled Start', 'Scheduled End', 'Created Date'],
  'Estimates': ['Expiry Date', 'Created Date'],
  'Assets': ['Installation Date', 'Warranty Expiry', 'Created Date'],
  'Contacts': ['Created Date', 'Last Modified'],
  'Companies': ['Created Date', 'Last Modified'],
};



export default function TimeBasedRulesPage() {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === 'dark';

  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form] = Form.useForm();

  const { data: rulesData, isLoading } = useTimeBasedRules();
  const createRule = useCreateTimeBasedRule();
  const updateRule = useUpdateTimeBasedRule();
  const deleteRule = useDeleteTimeBasedRule();

  const rules = (rulesData?.data || []) as TimeBasedRule[];

  const filtered = rules.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (moduleFilter && r.module !== moduleFilter) return false;
    if (statusFilter === 'active' && !r.is_active) return false;
    if (statusFilter === 'inactive' && r.is_active) return false;
    return true;
  });

  const handleCreate = async () => {
    if (step === 1) {
      try {
        await form.validateFields(['name', 'module']);
        setStep(2);
      } catch {}
      return;
    }
    try {
      const values = await form.validateFields();
      await createRule.mutateAsync({
        name: values.name,
        module: values.module,
        description: values.description,
        date_field: values.date_field,
        offset_direction: values.offset?.direction || 'before',
        offset_value: Number(values.offset?.value || 0),
        offset_unit: values.offset?.unit || 'days',
        is_active: true,
      });
      setCreateModalOpen(false);
      form.resetFields();
      setStep(1);
    } catch {}
  };

  const handleToggle = (id: string, checked: boolean) => {
    updateRule.mutate({ id, is_active: checked });
  };

  const handleDelete = (id: string, name: string) => {
    Modal.confirm({
      title: 'Delete Time Based Rule?',
      content: `Are you sure you want to delete "${name}"?`,
      okType: 'danger',
      onOk: () => deleteRule.mutate(id),
    });
  };

  const textPrimary = isDark ? '#e5e7eb' : '#1a1a2e';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';

  const columns: ColumnsType<TimeBasedRule> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <div>
          <Text strong style={{ color: '#2f54eb', fontSize: 13 }}>{name}</Text>
          {record.description && (
            <div>
              <Text style={{ fontSize: 12, color: textSecondary }}>{record.description}</Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Module
          <Select
            size="small"
            placeholder="All"
            style={{ width: 100 }}
            value={moduleFilter}
            onChange={(v) => setModuleFilter(v)}
            allowClear
            options={MODULES.map((m) => ({ label: m, value: m }))}
            bordered={false}
          />
        </div>
      ),
      dataIndex: 'module',
      key: 'module',
      render: (module: string) => <Tag>{module}</Tag>,
    },
    {
      title: 'Last Modified',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string) => (
        <Text style={{ fontSize: 12, color: textSecondary }}>
          {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
      ),
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          Status
          <Select
            size="small"
            placeholder="All"
            style={{ width: 80 }}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            allowClear
            options={[
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ]}
            bordered={false}
          />
        </div>
      ),
      key: 'status',
      render: (_: unknown, record: TimeBasedRule) => (
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
      render: (_: unknown, record: TimeBasedRule) => (
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
                onClick: () => handleDelete(record.id, record.name),
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
              Time Based Rules
            </Title>
            <Text style={{ color: textSecondary, fontSize: 13 }}>
              Effectively manage deadlines and time-sensitive tasks by setting reminders or notifications that can be triggered
              using specific dates. Automate executing specific tasks at designated times guaranteeing prompt actions.
            </Text>
          </div>
          <Button type="link" style={{ color: textSecondary, flexShrink: 0, padding: 0 }}>
            Help
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, marginTop: 16 }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 240, borderRadius: 6 }}
          allowClear
        />
        <div style={{ marginLeft: 'auto' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ background: '#00a86b', borderColor: '#00a86b', borderRadius: 6 }}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Time Based Rule
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
              description={<Text style={{ color: textSecondary }}>No Records Found</Text>}
            />
          ),
        }}
        style={{ borderRadius: 8, overflow: 'hidden' }}
      />

      {/* Create Modal */}
      <Modal
        title={
          <Space>
            <FieldTimeOutlined style={{ color: '#2f54eb' }} />
            <span>Create New Rule</span>
          </Space>
        }
        open={createModalOpen}
        onCancel={() => { setCreateModalOpen(false); form.resetFields(); setStep(1); }}
        width={520}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {step === 2 && <Button onClick={() => setStep(1)}>Back</Button>}
            <Button onClick={() => { setCreateModalOpen(false); form.resetFields(); setStep(1); }}>
              Cancel
            </Button>
            <Button
              type="primary"
              style={{ background: '#00a86b', borderColor: '#00a86b' }}
              onClick={handleCreate}
              loading={createRule.isPending}
            >
              {step === 1 ? 'Next' : 'Save'}
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {step === 1 ? (
            <>
              <Form.Item
                label="Module"
                name="module"
                rules={[{ required: true, message: 'Please select a module' }]}
              >
                <Select
                  showSearch
                  placeholder="Select"
                  filterOption={(input, option) =>
                    String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={MODULES.map((m) => ({ label: m, value: m }))}
                />
              </Form.Item>
              <Form.Item
                label="Rule name"
                name="name"
                rules={[{ required: true, message: 'Please enter a rule name' }]}
              >
                <Input placeholder="Enter rule name" />
              </Form.Item>
              <Form.Item label="Description" name="description">
                <Input.TextArea rows={3} placeholder="Optional description" />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item
                label="Date Field"
                name="date_field"
                rules={[{ required: true, message: 'Please select a date field' }]}
              >
                <Select
                  placeholder="Select a date field"
                  options={(DATE_FIELDS[form.getFieldValue('module')] || ['Created Date', 'Last Modified']).map((f) => ({
                    label: f,
                    value: f.toLowerCase().replace(/ /g, '_'),
                  }))}
                />
              </Form.Item>
              <Form.Item label="Trigger Offset" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Form.Item name={['offset', 'direction']} initialValue="before" noStyle>
                    <Select
                      style={{ width: 100 }}
                      options={[
                        { label: 'Before', value: 'before' },
                        { label: 'After', value: 'after' },
                        { label: 'On', value: 'on' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item name={['offset', 'value']} initialValue={0} noStyle>
                    <Input
                      type="number"
                      placeholder="0"
                      style={{ width: 80 }}
                      min={0}
                    />
                  </Form.Item>
                  <Form.Item name={['offset', 'unit']} initialValue="days" noStyle>
                    <Select
                      style={{ width: 100 }}
                      options={[
                        { label: 'Days', value: 'days' },
                        { label: 'Hours', value: 'hours' },
                        { label: 'Weeks', value: 'weeks' },
                      ]}
                    />
                  </Form.Item>
                </div>
              </Form.Item>
              <Form.Item label="Actions" extra="Specify what happens when this rule triggers">
                <div
                  style={{
                    border: '1px dashed #d9d9d9',
                    borderRadius: 6,
                    padding: 16,
                    textAlign: 'center',
                    color: textSecondary,
                    fontSize: 13,
                  }}
                >
                  No actions configured yet
                  <br />
                  <Button type="link" size="small" style={{ marginTop: 4 }}>
                    + Add Action
                  </Button>
                </div>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
