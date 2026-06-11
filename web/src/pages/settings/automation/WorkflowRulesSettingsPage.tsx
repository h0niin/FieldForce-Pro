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
  Space,
  Empty,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import { useWorkflowRules, useCreateWorkflowRule, useDeleteWorkflowRule, useUpdateWorkflowRule } from '@/hooks/use-workflow-rules';
import { useUiStore } from '@/store/ui.store';

const { Title, Text } = Typography;
const { Option } = Select;

const MODULES = [
  'Addresses', 'Assets', 'Attendance Logs', 'Companies', 'Contacts',
  'Equipment', 'Estimates', 'Requests', 'Routes', 'Service Appointments',
  'Service Reports', 'Services And Parts', 'Time Off', 'Timesheets', 'Work Orders',
];

const TRIGGER_EVENTS = [
  { value: 'on_create', label: 'Record is Created' },
  { value: 'on_update', label: 'Record is Modified' },
  { value: 'on_delete', label: 'Record is Deleted' },
  { value: 'on_status_change', label: 'Field is Modified' },
  { value: 'on_create_or_update', label: 'Record is Created or Modified' },
];

interface WorkflowRecord {
  id: string;
  name: string;
  module: string;
  trigger_event: string;
  is_active: boolean;
  updated_at: string;
  description?: string;
}

export default function WorkflowRulesSettingsPage() {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [step, setStep] = useState(1); // 1 = basic info, 2 = conditions
  const [form] = Form.useForm();

  const { data, isLoading } = useWorkflowRules({ page: 1, take: 50, search } as Record<string, unknown> & { page: number; take: number });
  const createRule = useCreateWorkflowRule();
  const deleteRule = useDeleteWorkflowRule();
  const updateRule = useUpdateWorkflowRule();

  const rules = ((data?.data || []) as WorkflowRecord[]).filter((r) => {
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
        trigger_event: values.trigger_event || 'on_create',
        conditions: {},
        actions: {},
        is_active: true,
      });
      setCreateModalOpen(false);
      form.resetFields();
      setStep(1);
    } catch {}
  };

  const handleCloseModal = () => {
    setCreateModalOpen(false);
    form.resetFields();
    setStep(1);
  };

  const textPrimary = isDark ? '#e5e7eb' : '#1a1a2e';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';

  const columns: ColumnsType<WorkflowRecord> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <div>
          <Text
            strong
            style={{ color: '#2f54eb', cursor: 'pointer', fontSize: 13 }}
            onClick={() => navigate(`/settings/automation/workflow-rules/${record.id}`)}
          >
            {name}
          </Text>
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
      render: (_: unknown, record: WorkflowRecord) => (
        <Switch
          size="small"
          checked={record.is_active}
          onChange={(checked) => updateRule.mutate({ id: record.id, is_active: checked })}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 48,
      render: (_: unknown, record: WorkflowRecord) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'edit',
                label: 'Edit',
                icon: <EditOutlined />,
                onClick: () => navigate(`/settings/automation/workflow-rules/${record.id}/edit`),
              },
              { type: 'divider' },
              {
                key: 'delete',
                label: 'Delete',
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () =>
                  Modal.confirm({
                    title: 'Delete Workflow Rule?',
                    content: `Are you sure you want to delete "${record.name}"?`,
                    okType: 'danger',
                    onOk: () => deleteRule.mutate(record.id),
                  }),
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
              Workflow rules
            </Title>
            <Text style={{ color: textSecondary, fontSize: 13 }}>
              Workflow rules allow you to perform certain automatic actions on specific records based on the filter criteria.
              Workflow automations can send emails, update fields, create records and much more.
            </Text>
          </div>
          <Button
            type="link"
            style={{ color: textSecondary, flexShrink: 0, padding: 0 }}
            icon={<span style={{ fontSize: 14 }}>?</span>}
          >
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
            Create Workflow
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={rules}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Text style={{ color: textSecondary }}>No Records Found</Text>
              }
            />
          ),
        }}
        style={{ borderRadius: 8, overflow: 'hidden' }}
      />

      {/* Create Workflow Modal */}
      <Modal
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#00a86b' }} />
            <span>Create New Rule</span>
          </Space>
        }
        open={createModalOpen}
        onCancel={handleCloseModal}
        width={520}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {step === 2 && (
              <Button onClick={() => setStep(1)}>Back</Button>
            )}
            <Button onClick={handleCloseModal}>Cancel</Button>
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
                label="When to trigger"
                name="trigger_event"
                rules={[{ required: true, message: 'Please select a trigger' }]}
                initialValue="on_create"
              >
                <Select options={TRIGGER_EVENTS} />
              </Form.Item>
              <Form.Item label="Conditions" extra="Define filter criteria for when this rule applies">
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
                  No conditions added — rule applies to all records
                  <br />
                  <Button type="link" size="small" style={{ marginTop: 4 }}>
                    + Add Condition
                  </Button>
                </div>
              </Form.Item>
              <Form.Item label="Actions" extra="What should happen when this rule triggers">
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
