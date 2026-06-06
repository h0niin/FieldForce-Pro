import { useState } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Select, InputNumber,
  Input, Tooltip, Typography, Popconfirm, Row, Col, Statistic, Alert,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, CopyOutlined, StopOutlined, DeleteOutlined,
  LinkOutlined, CheckCircleOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import PageHeader from '@/components/common/PageHeader';
import { formatDateTime } from '@/utils/format-date';
import { useSubscriptionPlans } from '@/hooks/use-super-admin';
import {
  useSubscriptionMagicLinks,
  useGenerateSubscriptionMagicLink,
  useDisableSubscriptionMagicLink,
  useDeleteSubscriptionMagicLink,
} from '@/hooks/use-subscription-magic-links';
import type { SubscriptionMagicLink } from '@/api/subscription-magic-links.api';

const { Text, Paragraph } = Typography;

const STATUS_COLOR: Record<string, string> = {
  active: 'green',
  expired: 'orange',
  used: 'blue',
  disabled: 'default',
};

export default function SubscriptionMagicLinksPage() {
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<{ url: string; plan: string } | null>(null);
  const [form] = Form.useForm();

  const { data: links = [], isLoading } = useSubscriptionMagicLinks();
  const { data: plans = [] } = useSubscriptionPlans();
  const generateLink = useGenerateSubscriptionMagicLink();
  const disableLink = useDisableSubscriptionMagicLink();
  const deleteLink = useDeleteSubscriptionMagicLink();

  const stats = {
    total: links.length,
    active: links.filter((l) => l.status === 'active').length,
    used: links.filter((l) => l.status === 'used').length,
    expired: links.filter((l) => l.status === 'expired').length,
  };

  const handleGenerate = async () => {
    const values = await form.validateFields();
    generateLink.mutate(values, {
      onSuccess: (res) => {
        const data = res.data.data!;
        const plan = plans.find((p: any) => p.id === values.plan_id);
        setGeneratedLink({ url: data.signup_url || '', plan: plan?.name || '' });
        setGenerateModalOpen(false);
        form.resetFields();
      },
    });
  };

  const columns: ColumnsType<SubscriptionMagicLink> = [
    {
      title: 'Plan',
      key: 'plan',
      render: (_, r) => {
        const symbol = r.plan?.currency === 'INR' ? '₹' : '$';
        return (
          <Space direction="vertical" size={0}>
            <Text strong>{r.plan?.name || r.plan_id}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {symbol}{r.plan?.price_monthly?.toLocaleString()}/mo
            </Text>
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: string) => (
        <Tag color={STATUS_COLOR[s] || 'default'}>
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Uses',
      key: 'uses',
      render: (_, r) => (
        <Text>
          {r.used_count} / {r.max_uses}
        </Text>
      ),
    },
    {
      title: 'Created By',
      key: 'creator',
      render: (_, r) => (
        <Text>{r.creator ? `${r.creator.first_name} ${r.creator.last_name}` : '—'}</Text>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      render: (d: string) => formatDateTime(d),
    },
    {
      title: 'Expires',
      dataIndex: 'expires_at',
      render: (d: string) => {
        const expired = new Date(d) < new Date();
        return (
          <Text type={expired ? 'danger' : 'secondary'} style={{ fontSize: 13 }}>
            {formatDateTime(d)}
          </Text>
        );
      },
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      render: (n: string) => n || <Text type="secondary">—</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_, r) => (
        <Space size="small">
          {r.status === 'active' && (
            <Tooltip title="Disable link">
              <Popconfirm
                title="Disable this link?"
                description="Users will no longer be able to use it to sign up."
                onConfirm={() => disableLink.mutate(r.id)}
                okText="Disable"
                okButtonProps={{ danger: true }}
              >
                <Button size="small" danger icon={<StopOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
          {r.status !== 'used' && (
            <Tooltip title="Delete link">
              <Popconfirm
                title="Delete this link?"
                description="This cannot be undone."
                onConfirm={() => deleteLink.mutate(r.id)}
                okText="Delete"
                okButtonProps={{ danger: true }}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Subscription Magic Links"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setGenerateModalOpen(true)}>
            Generate Link
          </Button>
        }
      />

      {/* Stats row */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Links', value: stats.total, icon: <LinkOutlined />, color: '#1890ff' },
          { label: 'Active', value: stats.active, icon: <CheckCircleOutlined />, color: '#52c41a' },
          { label: 'Used', value: stats.used, icon: <CheckCircleOutlined />, color: '#2563eb' },
          { label: 'Expired', value: stats.expired, icon: <ClockCircleOutlined />, color: '#fa8c16' },
        ].map((s) => (
          <Col xs={12} sm={6} key={s.label}>
            <Card size="small">
              <Statistic
                title={s.label}
                value={s.value}
                prefix={s.icon}
                valueStyle={{ color: s.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Links table */}
      <Card>
        <Table
          columns={columns}
          dataSource={links}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20 }}
          locale={{ emptyText: 'No magic links generated yet. Click "Generate Link" to create one.' }}
        />
      </Card>

      {/* Generate modal */}
      <Modal
        title="Generate Subscription Magic Link"
        open={generateModalOpen}
        onCancel={() => { setGenerateModalOpen(false); form.resetFields(); }}
        onOk={handleGenerate}
        confirmLoading={generateLink.isPending}
        okText="Generate Link"
        width={480}
      >
        <Form form={form} layout="vertical" initialValues={{ max_uses: 1, expires_in_days: 7 }}>
          <Form.Item
            name="plan_id"
            label="Subscription Plan"
            rules={[{ required: true, message: 'Please select a plan' }]}
          >
            <Select placeholder="Select plan" size="large">
              {(plans as any[]).map((p: any) => {
                const symbol = p.currency === 'INR' ? '₹' : '$';
                return (
                  <Select.Option key={p.id} value={p.id}>
                    <Space>
                      <Text strong>{p.name}</Text>
                      <Text type="secondary">{symbol}{p.price_monthly?.toLocaleString()}/mo</Text>
                      {p.max_total_users ? (
                        <Tag color="blue">{p.max_total_users} users</Tag>
                      ) : (
                        p.name.toLowerCase() !== 'custom' && <Tag color="gold">Unlimited users</Tag>
                      )}
                    </Space>
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="max_uses" label="Max Uses">
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expires_in_days" label="Expires In (days)">
                <InputNumber min={1} max={90} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notes (internal only)">
            <Input.TextArea rows={2} placeholder="e.g. Sent to ABC Corp on 1 June 2026" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Generated link modal */}
      <Modal
        title={<Space><CheckCircleOutlined style={{ color: '#52c41a' }} /><span>Magic Link Generated</span></Space>}
        open={!!generatedLink}
        onCancel={() => setGeneratedLink(null)}
        footer={[
          <Button key="copy" type="primary" icon={<CopyOutlined />} onClick={() => {
            navigator.clipboard.writeText(generatedLink?.url || '');
          }}>
            Copy Link
          </Button>,
          <Button key="close" onClick={() => setGeneratedLink(null)}>Close</Button>,
        ]}
        width={560}
      >
        {generatedLink && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Alert
              message={`${generatedLink.plan} onboarding link is ready`}
              description="Send this link to your prospective customer. They will use it to sign up and will automatically be placed on the selected plan."
              type="success"
              showIcon
            />
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Signup URL</Text>
              <Paragraph
                copyable={{ text: generatedLink.url }}
                style={{
                  marginTop: 4,
                  padding: '8px 12px',
                  background: '#f5f5f5',
                  borderRadius: 6,
                  fontFamily: 'monospace',
                  fontSize: 13,
                  wordBreak: 'break-all',
                }}
              >
                {generatedLink.url}
              </Paragraph>
            </div>
            <Alert
              message="This link is single-use and expires in 7 days by default."
              type="info"
              showIcon
            />
          </Space>
        )}
      </Modal>
    </div>
  );
}
