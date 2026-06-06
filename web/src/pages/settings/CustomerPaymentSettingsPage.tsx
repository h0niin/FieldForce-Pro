import { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Spin, Upload, message, Image, Space, Typography } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import PageHeader from '@/components/common/PageHeader';
import { tenantsApi, type TenantPaymentConfig } from '@/api/tenants.api';

const { Text } = Typography;

/**
 * Lets the tenant company configure the payment details the technician app shows
 * to customers (Step 12): a QR image to scan and/or UPI + bank details. The QR
 * image is stored inline as a data URI (no separate upload service needed).
 */
export default function CustomerPaymentSettingsPage() {
  const [form] = Form.useForm<TenantPaymentConfig>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrImage, setQrImage] = useState<string | undefined>(undefined);

  useEffect(() => {
    tenantsApi
      .getPaymentSettings()
      .then((res) => {
        const cfg = res.data.data ?? {};
        form.setFieldsValue(cfg);
        setQrImage(cfg.qr_image_url);
      })
      .catch(() => message.error('Failed to load payment settings'))
      .finally(() => setLoading(false));
  }, [form]);

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    if (!file.type.startsWith('image/')) {
      message.error('Please select an image file');
      return Upload.LIST_IGNORE;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      message.error('QR image must be under 1.5 MB');
      return Upload.LIST_IGNORE;
    }
    const reader = new FileReader();
    reader.onload = () => setQrImage(reader.result as string);
    reader.readAsDataURL(file);
    return false; // prevent auto-upload; we store the data URI ourselves
  };

  const onSubmit = async (values: TenantPaymentConfig) => {
    setSaving(true);
    try {
      await tenantsApi.updatePaymentSettings({ ...values, qr_image_url: qrImage });
      message.success('Payment settings saved');
    } catch {
      message.error('Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  return (
    <div>
      <PageHeader title="Customer Payment Details" />
      <Card style={{ maxWidth: 640 }}>
        <Text type="secondary">
          These details appear in the technician app so the customer can pay on-site.
          Upload your payment QR (GPay/Paytm/PhonePe/bank) and/or enter UPI &amp; bank details.
        </Text>

        <Form form={form} layout="vertical" onFinish={onSubmit} style={{ marginTop: 24 }}>
          <Form.Item label="Payment QR image">
            <Space direction="vertical">
              {qrImage ? (
                <Space align="start">
                  <Image src={qrImage} alt="Payment QR" width={160} height={160} style={{ objectFit: 'contain', border: '1px solid #eee' }} />
                  <Button danger icon={<DeleteOutlined />} onClick={() => setQrImage(undefined)}>Remove</Button>
                </Space>
              ) : null}
              <Upload beforeUpload={beforeUpload} showUploadList={false} accept="image/*">
                <Button icon={<UploadOutlined />}>{qrImage ? 'Replace QR image' : 'Upload QR image'}</Button>
              </Upload>
            </Space>
          </Form.Item>

          <Form.Item label="UPI VPA / ID" name="upi_vpa">
            <Input placeholder="e.g. bluestar@okhdfcbank" />
          </Form.Item>
          <Form.Item label="Payee / merchant name" name="upi_name">
            <Input placeholder="e.g. Bluestar AC Services" />
          </Form.Item>

          <Form.Item label="Bank account name" name="bank_account_name">
            <Input />
          </Form.Item>
          <Form.Item label="Bank account number" name="bank_account_number">
            <Input />
          </Form.Item>
          <Form.Item label="IFSC / routing code" name="bank_ifsc">
            <Input />
          </Form.Item>
          <Form.Item label="Bank name" name="bank_name">
            <Input />
          </Form.Item>
          <Form.Item label="Payment instructions (optional)" name="instructions">
            <Input.TextArea rows={2} placeholder="Shown to the customer below the QR" />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={saving}>
            Save Payment Settings
          </Button>
        </Form>
      </Card>
    </div>
  );
}
