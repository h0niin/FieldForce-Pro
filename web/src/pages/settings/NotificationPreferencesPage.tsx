import { useState } from 'react';
import { Card, Form, Switch, Button, Space, Divider, Typography, Select, TimePicker, Alert } from 'antd';
import { SaveOutlined, BellOutlined, MailOutlined, MessageOutlined, MobileOutlined } from '@ant-design/icons';
import PageHeader from '@/components/common/PageHeader';
import { useNotificationStore } from '@/store/notification.store';
import dayjs, { type Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next'; // Rule 1

const { Title, Text } = Typography;

interface NotificationPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;

  // Event-specific preferences
  work_order_assigned: { email: boolean; sms: boolean; push: boolean };
  work_order_completed: { email: boolean; sms: boolean; push: boolean };
  appointment_scheduled: { email: boolean; sms: boolean; push: boolean };
  appointment_reminder: { email: boolean; sms: boolean; push: boolean };
  estimate_approved: { email: boolean; sms: boolean; push: boolean };
  invoice_generated: { email: boolean; sms: boolean; push: boolean };
  payment_received: { email: boolean; sms: boolean; push: boolean };

  // Quiet hours
  quiet_hours_enabled: boolean;
  quiet_hours_start: Dayjs | string;
  quiet_hours_end: Dayjs | string;

  // Digest settings
  daily_digest_enabled: boolean;
  daily_digest_time: Dayjs | string;
  weekly_digest_enabled: boolean;
  weekly_digest_day: number;
}

