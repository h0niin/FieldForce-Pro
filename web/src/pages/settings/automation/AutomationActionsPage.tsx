import { useState } from 'react';
import {
  Typography,
  Button,
  Card,
  Switch,
  Tag,
  Input,
  Modal,
  Form,
  Select,
  Space,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  MailOutlined,
  EditOutlined,
  PlusCircleOutlined,
  BellOutlined,
  ApiOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useUiStore } from '@/store/ui.store';
import {
  useAutomationActions,
  useCreateAutomationAction,
  useUpdateAutomationAction,
  useDeleteAutomationAction,
} from '@/hooks/use-automation-actions';
import { AutomationAction } from '@/types/models.types';

const { Title, Text } = Typography;

const ACTION_TYPE_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  email: { icon: <MailOutlined />, color: '#2f54eb', label: 'Send Email' },
  update_field: { icon: <EditOutlined />, color: '#fa8c16', label: 'Update Field' },
  create_record: { icon: <PlusCircleOutlined />, color: '#52c41a', label: 'Create Record' },
  notification: { icon: <BellOutlined />, color: '#722ed1', label: 'Send Notification' },
  webhook: { icon: <ApiOutlined />, color: '#13c2c2', label: 'Call Webhook' },
};export default function AutomationActionsPage() {
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === 'dark';

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form] = Form.useForm();

  const textPrimary = isDark ? '#e5e7eb' : '#1a1a2e';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const cardBg = isDark ? '#1f1f1f' : '#ffffff';
  const borderColor = isDark ? '#303030' : '#e8e8e8';

  const { data: actionsData, isLoading } = useAutomationActions();
  const createAction = useCreateAutomationAction();
  const updateAction = useUpdateAutomationAction();
  const deleteAction = useDeleteAutomationAction();

  const actions = (actionsData?.data || []) as AutomationAction[];

  const filtered = actions.filter((a) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) &&
      !(a.description || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && a.type !== typeFilter) return false;
    return true;
  });

  const handleToggle = (id: string, checked: boolean) => {
    updateAction.mutate({ id, is_enabled: checked });
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await createAction.mutateAsync({
        name: values.name,
        type: values.type,
        description: values.description || '',
        config: {},
        is_enabled: true,
      });
      setCreateModalOpen(false);
      form.resetFields();
    } catch {}
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0, color: textPrimary }}>
              Actions
            </Title>
            <Text style={{ color: textSecondary, fontSize: 13 }}>
              Define reusable action templates that can be triggered by workflow rules and time-based rules.
              Actions include sending emails, updating fields, creating records, and more.
            </Text>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, marginTop: 16, flexWrap: 'wrap' }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          placeholder="Search actions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 240, borderRadius: 6 }}
          allowClear
        />
        <Select
          placeholder="All types"
          style={{ width: 160 }}
          value={typeFilter}
          onChange={(v) => setTypeFilter(v)}
          allowClear
          options={Object.entries(ACTION_TYPE_META).map(([k, v]) => ({
            label: v.label,
            value: k,
          }))}
        />
        <div style={{ marginLeft: 'auto' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ background: '#00a86b', borderColor: '#00a86b', borderRadius: 6 }}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Action
          </Button>
        </div>
      </div>

      {/* Action Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: textSecondary, padding: 60 }}>
            No actions found
          </div>
        ) : (
          filtered.map((action) => {
            const meta = ACTION_TYPE_META[action.type] || ACTION_TYPE_META.email;
            return (
              <div
                key={action.id}
                style={{
                  background: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 10,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  opacity: action.is_enabled ? 1 : 0.65,
                  transition: 'box-shadow 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: `${meta.color}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    color: meta.color,
                    flexShrink: 0,
                  }}
                >
                  {meta.icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <Text strong style={{ fontSize: 14, color: textPrimary }}>{action.name}</Text>
                    <Tag
                      style={{
                        fontSize: 11,
                        color: meta.color,
                        borderColor: `${meta.color}40`,
                        background: `${meta.color}10`,
                      }}
                    >
                      {meta.label}
                    </Tag>
                  </div>
                  <Text style={{ fontSize: 12, color: textSecondary }}>{action.description}</Text>
                  {action.usages > 0 && (
                    <div style={{ marginTop: 4 }}>
                      <Text style={{ fontSize: 11, color: textSecondary }}>
                        <ReloadOutlined style={{ marginRight: 4 }} />
                        Used in {action.usages} rule{action.usages !== 1 ? 's' : ''}
                      </Text>
                    </div>
                  )}
                </div>

                {/* Toggle */}
                <Switch
                  checked={action.is_enabled}
                  onChange={(checked) => handleToggle(action.id, checked)}
                  size="small"
                />
              </div>
            );
          })
        )}
      </div>

      {/* Create Action Modal */}
      <Modal
        title={
          <Space>
            <PlusCircleOutlined style={{ color: '#00a86b' }} />
            <span>Create Action</span>
          </Space>
        }
        open={createModalOpen}
        onCancel={() => { setCreateModalOpen(false); form.resetFields(); }}
        onOk={handleCreate}
        okText="Create"
        okButtonProps={{ style: { background: '#00a86b', borderColor: '#00a86b' }, loading: createAction.isPending }}
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Action Type"
            name="type"
            rules={[{ required: true, message: 'Please select an action type' }]}
          >
            <Select
              placeholder="Select action type"
              options={Object.entries(ACTION_TYPE_META).map(([k, v]) => ({
                label: (
                  <Space>
                    <span style={{ color: v.color }}>{v.icon}</span>
                    {v.label}
                  </Space>
                ),
                value: k,
              }))}
            />
          </Form.Item>
          <Form.Item
            label="Action Name"
            name="name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input placeholder="e.g. Send Welcome Email" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} placeholder="What does this action do?" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
