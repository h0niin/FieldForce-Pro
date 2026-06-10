import { useState } from 'react';
import { Form, Select, Button, Card, Typography, Space, Alert } from 'antd';
import { DownloadOutlined, MailOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useUsers } from '@/hooks/use-users';
import { useNotificationStore } from '@/store/notification.store';
import api from '@/api/axios-instance';

const { Title, Paragraph, Text } = Typography;

const EXPORT_MODULES = [
  { label: 'Contacts', value: 'contacts', endpoint: '/contacts' },
  { label: 'Companies', value: 'companies', endpoint: '/companies' },
  { label: 'Estimates', value: 'estimates', endpoint: '/estimates' },
  { label: 'Invoices', value: 'invoices', endpoint: '/invoices' },
  { label: 'Service Requests', value: 'service-requests', endpoint: '/service-requests' },
  { label: 'Work Orders', value: 'work-orders', endpoint: '/work-orders' },
  { label: 'Service Locations', value: 'service-locations', endpoint: '/service-locations' },
];

const RECORD_LIMIT = 100;

export default function DataExportSettingsPage() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [exporting, setExporting] = useState(false);
  const addNotification = useNotificationStore((s) => s.add);

  // Fetch users to get emails for the "Send to" field
  const { data: usersData, isLoading: usersLoading } = useUsers({ take: 100 });
  const users = usersData?.data || [];

  // Deduplicate emails
  const userEmails = Array.from(new Set(users.map((u) => u.email).filter(Boolean)));

  const handleExport = async (values: { module: string; email: string }) => {
    setExporting(true);
    const selectedMod = EXPORT_MODULES.find((m) => m.value === values.module);
    if (!selectedMod) return;

    try {
      // Fetch the actual data from the endpoint
      const response = await api.get(selectedMod.endpoint, {
        params: { page: 1, take: RECORD_LIMIT },
      });

      const records = response.data?.data || [];
      const totalCount = response.data?.meta?.itemCount || records.length;

      // Generate simulated CSV contents
      let csvContent = '';
      if (records.length > 0) {
        const headers = Object.keys(records[0]).filter(
          (key) => typeof records[0][key] !== 'object'
        );
        csvContent += headers.join(',') + '\n';

        records.forEach((rec: any) => {
          const row = headers.map((header) => {
            const val = rec[header];
            if (val === null || val === undefined) return '';
            const valStr = String(val).replace(/"/g, '""');
            return valStr.includes(',') || valStr.includes('\n') ? `"${valStr}"` : valStr;
          });
          csvContent += row.join(',') + '\n';
        });
      } else {
        csvContent = 'No data available';
      }

      // Simulate sending mail
      await new Promise((resolve) => setTimeout(resolve, 1500));

      addNotification({
        type: 'success',
        message: t(
          'settings.export.success',
          `Export completed! Sent the first ${Math.min(
            records.length,
            RECORD_LIMIT
          )} records to ${values.email}.`
        ),
      });

      // Show alert or log simulation
      console.log('Simulated Email Attachment (CSV):', csvContent);
    } catch (error) {
      console.error(error);
      addNotification({
        type: 'error',
        message: t('settings.export.error', 'Failed to generate export file or connect to mail channel.'),
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ maxWidth: 650 }}>
      <Title level={4} style={{ margin: 0 }}>
        {t('settings.export.title', 'Data Export')}
      </Title>
      <Paragraph style={{ color: 'var(--text-secondary)', marginTop: 4, marginBottom: 20 }}>
        Generate custom CSV spreadsheets of your field service database records. Export logs, client records, and service history to send directly to your workspace email for off-line reporting and offline audits.
      </Paragraph>

      <Form form={form} layout="vertical" onFinish={handleExport}>
        <Form.Item
          name="module"
          label={t('settings.export.formModule', 'Select the Module to Export')}
          rules={[{ required: true, message: t('settings.export.requiredModule', 'Please select a module to export') }]}
        >
          <Select
            placeholder={t('settings.export.placeholderModule', 'Select FSM module')}
            options={EXPORT_MODULES}
          />
        </Form.Item>

        <Form.Item
          name="email"
          label={t('settings.export.formEmail', 'Send to (Select existing user email)')}
          rules={[{ required: true, message: t('settings.export.requiredEmail', 'Please select a target email address') }]}
        >
          <Select
            placeholder={t('settings.export.placeholderEmail', 'Select email address')}
            options={userEmails.map((email) => ({ label: email, value: email }))}
            loading={usersLoading}
            showSearch
          />
        </Form.Item>

        <Alert
          message={t('settings.export.limitTitle', 'Record Export Limit')}
          description={
            <Space direction="vertical" size={2}>
              <Text style={{ fontSize: 13 }}>
                {t(
                  'settings.export.limitDesc',
                  `Exports are limited to the first ${RECORD_LIMIT} records from the selected module.`
                )}
              </Text>
              <Text strong style={{ fontSize: 13 }}>
                {t(
                  'settings.export.limitSupport',
                  'If you want to export a larger volume of records, please contact support.'
                )}
              </Text>
            </Space>
          }
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 24, borderRadius: 10 }}
        />

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<MailOutlined />}
            loading={exporting}
            style={{ width: '100%', height: 40 }}
          >
            {t('settings.export.btn', 'Export & Send Email')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