export default function NotificationPreferencesPage() {
  const { t } = useTranslation(); // Rule 2
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const addNotification = useNotificationStore((s) => s.add);

  // Mock data - replace with actual API call
  const initialValues: NotificationPreferences = {
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    in_app_enabled: true,

    work_order_assigned: { email: true, sms: false, push: true },
    work_order_completed: { email: true, sms: false, push: true },
    appointment_scheduled: { email: true, sms: true, push: true },
    appointment_reminder: { email: true, sms: true, push: true },
    estimate_approved: { email: true, sms: false, push: true },
    invoice_generated: { email: true, sms: false, push: false },
    payment_received: { email: true, sms: false, push: true },

    quiet_hours_enabled: false,
    quiet_hours_start: dayjs('22:00', 'HH:mm'),
    quiet_hours_end: dayjs('08:00', 'HH:mm'),

    daily_digest_enabled: true,
    daily_digest_time: dayjs('18:00', 'HH:mm'),
    weekly_digest_enabled: false,
    weekly_digest_day: 1,
  };

  const handleSubmit = async (values: any) => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addNotification({ type: 'success', message: t('notificationPreferences.messages.saveSuccess') }); // Rule 5
    } catch (error) {
      addNotification({ type: 'error', message: t('notificationPreferences.messages.saveError') }); // Rule 5
    } finally {
      setSaving(false);
    }
  };

  const NotificationChannelRow = ({
    label,
    fieldPrefix,
  }: {
    label: string;
    fieldPrefix: string;
  }) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <Text>{label}</Text> {/* label is already translated via props */}
      <Space size="large">
        <Form.Item
          name={[fieldPrefix, 'email']}
          valuePropName="checked"
          noStyle
        >
          <Switch checkedChildren={<MailOutlined />} unCheckedChildren={<MailOutlined />} />
        </Form.Item>
        <Form.Item
          name={[fieldPrefix, 'sms']}
          valuePropName="checked"
          noStyle
        >
          <Switch checkedChildren={<MessageOutlined />} unCheckedChildren={<MessageOutlined />} />
        </Form.Item>
        <Form.Item
          name={[fieldPrefix, 'push']}
          valuePropName="checked"
          noStyle
        >
          <Switch checkedChildren={<MobileOutlined />} unCheckedChildren={<MobileOutlined />} />
        </Form.Item>
      </Space>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={t('notificationPreferences.pageHeader.title')} // Rule 4
        subtitle={t('notificationPreferences.pageHeader.subtitle')} // Rule 4
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={initialValues}>
        <Card title={t('notificationPreferences.globalSettings.title')} style={{ marginBottom: 24 }}> {/* Rule 4 */}
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>{t('notificationPreferences.globalSettings.emailNotifications.title')}</Text> {/* Rule 3 */}
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('notificationPreferences.globalSettings.emailNotifications.description')} {/* Rule 3 */}
                  </Text>
                </div>
              </div>
              <Form.Item name="email_enabled" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>{t('notificationPreferences.globalSettings.smsNotifications.title')}</Text> {/* Rule 3 */}
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('notificationPreferences.globalSettings.smsNotifications.description')} {/* Rule 3 */}
                  </Text>
                </div>
              </div>
              <Form.Item name="sms_enabled" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>{t('notificationPreferences.globalSettings.pushNotifications.title')}</Text> {/* Rule 3 */}
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('notificationPreferences.globalSettings.pushNotifications.description')} {/* Rule 3 */}
                  </Text>
                </div>
              </div>
              <Form.Item name="push_enabled" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>{t('notificationPreferences.globalSettings.inAppNotifications.title')}</Text> {/* Rule 3 */}
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('notificationPreferences.globalSettings.inAppNotifications.description')} {/* Rule 3 */}
                  </Text>
                </div>
              </div>
              <Form.Item name="in_app_enabled" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
            </div>
          </Space>
        </Card>

        <Card title={t('notificationPreferences.eventNotifications.title')} style={{ marginBottom: 24 }}> {/* Rule 4 */}
          <div style={{ marginBottom: 16 }}>
            <Space size="large">
              <Text type="secondary" style={{ fontSize: 12 }}>{t('notificationPreferences.eventNotifications.emailChannel')}</Text> {/* Rule 3 */}
              <Text type="secondary" style={{ fontSize: 12 }}>{t('notificationPreferences.eventNotifications.smsChannel')}</Text> {/* Rule 3 */}
              <Text type="secondary" style={{ fontSize: 12 }}>{t('notificationPreferences.eventNotifications.pushChannel')}</Text> {/* Rule 3 */}
            </Space>
          </div>

          <NotificationChannelRow label={t('notificationPreferences.eventNotifications.workOrderAssigned')} fieldPrefix="work_order_assigned" /> {/* Rule 4 */}
          <NotificationChannelRow label={t('notificationPreferences.eventNotifications.workOrderCompleted')} fieldPrefix="work_order_completed" /> {/* Rule 4 */}
          <NotificationChannelRow label={t('notificationPreferences.eventNotifications.appointmentScheduled')} fieldPrefix="appointment_scheduled" /> {/* Rule 4 */}
          <NotificationChannelRow label={t('notificationPreferences.eventNotifications.appointmentReminder')} fieldPrefix="appointment_reminder" /> {/* Rule 4 */}
          <NotificationChannelRow label={t('notificationPreferences.eventNotifications.estimateApproved')} fieldPrefix="estimate_approved" /> {/* Rule 4 */}
          <NotificationChannelRow label={t('notificationPreferences.eventNotifications.invoiceGenerated')} fieldPrefix="invoice_generated" /> {/* Rule 4 */}
          <NotificationChannelRow label={t('notificationPreferences.eventNotifications.paymentReceived')} fieldPrefix="payment_received" /> {/* Rule 4 */}
        </Card>

        <Card title={t('notificationPreferences.quietHours.title')} style={{ marginBottom: 24 }}> {/* Rule 4 */}
          <Form.Item
            name="quiet_hours_enabled"
            label={t('notificationPreferences.quietHours.enableQuietHours')} // Rule 4
            valuePropName="checked"
          >
            <Switch
              checkedChildren={t('notificationPreferences.quietHours.enabledState')} // Rule 4
              unCheckedChildren={t('notificationPreferences.quietHours.disabledState')} // Rule 4
            />
          </Form.Item>

          <Alert
            message={t('notificationPreferences.quietHours.alertMessage')} // Rule 4
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Space size="large">
            <Form.Item name="quiet_hours_start" label={t('notificationPreferences.quietHours.startTime')}> {/* Rule 4 */}
              <TimePicker
                format="HH:mm"
                style={{ width: 120 }}
              />
            </Form.Item>
            <Form.Item name="quiet_hours_end" label={t('notificationPreferences.quietHours.endTime')}> {/* Rule 4 */}
              <TimePicker
                format="HH:mm"
                style={{ width: 120 }}
              />
            </Form.Item>
          </Space>
        </Card>

        <Card title={t('notificationPreferences.digestNotifications.title')} style={{ marginBottom: 24 }}> {/* Rule 4 */}
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>{t('notificationPreferences.digestNotifications.dailyDigest.title')}</Text> {/* Rule 3 */}
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('notificationPreferences.digestNotifications.dailyDigest.description')} {/* Rule 3 */}
                  </Text>
                </div>
              </div>
              <Space>
                <Form.Item name="daily_digest_time" noStyle>
                  <TimePicker format="HH:mm" style={{ width: 120 }} />
                </Form.Item>
                <Form.Item name="daily_digest_enabled" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
              </Space>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>{t('notificationPreferences.digestNotifications.weeklyDigest.title')}</Text> {/* Rule 3 */}
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('notificationPreferences.digestNotifications.weeklyDigest.description')} {/* Rule 3 */}
                  </Text>
                </div>
              </div>
              <Space>
                <Form.Item name="weekly_digest_day" noStyle>
                  <Select style={{ width: 140 }}>
                    <Select.Option value={1}>{t('notificationPreferences.digestNotifications.weeklyDigest.monday')}</Select.Option> {/* Rule 3 */}
                    <Select.Option value={2}>{t('notificationPreferences.digestNotifications.weeklyDigest.tuesday')}</Select.Option> {/* Rule 3 */}
                    <Select.Option value={3}>{t('notificationPreferences.digestNotifications.weeklyDigest.wednesday')}</Select.Option> {/* Rule 3 */}
                    <Select.Option value={4}>{t('notificationPreferences.digestNotifications.weeklyDigest.thursday')}</Select.Option> {/* Rule 3 */}
                    <Select.Option value={5}>{t('notificationPreferences.digestNotifications.weeklyDigest.friday')}</Select.Option> {/* Rule 3 */}
                    <Select.Option value={6}>{t('notificationPreferences.digestNotifications.weeklyDigest.saturday')}</Select.Option> {/* Rule 3 */}
                    <Select.Option value={0}>{t('notificationPreferences.digestNotifications.weeklyDigest.sunday')}</Select.Option> {/* Rule 3 */}
                  </Select>
                </Form.Item>
                <Form.Item name="weekly_digest_enabled" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
              </Space>
            </div>
          </Space>
        </Card>

        <Card>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
            {t('notificationPreferences.saveButton')} {/* Rule 3 */}
          </Button>
        </Card>
      </Form>
    </div>
  );
}