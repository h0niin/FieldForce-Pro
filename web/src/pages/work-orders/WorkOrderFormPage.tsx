import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Skeleton, Select, DatePicker, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useWorkOrder, useCreateWorkOrder, useUpdateWorkOrder } from '@/hooks/use-work-orders';
import { useAllContacts } from '@/hooks/use-contacts';
import { useAllServiceLocations } from '@/hooks/use-service-locations';
import { useAllAssets } from '@/hooks/use-assets';
import PageHeader from '@/components/common/PageHeader';
import CustomFieldsSection from '@/components/common/CustomFieldsSection';

const { TextArea } = Input;

export default function WorkOrderFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { data: workOrder, isLoading } = useWorkOrder(id!);
  const createWorkOrder = useCreateWorkOrder();
  const updateWorkOrder = useUpdateWorkOrder();
  const { data: contacts } = useAllContacts();
  const { data: locations } = useAllServiceLocations();
  const { data: assets } = useAllAssets();

  useEffect(() => {
    if (workOrder) {
      form.setFieldsValue({
        summary: workOrder.summary,
        description: workOrder.description,
        contact_id: workOrder.contact_id,
        location_id: workOrder.location_id,
        asset_id: workOrder.asset_id,
        priority: workOrder.priority,
        category: workOrder.category,
        slaHours: (workOrder as any).slaHours ?? 24,
        scheduled_start: workOrder.scheduled_start ? dayjs(workOrder.scheduled_start) : null,
        custom_fields: workOrder.custom_fields || {},
      });
    }
  }, [workOrder, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    const payload = {
      ...values,
      scheduled_start: values.scheduled_start
        ? (values.scheduled_start as dayjs.Dayjs).toISOString()
        : undefined,
    };

    try {
      if (isEdit) {
        // Strip slaHours from update payload because backend does not accept it for updates
        const { slaHours, ...updatePayload } = payload as any;
        await updateWorkOrder.mutateAsync({ id: id!, ...updatePayload });
      } else {
        await createWorkOrder.mutateAsync(payload as any);
      }
      navigate('/work-orders');
    } catch {
      // Error handled by mutation hooks
    }
  };

  if (isEdit && isLoading) {
    return (
      <div>
        <PageHeader title={t('workOrders.loading')} />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? t('workOrders.editWorkOrder') : t('workOrders.createWorkOrder')}
        onBack={() => navigate('/work-orders')}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          style={{ maxWidth: 800 }}
          initialValues={{ priority: 'medium', slaHours: 24 }}
        >
          <Form.Item
            name="summary"
            label={t('workOrders.summary')}
            rules={[{ required: true, message: t('workOrders.pleaseEnterSummary') }]}
          >
            <Input placeholder={t('workOrders.summaryPlaceholder')} />
          </Form.Item>

          <Form.Item name="description" label={t('workOrders.description')}>
            <TextArea rows={4} placeholder={t('workOrders.descriptionPlaceholder')} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contact_id" label={t('workOrders.customerContact')}>
                <Select
                  placeholder={t('workOrders.selectCustomer')}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={contacts?.map((c) => ({
                    value: c.id,
                    label: `${c.first_name} ${c.last_name}${c.email ? ` (${c.email})` : ''}`,
                  })) || []}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location_id" label={t('workOrders.serviceLocation')}>
                <Select
                  placeholder={t('workOrders.selectLocation')}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={locations?.map((l) => ({
                    value: l.id,
                    label: l.address,
                  })) || []}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="asset_id" label={t('workOrders.asset')}>
                <Select
                  placeholder={t('workOrders.selectAsset')}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={assets?.map((a) => ({
                    value: a.id,
                    label: `${a.name}${a.serial_number ? ` (${a.serial_number})` : ''}`,
                  })) || []}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label={t('workOrders.priority')}>
                <Select placeholder={t('workOrders.selectPriority')}>
                  <Select.Option value="low">{t('workOrders.priorities.low')}</Select.Option>
                  <Select.Option value="medium">{t('workOrders.priorities.medium')}</Select.Option>
                  <Select.Option value="high">{t('workOrders.priorities.high')}</Select.Option>
                  <Select.Option value="urgent">{t('workOrders.priorities.urgent')}</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label={t('workOrders.category')}>
                <Select placeholder={t('workOrders.selectCategory')} allowClear>
                  <Select.Option value="HVAC">{t('workOrders.categories.hvac')}</Select.Option>
                  <Select.Option value="Plumbing">{t('workOrders.categories.plumbing')}</Select.Option>
                  <Select.Option value="Electrical">{t('workOrders.categories.electrical')}</Select.Option>
                  <Select.Option value="Appliance">{t('workOrders.categories.appliance')}</Select.Option>
                  <Select.Option value="General">{t('workOrders.categories.general')}</Select.Option>
                  <Select.Option value="Preventive Maintenance">{t('workOrders.categories.preventiveMaintenance')}</Select.Option>
                  <Select.Option value="Emergency">{t('workOrders.categories.emergency')}</Select.Option>
                  <Select.Option value="Other">{t('workOrders.categories.other')}</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="slaHours" label={t('workOrders.slaHours')}>
                <Select placeholder={t('workOrders.selectSla')}>
                  <Select.Option value={2}>2</Select.Option>
                  <Select.Option value={4}>4</Select.Option>
                  <Select.Option value={8}>8</Select.Option>
                  <Select.Option value={24}>{t('workOrders.defaultSla', { hours: 24 })}</Select.Option>
                  <Select.Option value={48}>48</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="scheduled_start"
            label={t('workOrders.scheduledDate')}
            tooltip={workOrder?.estimate_id ? t('workOrders.lockedEstimateTooltip') : undefined}
          >
            <DatePicker
              format="YYYY-MM-DD"
              style={{ width: '100%' }}
              disabled={!!workOrder?.estimate_id}
            />
          </Form.Item>

          <CustomFieldsSection moduleName="Work Orders" />

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createWorkOrder.isPending || updateWorkOrder.isPending}
              >
                {isEdit ? t('workOrders.update') : t('workOrders.create')}
              </Button>
              <Button onClick={() => navigate('/work-orders')}>{t('workOrders.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
