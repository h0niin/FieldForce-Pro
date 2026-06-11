import { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Skeleton, Select, DatePicker } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useEstimate, useCreateEstimate, useUpdateEstimate } from '@/hooks/use-estimates';
import { useAllContacts } from '@/hooks/use-contacts';
import PageHeader from '@/components/common/PageHeader';
import CustomFieldsSection from '@/components/common/CustomFieldsSection';

const { TextArea } = Input;

export default function EstimateFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workOrderId = searchParams.get('work_order_id') || undefined;
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { data: estimate, isLoading } = useEstimate(id!);
  const createEstimate = useCreateEstimate();
  const updateEstimate = useUpdateEstimate();
  const { data: contacts } = useAllContacts();

  useEffect(() => {
    if (estimate) {
      form.setFieldsValue({
        contact_id: estimate.contact_id,
        notes: estimate.notes,
        expiry_date: estimate.expiry_date ? dayjs(estimate.expiry_date) : null,
        scheduled_start: estimate.scheduled_start ? dayjs(estimate.scheduled_start) : null,
        custom_fields: estimate.custom_fields || {},
      });
    }
  }, [estimate, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    const payload = {
      ...values,
      expiry_date: values.expiry_date
        ? (values.expiry_date as dayjs.Dayjs).format('YYYY-MM-DD')
        : undefined,
      scheduled_start: values.scheduled_start
        ? (values.scheduled_start as dayjs.Dayjs).toISOString()
        : undefined,
    };

    try {
      if (isEdit) {
        await updateEstimate.mutateAsync({ id: id!, ...payload });
        navigate('/estimates');
      } else {
        const result = await createEstimate.mutateAsync({ ...payload, work_order_id: workOrderId });
        const newId = result.data.data?.id;
        if (workOrderId) {
          // Redirect back to the work order's estimates tab
          navigate(`/work-orders/${workOrderId}?tab=estimates`);
        } else if (newId) {
          navigate(`/estimates/${newId}`);
        } else {
          navigate('/estimates');
        }
      }
    } catch {
      // Error handled by mutation hooks
    }
  };

  if (isEdit && isLoading) {
    return (
      <div>
        <PageHeader title={t('estimateForm.loading')} />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? t('estimateForm.editEstimate') : workOrderId ? t('estimateForm.createEstimateForWorkOrder') : t('estimateForm.createEstimate')}
        onBack={() => workOrderId ? navigate(`/work-orders/${workOrderId}`) : navigate('/estimates')}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          style={{ maxWidth: 800 }}
        >
          <Form.Item name="contact_id" label={t('estimateForm.customerContact')}>
            <Select
              placeholder={t('estimateForm.selectCustomer')}
              allowClear
              showSearch
              optionFilterProp="label"
              options={contacts?.map((c) => ({
                value: c.id,
                label: `${c.first_name} ${c.last_name}${c.email ? ` (${c.email})` : ''}`,
              })) || []}
            />
          </Form.Item>

          <Form.Item name="expiry_date" label={t('estimateForm.expiryDate')}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="scheduled_start" label={t('estimateForm.scheduledDate')}>
            <DatePicker
              format="YYYY-MM-DD"
              placeholder={t('estimateForm.selectScheduledDate')}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="notes" label={t('estimateForm.notes')}>
            <TextArea rows={4} placeholder={t('estimateForm.additionalNotes')} />
          </Form.Item>

          <CustomFieldsSection moduleName="Estimates" />

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createEstimate.isPending || updateEstimate.isPending}
              >
                {isEdit ? t('estimateForm.update') : t('estimateForm.create')}
              </Button>
              <Button onClick={() => navigate('/estimates')}>{t('estimateForm.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}