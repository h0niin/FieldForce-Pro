import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Skeleton, DatePicker, InputNumber, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useAsset, useCreateAsset, useUpdateAsset } from '@/hooks/use-assets';
import { useAllContacts } from '@/hooks/use-contacts';
import PageHeader from '@/components/common/PageHeader';

const { TextArea } = Input;

export default function AssetFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { data: asset, isLoading } = useAsset(id!);
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const { data: contacts } = useAllContacts();

  useEffect(() => {
    if (asset) {
      form.setFieldsValue({
        name: asset.name,
        model: asset.model,
        serial_number: asset.serial_number,
        manufacturer: asset.manufacturer,
        install_date: asset.install_date ? dayjs(asset.install_date) : null,
        warranty_expiry: asset.warranty_expiry ? dayjs(asset.warranty_expiry) : null,
        health_score: asset.health_score,
        category: asset.category,
        contact_id: asset.contact_id,
        location_id: asset.location_id,
        notes: asset.notes,
      });
    }
  }, [asset, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    const payload = {
      ...values,
      install_date: values.install_date ? (values.install_date as dayjs.Dayjs).format('YYYY-MM-DD') : undefined,
      warranty_expiry: values.warranty_expiry ? (values.warranty_expiry as dayjs.Dayjs).format('YYYY-MM-DD') : undefined,
    };

    try {
      if (isEdit) {
        await updateAsset.mutateAsync({ id: id!, ...payload });
      } else {
        await createAsset.mutateAsync(payload as Record<string, unknown> & { name: string });
      }
      navigate('/assets');
    } catch {
      // Error handled by mutation hooks
    }
  };

  if (isEdit && isLoading) {
    return (
      <div>
        <PageHeader title={t('assetForm.loading')} />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? t('assetForm.editAsset') : t('assetForm.createAsset')}
        onBack={() => navigate('/assets')}
      />

      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off" style={{ maxWidth: 800 }}>
          <Form.Item name="name" label={t('assetForm.assetName')} rules={[{ required: true, message: t('assetForm.enterAssetName') }]}>
            <Input placeholder={t('assetForm.placeholderAssetName')} />
          </Form.Item>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="manufacturer" label={t('assetForm.manufacturer')} style={{ flex: 1 }}>
              <Input placeholder={t('assetForm.placeholderManufacturer')} />
            </Form.Item>
            <Form.Item name="model" label={t('assetForm.model')} style={{ flex: 1 }}>
              <Input placeholder={t('assetForm.placeholderModel')} />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="serial_number" label={t('assetForm.serialNumber')} style={{ flex: 1 }}>
              <Input placeholder={t('assetForm.placeholderSerialNumber')} />
            </Form.Item>
            <Form.Item name="category" label={t('assetForm.category')} style={{ flex: 1 }}>
              <Select placeholder={t('assetForm.selectCategory')} allowClear>
                <Select.Option value="HVAC">{t('assetForm.categories.hvac')}</Select.Option>
                <Select.Option value="Plumbing">{t('assetForm.categories.plumbing')}</Select.Option>
                <Select.Option value="Electrical">{t('assetForm.categories.electrical')}</Select.Option>
                <Select.Option value="Appliance">{t('assetForm.categories.appliance')}</Select.Option>
                <Select.Option value="Security">{t('assetForm.categories.security')}</Select.Option>
                <Select.Option value="Fire Safety">{t('assetForm.categories.fireSafety')}</Select.Option>
                <Select.Option value="Elevator">{t('assetForm.categories.elevator')}</Select.Option>
                <Select.Option value="Generator">{t('assetForm.categories.generator')}</Select.Option>
                <Select.Option value="Other">{t('assetForm.categories.other')}</Select.Option>
              </Select>
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="install_date" label={t('assetForm.installDate')} style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="warranty_expiry" label={t('assetForm.warrantyExpiry')} style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item name="health_score" label={t('assetForm.healthScore')}>
            <InputNumber min={0} max={100} step={0.1} placeholder={t('assetForm.placeholderHealthScore')} style={{ width: 200 }} />
          </Form.Item>

          <Form.Item name="contact_id" label={t('assetForm.customer')}>
            <Select
              placeholder={t('assetForm.selectCustomer')}
              allowClear
              showSearch
              optionFilterProp="label"
              options={contacts?.map((c) => ({
                value: c.id,
                label: `${c.first_name} ${c.last_name}${c.email ? ` (${c.email})` : ''}`,
              })) || []}
            />
          </Form.Item>

          <Form.Item name="notes" label={t('assetForm.notes')}>
            <TextArea rows={4} placeholder={t('assetForm.placeholderNotes')} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createAsset.isPending || updateAsset.isPending}>
                {isEdit ? t('assetForm.update') : t('assetForm.create')}
              </Button>
              <Button onClick={() => navigate('/assets')}>{t('assetForm.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}