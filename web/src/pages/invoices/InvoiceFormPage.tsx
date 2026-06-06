import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Skeleton, Select, DatePicker } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useInvoice, useCreateInvoice, useUpdateInvoice } from '@/hooks/use-invoices';
import { useAllContacts } from '@/hooks/use-contacts';
import { useAllWorkOrders } from '@/hooks/use-work-orders';
import PageHeader from '@/components/common/PageHeader';

const { TextArea } = Input;

export default function InvoiceFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { data: invoice, isLoading } = useInvoice(id!);
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const { data: contacts } = useAllContacts();
  const { data: workOrders } = useAllWorkOrders();

  useEffect(() => {
    if (invoice) {
      form.setFieldsValue({
        contact_id: invoice.contact_id,
        work_order_id: invoice.work_order_id,
        due_date: invoice.due_date ? dayjs(invoice.due_date) : null,
        currency: invoice.currency,
        notes: invoice.notes,
      });
    }
  }, [invoice, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    const payload = {
      ...values,
      due_date: values.due_date
        ? (values.due_date as dayjs.Dayjs).format('YYYY-MM-DD')
        : undefined,
    };

    try {
      if (isEdit) {
        await updateInvoice.mutateAsync({ id: id!, ...payload });
      } else {
        await createInvoice.mutateAsync(payload);
      }
      navigate('/invoices');
    } catch {
      // Error handled by mutation hooks
    }
  };

  if (isEdit && isLoading) {
    return (
      <div>
        <PageHeader title={t('invoiceForm.loading')} />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? t('invoiceForm.editInvoice') : t('invoiceForm.createInvoice')}
        onBack={() => navigate('/invoices')}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          style={{ maxWidth: 800 }}
          initialValues={{ currency: 'USD' }}
        >
          <Form.Item name="contact_id" label={t('invoiceForm.customer')}>
            <Select
              placeholder={t('invoiceForm.selectCustomer')}
              allowClear
              showSearch
              optionFilterProp="label"
              options={contacts?.map((c) => ({
                value: c.id,
                label: `${c.first_name} ${c.last_name}${c.email ? ` (${c.email})` : ''}`,
              })) || []}
            />
          </Form.Item>

          <Form.Item name="work_order_id" label={t('invoiceForm.workOrder')}>
            <Select
              placeholder={t('invoiceForm.selectWorkOrder')}
              allowClear
              showSearch
              optionFilterProp="label"
              options={workOrders?.map((wo) => ({
                value: wo.id,
                label: `${wo.wo_number || 'WO'} - ${wo.summary}`,
              })) || []}
            />
          </Form.Item>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="due_date" label={t('invoiceForm.dueDate')} style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="currency" label={t('invoiceForm.currency')} style={{ flex: 1 }}>
              <Select placeholder={t('invoiceForm.selectCurrency')}>
                <Select.Option value="USD">USD</Select.Option>
                <Select.Option value="EUR">EUR</Select.Option>
                <Select.Option value="GBP">GBP</Select.Option>
                <Select.Option value="CAD">CAD</Select.Option>
                <Select.Option value="AUD">AUD</Select.Option>
                <Select.Option value="INR">INR</Select.Option>
              </Select>
            </Form.Item>
          </Space>

          <Form.Item name="notes" label={t('invoiceForm.notes')}>
            <TextArea rows={4} placeholder={t('invoiceForm.notesPlaceholder')} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createInvoice.isPending || updateInvoice.isPending}
              >
                {isEdit ? t('invoiceForm.update') : t('invoiceForm.create')}
              </Button>
              <Button onClick={() => navigate('/invoices')}>{t('invoiceForm.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}