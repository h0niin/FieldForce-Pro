import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Skeleton, Select, DatePicker, InputNumber } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { usePayment, useCreatePayment, useUpdatePayment } from '@/hooks/use-payments';
import { useAllInvoices } from '@/hooks/use-invoices';
import PageHeader from '@/components/common/PageHeader';

const { TextArea } = Input;

export default function PaymentFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { data: payment, isLoading } = usePayment(id!);
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();
  const { data: invoices } = useAllInvoices();

  useEffect(() => {
    if (payment) {
      form.setFieldsValue({
        invoice_id: payment.invoice_id,
        amount: payment.amount,
        method: payment.method,
        gateway_transaction_id: payment.gateway_transaction_id,
        paid_at: payment.paid_at ? dayjs(payment.paid_at) : null,
        notes: payment.notes,
      });
    }
  }, [payment, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    const payload = {
      ...values,
      paid_at: values.paid_at
        ? (values.paid_at as dayjs.Dayjs).toISOString()
        : undefined,
    };

    try {
      if (isEdit) {
        await updatePayment.mutateAsync({ id: id!, ...payload });
      } else {
        await createPayment.mutateAsync(payload as Record<string, unknown> & { invoice_id: string; amount: number });
      }
      navigate('/payments');
    } catch {
      // Error handled by mutation hooks
    }
  };

  if (isEdit && isLoading) {
    return (
      <div>
        <PageHeader title={t('paymentForm.loading')} />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? t('paymentForm.editPayment') : t('paymentForm.recordPayment')}
        onBack={() => navigate('/payments')}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          style={{ maxWidth: 800 }}
          initialValues={{ method: 'card' }}
        >
          <Form.Item
            name="invoice_id"
            label={t('paymentForm.invoice')}
            rules={[{ required: true, message: t('paymentForm.selectInvoiceRequired') }]}
          >
            <Select
              placeholder={t('paymentForm.selectInvoice')}
              allowClear
              showSearch
              optionFilterProp="label"
              options={invoices?.map((inv) => ({
                value: inv.id,
                label: `${inv.invoice_number || 'INV'} - ${inv.contact ? `${inv.contact.first_name} ${inv.contact.last_name}` : t('paymentForm.noCustomer')} (${t('paymentForm.total')}: ${inv.total || 0})`,
              })) || []}
            />
          </Form.Item>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item
              name="amount"
              label={t('paymentForm.amount')}
              style={{ flex: 1 }}
              rules={[{ required: true, message: t('paymentForm.enterAmountRequired') }]}
            >
              <InputNumber
                placeholder="0.00"
                min={0}
                step={0.01}
                precision={2}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item name="method" label={t('paymentForm.paymentMethod')} style={{ flex: 1 }}>
              <Select placeholder={t('paymentForm.selectMethod')}>
                <Select.Option value="card">{t('paymentForm.methods.card')}</Select.Option>
                <Select.Option value="cash">{t('paymentForm.methods.cash')}</Select.Option>
                <Select.Option value="bank_transfer">{t('paymentForm.methods.bankTransfer')}</Select.Option>
                <Select.Option value="online">{t('paymentForm.methods.online')}</Select.Option>
                <Select.Option value="check">{t('paymentForm.methods.check')}</Select.Option>
                <Select.Option value="other">{t('paymentForm.methods.other')}</Select.Option>
              </Select>
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="gateway_transaction_id" label={t('paymentForm.transactionId')} style={{ flex: 1 }}>
              <Input placeholder={t('paymentForm.transactionIdPlaceholder')} />
            </Form.Item>
            <Form.Item name="paid_at" label={t('paymentForm.paidAt')} style={{ flex: 1 }}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item name="notes" label={t('paymentForm.notes')}>
            <TextArea rows={4} placeholder={t('paymentForm.notesPlaceholder')} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createPayment.isPending || updatePayment.isPending}
              >
                {isEdit ? t('paymentForm.update') : t('paymentForm.recordPayment')}
              </Button>
              <Button onClick={() => navigate('/payments')}>{t('paymentForm.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}