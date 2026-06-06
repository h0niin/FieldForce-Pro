import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Skeleton, Select, InputNumber, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import { usePricebookItem, useCreatePricebookItem, useUpdatePricebookItem } from '@/hooks/use-pricebook';
import { useAllServicesCatalog } from '@/hooks/use-services-catalog';
import PageHeader from '@/components/common/PageHeader';

const { TextArea } = Input;

export default function PricebookFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { data: pricebookItem, isLoading } = usePricebookItem(id!);
  const createPricebookItem = useCreatePricebookItem();
  const updatePricebookItem = useUpdatePricebookItem();
  const { data: services } = useAllServicesCatalog();

  useEffect(() => {
    if (pricebookItem) {
      form.setFieldsValue({
        service_id: pricebookItem.service_id,
        name: pricebookItem.name,
        tier: pricebookItem.tier,
        price: pricebookItem.price,
        description: pricebookItem.description,
        is_active: pricebookItem.is_active,
      });
    }
  }, [pricebookItem, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      if (isEdit) {
        await updatePricebookItem.mutateAsync({ id: id!, ...values });
      } else {
        await createPricebookItem.mutateAsync(values as never);
      }
      navigate('/pricebook');
    } catch {
      // Error handled by mutation hooks
    }
  };

  if (isEdit && isLoading) {
    return (
      <div>
        <PageHeader title={t('pricebook.loading')} />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? t('pricebook.editTitle') : t('pricebook.createTitle')}
        onBack={() => navigate('/pricebook')}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          style={{ maxWidth: 800 }}
          initialValues={{ tier: 'good', is_active: true }}
        >
          <Form.Item
            name="service_id"
            label={t('pricebook.service')}
            rules={[{ required: true, message: t('pricebook.selectServiceMessage') }]}
          >
            <Select
              placeholder={t('pricebook.selectServicePlaceholder')}
              allowClear
              showSearch
              optionFilterProp="label"
              options={services?.map((s) => ({
                value: s.id,
                label: s.name,
              })) || []}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label={t('pricebook.name')}
            rules={[{ required: true, message: t('pricebook.enterNameMessage') }]}
          >
            <Input placeholder={t('pricebook.namePlaceholder')} />
          </Form.Item>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item
              name="tier"
              label={t('pricebook.tier')}
              style={{ flex: 1 }}
              rules={[{ required: true, message: t('pricebook.selectTierMessage') }]}
            >
              <Select placeholder={t('pricebook.selectTierPlaceholder')}>
                <Select.Option value="good">{t('pricebook.tierGood')}</Select.Option>
                <Select.Option value="better">{t('pricebook.tierBetter')}</Select.Option>
                <Select.Option value="best">{t('pricebook.tierBest')}</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="price"
              label={t('pricebook.price')}
              style={{ flex: 1 }}
              rules={[{ required: true, message: t('pricebook.enterPriceMessage') }]}
            >
              <InputNumber
                placeholder={t('pricebook.pricePlaceholder')}
                min={0}
                step={0.01}
                precision={2}
                style={{ width: '100%' }}
                prefix="$"
              />
            </Form.Item>
          </Space>

          <Form.Item name="description" label={t('pricebook.description')}>
            <TextArea rows={4} placeholder={t('pricebook.descriptionPlaceholder')} />
          </Form.Item>

          <Form.Item name="is_active" label={t('pricebook.active')} valuePropName="checked">
            <Switch checkedChildren={t('pricebook.active')} unCheckedChildren={t('pricebook.inactive')} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createPricebookItem.isPending || updatePricebookItem.isPending}
              >
                {isEdit ? t('pricebook.update') : t('pricebook.create')}
              </Button>
              <Button onClick={() => navigate('/pricebook')}>{t('pricebook.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}