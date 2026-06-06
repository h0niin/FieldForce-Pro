import { useState } from 'react';
import {
  Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select,
  Typography, Card, Row, Col, Statistic, Alert,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EditOutlined, DollarOutlined, GroupOutlined,
  CheckCircleOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import PageHeader from '@/components/common/PageHeader';
import { useSubscriptionPlans, useUpdateSubscriptionPlan } from '@/hooks/use-super-admin';
import type { SubscriptionPlanSummary } from '@/api/super-admin.api';
import { formatFeatureName } from '@/utils/pricing';

const { Text } = Typography;

export default function PricingPlansPage() {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanSummary | null>(null);
  const [form] = Form.useForm();

  const { data: plans = [], isLoading } = useSubscriptionPlans();
  const updatePlan = useUpdateSubscriptionPlan();

  const handleOpenEdit = (plan: SubscriptionPlanSummary) => {
    setSelectedPlan(plan);
    form.setFieldsValue({
      name: plan.name,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      currency: plan.currency || 'USD',
      max_total_users: plan.max_total_users,
      max_appointments_monthly: plan.max_appointments_monthly,
      features: plan.features || [],
    });
    setEditModalOpen(true);
  };

  const handleSave = () => {
    if (!selectedPlan) return;
    form.validateFields().then((values) => {
      updatePlan.mutate(
        {
          id: selectedPlan.id,
          ...values,
        },
        {
          onSuccess: () => {
            setEditModalOpen(false);
            setSelectedPlan(null);
          },
        }
      );
    });
  };

  const stats = {
    total: plans.length,
    usd: plans.filter((p) => (p.currency || 'USD') === 'USD').length,
    inr: plans.filter((p) => p.currency === 'INR').length,
  };

  const columns: ColumnsType<SubscriptionPlanSummary> = [
    {
      title: 'Plan Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong style={{ fontSize: 15 }}>{name}</Text>,
    },
    {
      title: 'Monthly Price',
      dataIndex: 'price_monthly',
      key: 'price_monthly',
      render: (val: number, record) => {
        const symbol = record.currency === 'INR' ? '₹' : '$';
        return <Text strong style={{ color: '#2563eb' }}>{symbol}{val.toLocaleString()}</Text>;
      },
    },
    {
      title: 'Yearly Price',
      dataIndex: 'price_yearly',
      key: 'price_yearly',
      render: (val: number, record) => {
        const symbol = record.currency === 'INR' ? '₹' : '$';
        return <Text type="secondary">{symbol}{val.toLocaleString()}</Text>;
      },
    },
    {
      title: 'Currency',
      dataIndex: 'currency',
      key: 'currency',
      render: (cur: string) => <Tag color={cur === 'INR' ? 'purple' : 'cyan'}>{cur || 'USD'}</Tag>,
    },
    {
      title: 'User Limit',
      dataIndex: 'max_total_users',
      key: 'max_total_users',
      render: (limit: number | null) =>
        limit ? <Tag color="blue">{limit} users</Tag> : <Tag color="gold">Unlimited</Tag>,
    },
    {
      title: 'Appointment Limit',
      dataIndex: 'max_appointments_monthly',
      key: 'max_appointments_monthly',
      render: (limit: number | null) =>
        limit ? <Tag color="purple">{limit} appointments/mo</Tag> : <Tag color="gold">Unlimited</Tag>,
    },
    {
      title: 'Features Included',
      dataIndex: 'features',
      key: 'features',
      width: '35%',
      render: (features: string[] | undefined) => (
        <Space size={[0, 4]} wrap>
          {features && features.length > 0 ? (
            features.map((f) => (
              <Tag key={f} style={{ borderRadius: 4 }}>
                {formatFeatureName(f)}
              </Tag>
            ))
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          icon={<EditOutlined />}
          size="small"
          style={{ background: '#722ed1', borderColor: '#722ed1', color: '#fff' }}
          onClick={() => handleOpenEdit(record)}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Pricing & Plans"
        subtitle="Manage default subscription prices, currencies, user limits, and features"
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Total Active Plans"
              value={stats.total}
              prefix={<GroupOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title="USD Base Plans"
              value={stats.usd}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title="INR Base Plans"
              value={stats.inr}
              prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Alert
        message="Uniform Pricing & Switcher"
        description="Subscription plans defined here are presented to registering companies. If a customer toggles their preferred currency on the landing or signup pages, a converted rate is dynamically calculated if the plan's default currency doesn't match."
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 24 }}
      />

      <Card>
        <Table
          columns={columns}
          dataSource={plans}
          rowKey="id"
          loading={isLoading}
          pagination={false}
        />
      </Card>

      <Modal
        title={`Edit Plan: ${selectedPlan?.name}`}
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          setSelectedPlan(null);
        }}
        onOk={handleSave}
        confirmLoading={updatePlan.isPending}
        okText="Save Changes"
        width={540}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Plan Display Name"
                rules={[{ required: true, message: 'Please enter plan name' }]}
              >
                <Input placeholder="e.g. Basic" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="currency"
                label="Base Currency"
                rules={[{ required: true, message: 'Please select base currency' }]}
              >
                <Select
                  options={[
                    { label: 'US Dollar (USD)', value: 'USD' },
                    { label: 'Indian Rupee (INR)', value: 'INR' },
                    { label: 'Euro (EUR) - Ireland', value: 'EUR' },
                    { label: 'UAE Dirham (AED)', value: 'AED' },
                    { label: 'Saudi Riyal (SAR)', value: 'SAR' },
                    { label: 'Qatari Riyal (QAR)', value: 'QAR' },
                    { label: 'Kuwaiti Dinar (KWD)', value: 'KWD' },
                    { label: 'Omani Rial (OMR)', value: 'OMR' },
                    { label: 'Bahraini Dinar (BHD)', value: 'BHD' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price_monthly"
                label="Monthly Price"
                rules={[{ required: true, message: 'Monthly price is required' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} precision={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="price_yearly"
                label="Yearly Price"
                rules={[{ required: true, message: 'Yearly price is required' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} precision={2} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="max_total_users"
                label="Max User Limit"
                extra="Leave empty for unlimited users"
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="200 (Default)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="max_appointments_monthly"
                label="Max Monthly Appointments"
                extra="Leave empty for unlimited appointments"
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="Unlimited" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="features"
            label="Plan Features"
            extra="Press enter to add custom feature keys"
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Add features (e.g. scheduling, invoices)"
              tokenSeparators={[',']}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
