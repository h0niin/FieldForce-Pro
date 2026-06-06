import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Row, Col, Card, Statistic, Tag, Button, Descriptions, Space,
  Alert, Typography, Skeleton, Popconfirm, Progress, Modal, Form,
  Select, InputNumber,
} from 'antd';
import {
  ArrowLeftOutlined, TeamOutlined, FileTextOutlined,
  ToolOutlined, DollarOutlined, CheckCircleOutlined,
  StopOutlined, PlayCircleOutlined, ClusterOutlined, EditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { DatePicker } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  useTenantOverview, useSuspendTenant, useActivateTenant,
  useTenantUsage, useSubscriptionPlans, useUpdateTenantSubscription,
} from '@/hooks/use-super-admin';
import { formatDateTime } from '@/utils/format-date';
import { CURRENCY_SYMBOLS, CurrencyType } from '@/utils/pricing';

const { Title, Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
  trial: 'blue',
  active: 'success',
  suspended: 'error',
  cancelled: 'default',
  expired: 'warning',
};

function getProgressStatus(pct: number): 'normal' | 'exception' | 'active' {
  if (pct > 90) return 'exception';
  return 'normal';
}

function getProgressColor(pct: number) {
  if (pct > 90) return '#ff4d4f';
  if (pct > 70) return '#faad14';
  return '#52c41a';
}

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [subForm] = Form.useForm();
  const { t } = useTranslation();

  const { data: tenant, isLoading } = useTenantOverview(id!);
  const { data: usage } = useTenantUsage(id!);
  const { data: plans } = useSubscriptionPlans();
  const suspendTenant = useSuspendTenant();
  const activateTenant = useActivateTenant();
  const updateSubscription = useUpdateTenantSubscription();

  const handleOpenSubModal = () => {
    subForm.setFieldsValue({
      plan_id: tenant?.subscription_plan_id ?? undefined,
      subscription_status: tenant?.subscription_status ?? 'trial',
      subscription_end: tenant?.subscription_end ? dayjs(tenant.subscription_end) : null,
      max_users_override: tenant?.custom_limits?.max_total_users ?? null,
      max_appointments_override: tenant?.custom_limits?.max_appointments_monthly ?? null,
    });
    setSubModalOpen(true);
  };

  const handleSubModalOk = () => {
    subForm.validateFields().then((values) => {
      updateSubscription.mutate(
        {
          id: id!,
          plan_id: values.plan_id || undefined,
          subscription_status: values.subscription_status || undefined,
          subscription_end: values.subscription_end
            ? (values.subscription_end as ReturnType<typeof dayjs>).toISOString()
            : null,
          max_users_override: values.max_users_override ?? null,
          max_appointments_override: values.max_appointments_override ?? null,
        },
        {
          onSuccess: () => setSubModalOpen(false),
        },
      );
    });
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (!tenant) {
    return (
      <Alert
        type="error"
        message={t('tenantDetail.tenantNotFound')}
        action={<Button onClick={() => navigate('/admin/tenants')}>{t('tenantDetail.backToTenants')}</Button>}
      />
    );
  }

  const usageCurrent = usage?.usage?.total_users?.current ?? tenant.user_count;
  const usageLimit = usage?.usage?.total_users?.limit;
  const usagePct = usageLimit ? Math.round((usageCurrent / usageLimit) * 100) : 0;

  const apptsCurrent = usage?.usage?.appointments?.current ?? 0;
  const apptsLimit = usage?.usage?.appointments?.limit ?? null;
  const apptsPct = apptsLimit ? Math.round((apptsCurrent / apptsLimit) * 100) : 0;

  return (
    <div>
      {/* Exit Banner */}
      <Alert
        type="warning"
        showIcon
        icon={<ClusterOutlined />}
        message={
          <Space>
            <Text strong>{t('tenantDetail.superAdminViewingTenant', { tenantName: tenant.name })}</Text>
            <Text type="secondary">{t('tenantDetail.readOnlyView')}</Text>
          </Space>
        }
        action={
          <Button
            type="primary"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin/tenants')}
          >
            {t('tenantDetail.exitTenantView')}
          </Button>
        }
        style={{ marginBottom: 24 }}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>{tenant.name}</Title>
          <Text type="secondary">/{tenant.slug}</Text>
        </div>
        <Space>
          {tenant.is_active ? (
            <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontSize: 14, padding: '4px 12px' }}>{t('tenantDetail.active')}</Tag>
          ) : (
            <Tag icon={<StopOutlined />} color="error" style={{ fontSize: 14, padding: '4px 12px' }}>{t('tenantDetail.suspended')}</Tag>
          )}
          {tenant.is_active ? (
            <Popconfirm
              title={t('tenantDetail.suspendTenantTitle', { tenantName: tenant.name })}
              description={t('tenantDetail.suspendTenantDescription')}
              onConfirm={() => suspendTenant.mutate(tenant.id)}
              okText={t('tenantDetail.suspend')}
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<StopOutlined />}>{t('tenantDetail.suspendTenant')}</Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title={t('tenantDetail.reactivateTenantTitle', { tenantName: tenant.name })}
              onConfirm={() => activateTenant.mutate(tenant.id)}
              okText={t('tenantDetail.reactivate')}
            >
              <Button icon={<PlayCircleOutlined />} style={{ color: '#52c41a', borderColor: '#52c41a' }}>
                {t('tenantDetail.reactivateTenant')}
              </Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      {/* Stats Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('tenantDetail.users')}
              value={tenant.user_count}
              prefix={<TeamOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('tenantDetail.serviceRequests')}
              value={tenant.service_request_count}
              prefix={<FileTextOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('tenantDetail.workOrders')}
              value={tenant.work_order_count}
              prefix={<ToolOutlined style={{ color: '#13c2c2' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('tenantDetail.invoices')}
              value={tenant.invoice_count}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Subscription Section */}
      <Card
        title={t('tenantDetail.subscription')}
        style={{ marginBottom: 24 }}
        extra={
          <Button icon={<EditOutlined />} onClick={handleOpenSubModal}>
            {t('tenantDetail.updateSubscription')}
          </Button>
        }
      >
        <Row gutter={[24, 16]}>
          <Col xs={24} sm={8}>
            <Text type="secondary" style={{ fontSize: 12 }}>{t('tenantDetail.plan')}</Text>
            <div style={{ marginTop: 4 }}>
              <Text strong>{usage?.plan_name ?? tenant.subscription_plan}</Text>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <Text type="secondary" style={{ fontSize: 12 }}>{t('tenantDetail.status')}</Text>
            <div style={{ marginTop: 4 }}>
              <Tag color={STATUS_COLORS[tenant.subscription_status ?? 'trial'] ?? 'default'}>
                {t(`tenantDetail.status.${tenant.subscription_status ?? 'trial'}`)}
              </Tag>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <Text type="secondary" style={{ fontSize: 12 }}>{t('tenantDetail.subscriptionEnd')}</Text>
            <div style={{ marginTop: 4 }}>
              <Text>{tenant.subscription_end ? formatDateTime(tenant.subscription_end) : '—'}</Text>
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('tenantDetail.usersUsage', { current: usageCurrent, limit: usageLimit ?? '∞' })}
            </Text>
            {usageLimit ? (
              <Progress
                percent={usagePct}
                strokeColor={getProgressColor(usagePct)}
                status={getProgressStatus(usagePct)}
                style={{ marginTop: 4 }}
              />
            ) : (
              <div style={{ marginTop: 4 }}>
                <Text type="secondary">{t('tenantDetail.unlimitedUsers')}</Text>
              </div>
            )}
          </Col>
          <Col xs={24} sm={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Monthly Appointments: {apptsCurrent} / {apptsLimit ?? '∞'}
            </Text>
            {apptsLimit ? (
              <Progress
                percent={apptsPct}
                strokeColor={getProgressColor(apptsPct)}
                status={getProgressStatus(apptsPct)}
                style={{ marginTop: 4 }}
              />
            ) : (
              <div style={{ marginTop: 4 }}>
                <Text type="secondary">Unlimited Appointments</Text>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      {/* Tenant Details */}
      <Card title={t('tenantDetail.tenantInformation')} style={{ marginBottom: 24 }}>
        <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
          <Descriptions.Item label={t('tenantDetail.companyName')}>{tenant.name}</Descriptions.Item>
          <Descriptions.Item label={t('tenantDetail.slug')}>{tenant.slug}</Descriptions.Item>
          <Descriptions.Item label={t('tenantDetail.adminEmail')}>
            {tenant.admin_email ? <Text copyable>{tenant.admin_email}</Text> : '—'}
          </Descriptions.Item>
          <Descriptions.Item label={t('tenantDetail.adminName')}>{tenant.admin_name ?? '—'}</Descriptions.Item>
          <Descriptions.Item label={t('tenantDetail.subscriptionPlan')}>
            <Tag color={tenant.subscription_plan === 'enterprise' ? 'gold' : tenant.subscription_plan === 'professional' ? 'blue' : 'default'}>
              {t(`tenantDetail.plan.${tenant.subscription_plan}`)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('tenantDetail.maxUsers')}>{tenant.max_users}</Descriptions.Item>
          <Descriptions.Item label={t('tenantDetail.domain')}>{tenant.domain ?? '—'}</Descriptions.Item>
          <Descriptions.Item label={t('tenantDetail.status')}>
            {tenant.is_active
              ? <Tag color="success">{t('tenantDetail.active')}</Tag>
              : <Tag color="error">{t('tenantDetail.suspended')}</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label={t('tenantDetail.registered')}>{formatDateTime(tenant.created_at)}</Descriptions.Item>
          <Descriptions.Item label={t('tenantDetail.lastUpdated')}>{formatDateTime(tenant.updated_at)}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Exit Footer */}
      <div style={{ textAlign: 'center', paddingTop: 8 }}>
        <Button
          size="large"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/tenants')}
        >
          {t('tenantDetail.exitTenantViewAndReturn')}
        </Button>
      </div>

      {/* Update Subscription Modal */}
      <Modal
        open={subModalOpen}
        title={t('tenantDetail.updateSubscriptionModalTitle')}
        okText={t('common.saveChanges')}
        cancelText={t('common.cancel')}
        confirmLoading={updateSubscription.isPending}
        onOk={handleSubModalOk}
        onCancel={() => setSubModalOpen(false)}
        width={480}
      >
        <Form form={subForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="plan_id" label={t('tenantDetail.subscriptionPlanLabel')}>
            <Select
              placeholder={t('tenantDetail.selectAPlan')}
              allowClear
              options={plans?.map((p) => {
                const sym = CURRENCY_SYMBOLS[(p.currency || 'USD') as CurrencyType] || '$';
                return {
                  label: `${p.name} (${sym}${p.price_monthly}/mo)`,
                  value: p.id,
                };
              })}

            />
          </Form.Item>

          <Form.Item name="subscription_status" label={t('tenantDetail.statusLabel')}>
            <Select
              placeholder={t('tenantDetail.selectStatus')}
              options={[
                { label: t('tenantDetail.status.trial'), value: 'trial' },
                { label: t('tenantDetail.status.active'), value: 'active' },
                { label: t('tenantDetail.status.suspended'), value: 'suspended' },
                { label: t('tenantDetail.status.cancelled'), value: 'cancelled' },
                { label: t('tenantDetail.status.expired'), value: 'expired' },
              ]}
            />
          </Form.Item>

          <Form.Item name="subscription_end" label={t('tenantDetail.subscriptionEndDate')}>
            <DatePicker style={{ width: '100%' }} allowClear />
          </Form.Item>

          <Form.Item
            name="max_users_override"
            label={t('tenantDetail.maxUsersOverride')}
            extra={t('tenantDetail.maxUsersOverrideHint')}
          >
            <InputNumber
              min={1}
              placeholder={t('tenantDetail.exampleUsersPlaceholder')}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="max_appointments_override"
            label="Max Appointments Override"
            extra="Set custom appointments cap or leave blank to use plan default"
          >
            <InputNumber
              min={1}
              placeholder="e.g. 500"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}