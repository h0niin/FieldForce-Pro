import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Space,
  Tabs,
  Alert,
  Divider,
  Select,
  Tag,
  Typography,
} from 'antd';
import {
  CreditCardOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ApiOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import PageHeader from '@/components/common/PageHeader';
import { useNotificationStore } from '@/store/notification.store';

const { TextArea } = Input;
const { Text } = Typography;

interface GatewayConfig {
  enabled: boolean;
  test_mode: boolean;
  api_key: string;
  api_secret: string;
  webhook_secret?: string;
  currency: string;
  auto_capture: boolean;
}

export default function PaymentGatewaySettingsPage() {
  const { t } = useTranslation();
  const [stripeForm] = Form.useForm();
  const [squareForm] = Form.useForm();
  const [paypalForm] = Form.useForm();
  const [authorizeForm] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const addNotification = useNotificationStore((s) => s.add);

  // Mock data - replace with actual API calls
  const [stripeConfig, setStripeConfig] = useState<GatewayConfig>({
    enabled: true,
    test_mode: true,
    api_key: 'pk_test_*********************',
    api_secret: 'sk_test_*********************',
    webhook_secret: 'whsec_*********************',
    currency: 'USD',
    auto_capture: true,
  });

  const handleSaveStripe = async (values: any) => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStripeConfig(values);
      addNotification({ type: 'success', message: t('paymentGatewaySettings.stripeSaved') });
    } catch (error) {
      addNotification({ type: 'error', message: t('paymentGatewaySettings.saveFailed') });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSquare = async (values: any) => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addNotification({ type: 'success', message: t('paymentGatewaySettings.squareSaved') });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayPal = async (values: any) => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addNotification({ type: 'success', message: t('paymentGatewaySettings.paypalSaved') });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAuthorize = async (values: any) => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addNotification({ type: 'success', message: t('paymentGatewaySettings.authorizeSaved') });
    } finally {
      setSaving(false);
    }
  };

  const StripeSettings = () => (
    <Form
      form={stripeForm}
      layout="vertical"
      onFinish={handleSaveStripe}
      initialValues={stripeConfig}
    >
      <Alert
        message={
          <Space>
            {stripeConfig.enabled ? (
              <>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <span>{t('paymentGatewaySettings.stripeEnabledDesc')}</span>
              </>
            ) : (
              <>
                <WarningOutlined style={{ color: '#faad14' }} />
                <span>{t('paymentGatewaySettings.stripeDisabledDesc')}</span>
              </>
            )}
          </Space>
        }
        type={stripeConfig.enabled ? 'success' : 'warning'}
        showIcon={false}
        style={{ marginBottom: 24 }}
      />

      <Form.Item name="enabled" label={t('paymentGatewaySettings.enableStripe')} valuePropName="checked">
        <Switch checkedChildren={t('paymentGatewaySettings.enabled')} unCheckedChildren={t('paymentGatewaySettings.disabled')} />
      </Form.Item>

      <Form.Item name="test_mode" label={t('paymentGatewaySettings.testMode')} valuePropName="checked">
        <Switch checkedChildren={t('paymentGatewaySettings.test')} unCheckedChildren={t('paymentGatewaySettings.live')} />
      </Form.Item>

      <Divider />

      <Form.Item
        name="api_key"
        label={t('paymentGatewaySettings.publishableKey')}
        rules={[{ required: true, message: t('paymentGatewaySettings.apiKeyRequired') }]}
      >
        <Input.Password placeholder={t('paymentGatewaySettings.publishableKeyPlaceholder')} />
      </Form.Item>

      <Form.Item
        name="api_secret"
        label={t('paymentGatewaySettings.secretKey')}
        rules={[{ required: true, message: t('paymentGatewaySettings.secretKeyRequired') }]}
      >
        <Input.Password placeholder={t('paymentGatewaySettings.secretKeyPlaceholder')} />
      </Form.Item>

      <Form.Item name="webhook_secret" label={t('paymentGatewaySettings.webhookSecret')}>
        <Input.Password placeholder={t('paymentGatewaySettings.webhookSecretPlaceholder')} />
      </Form.Item>

      <Divider />

      <Form.Item name="currency" label={t('paymentGatewaySettings.defaultCurrency')}>
        <Select>
          <Select.Option value="USD">{t('paymentGatewaySettings.currencyUSD')}</Select.Option>
          <Select.Option value="EUR">{t('paymentGatewaySettings.currencyEUR')}</Select.Option>
          <Select.Option value="GBP">{t('paymentGatewaySettings.currencyGBP')}</Select.Option>
          <Select.Option value="CAD">{t('paymentGatewaySettings.currencyCAD')}</Select.Option>
          <Select.Option value="AUD">{t('paymentGatewaySettings.currencyAUD')}</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="auto_capture" label={t('paymentGatewaySettings.autoCaptureLabel')} valuePropName="checked">
        <Switch
          checkedChildren={t('paymentGatewaySettings.autoCapture')}
          unCheckedChildren={t('paymentGatewaySettings.manualCapture')}
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
          {t('paymentGatewaySettings.saveStripe')}
        </Button>
      </Form.Item>
    </Form>
  );

  const SquareSettings = () => (
    <Form form={squareForm} layout="vertical" onFinish={handleSaveSquare}>
      <Alert
        message={t('paymentGatewaySettings.squareIntegration')}
        description={t('paymentGatewaySettings.squareIntegrationDesc')}
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form.Item name="enabled" label={t('paymentGatewaySettings.enableSquare')} valuePropName="checked">
        <Switch checkedChildren={t('paymentGatewaySettings.enabled')} unCheckedChildren={t('paymentGatewaySettings.disabled')} />
      </Form.Item>

      <Form.Item name="test_mode" label={t('paymentGatewaySettings.sandboxMode')} valuePropName="checked">
        <Switch checkedChildren={t('paymentGatewaySettings.sandbox')} unCheckedChildren={t('paymentGatewaySettings.production')} />
      </Form.Item>

      <Form.Item name="application_id" label={t('paymentGatewaySettings.applicationId')}>
        <Input.Password placeholder={t('paymentGatewaySettings.applicationIdPlaceholder')} />
      </Form.Item>

      <Form.Item name="access_token" label={t('paymentGatewaySettings.accessToken')}>
        <Input.Password placeholder={t('paymentGatewaySettings.accessTokenPlaceholder')} />
      </Form.Item>

      <Form.Item name="location_id" label={t('paymentGatewaySettings.locationId')}>
        <Input placeholder={t('paymentGatewaySettings.locationIdPlaceholder')} />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
          {t('paymentGatewaySettings.saveSquare')}
        </Button>
      </Form.Item>
    </Form>
  );

  const PayPalSettings = () => (
    <Form form={paypalForm} layout="vertical" onFinish={handleSavePayPal}>
      <Alert
        message={t('paymentGatewaySettings.paypalIntegration')}
        description={t('paymentGatewaySettings.paypalIntegrationDesc')}
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form.Item name="enabled" label={t('paymentGatewaySettings.enablePaypal')} valuePropName="checked">
        <Switch checkedChildren={t('paymentGatewaySettings.enabled')} unCheckedChildren={t('paymentGatewaySettings.disabled')} />
      </Form.Item>

      <Form.Item name="test_mode" label={t('paymentGatewaySettings.sandboxMode')} valuePropName="checked">
        <Switch checkedChildren={t('paymentGatewaySettings.sandbox')} unCheckedChildren={t('paymentGatewaySettings.live')} />
      </Form.Item>

      <Form.Item name="client_id" label={t('paymentGatewaySettings.clientId')}>
        <Input.Password placeholder={t('paymentGatewaySettings.clientIdPlaceholder')} />
      </Form.Item>

      <Form.Item name="client_secret" label={t('paymentGatewaySettings.clientSecret')}>
        <Input.Password placeholder={t('paymentGatewaySettings.clientSecretPlaceholder')} />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
          {t('paymentGatewaySettings.savePaypal')}
        </Button>
      </Form.Item>
    </Form>
  );

  const AuthorizeNetSettings = () => (
    <Form form={authorizeForm} layout="vertical" onFinish={handleSaveAuthorize}>
      <Alert
        message={t('paymentGatewaySettings.authorizeIntegration')}
        description={t('paymentGatewaySettings.authorizeIntegrationDesc')}
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form.Item name="enabled" label={t('paymentGatewaySettings.enableAuthorize')} valuePropName="checked">
        <Switch checkedChildren={t('paymentGatewaySettings.enabled')} unCheckedChildren={t('paymentGatewaySettings.disabled')} />
      </Form.Item>

      <Form.Item name="test_mode" label={t('paymentGatewaySettings.sandboxMode')} valuePropName="checked">
        <Switch checkedChildren={t('paymentGatewaySettings.sandbox')} unCheckedChildren={t('paymentGatewaySettings.production')} />
      </Form.Item>

      <Form.Item name="api_login_id" label={t('paymentGatewaySettings.apiLoginId')}>
        <Input placeholder={t('paymentGatewaySettings.apiLoginIdPlaceholder')} />
      </Form.Item>

      <Form.Item name="transaction_key" label={t('paymentGatewaySettings.transactionKey')}>
        <Input.Password placeholder={t('paymentGatewaySettings.transactionKeyPlaceholder')} />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
          {t('paymentGatewaySettings.saveAuthorize')}
        </Button>
      </Form.Item>
    </Form>
  );

  const tabItems = [
    {
      key: 'stripe',
      label: (
        <Space>
          <CreditCardOutlined />
          {t('paymentGatewaySettings.stripe')}
          {stripeConfig.enabled && <Tag color="success">{t('paymentGatewaySettings.active')}</Tag>}
        </Space>
      ),
      children: <StripeSettings />,
    },
    {
      key: 'square',
      label: (
        <Space>
          <ApiOutlined />
          {t('paymentGatewaySettings.square')}
        </Space>
      ),
      children: <SquareSettings />,
    },
    {
      key: 'paypal',
      label: (
        <Space>
          <DollarOutlined />
          {t('paymentGatewaySettings.paypal')}
        </Space>
      ),
      children: <PayPalSettings />,
    },
    {
      key: 'authorize',
      label: (
        <Space>
          <CreditCardOutlined />
          {t('paymentGatewaySettings.authorize')}
        </Space>
      ),
      children: <AuthorizeNetSettings />,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('paymentGatewaySettings.title')}
        subtitle={t('paymentGatewaySettings.subtitle')}
      />

      <Alert
        message={t('paymentGatewaySettings.securityNotice')}
        description={t('paymentGatewaySettings.securityNoticeDesc')}
        type="warning"
        showIcon
        closable
        style={{ marginBottom: 24 }}
      />

      <Card>
        <Tabs items={tabItems} defaultActiveKey="stripe" />
      </Card>
    </div>
  );
}