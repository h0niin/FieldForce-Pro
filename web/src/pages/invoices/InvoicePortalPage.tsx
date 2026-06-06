import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card, Button, Skeleton, Table, Typography, Space, Tag, Row, Col,
  Divider, Result, InputNumber, Select, Input, Form, Alert,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { invoicesApi } from '@/api/invoices.api';
import { paymentsApi } from '@/api/payments.api';
import type { Invoice, InvoiceLineItem } from '@/types/models.types';
import { formatCurrency } from '@/utils/format-currency';
import { formatDateTime } from '@/utils/format-date';

const { Text, Title } = Typography;

const METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
];

type PageState = 'loading' | 'error' | 'idle' | 'submitting' | 'submitted';

export default function InvoicePortalPage() {
  const { token } = useParams<{ token: string }>();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    if (!token) { setErrorMsg('Invalid link.'); setPageState('error'); return; }
    invoicesApi.getByPublicToken(token)
      .then((res) => { setInvoice(res.data.data!); setPageState('idle'); })
      .catch((err) => {
        setErrorMsg(err?.response?.data?.message || 'This link is invalid or has expired.');
        setPageState('error');
      });
  }, [token]);

  const handleSubmit = async (values: any) => {
    setSubmitError('');
    setPageState('submitting');
    try {
      await paymentsApi.submitFromPortal({
        invoice_token: token!,
        amount: values.amount,
        method: values.method,
        reference: values.reference,
        notes: values.notes,
      });
      setPageState('submitted');
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || 'Failed to submit. Please try again.');
      setPageState('idle');
    }
  };

  const currency = invoice?.currency || 'INR';
  const outstanding = Math.max(0, (invoice?.total || 0) - (invoice?.paid_amount || 0));

  const lineItemCols: ColumnsType<InvoiceLineItem> = [
    { title: 'Description', dataIndex: 'name', render: (n: string, r: InvoiceLineItem) => (
      <div><div style={{ fontWeight: 500 }}>{n}</div>
        {r.description && <div style={{ fontSize: 12, color: '#888' }}>{r.description}</div>}
      </div>
    )},
    { title: 'Qty', dataIndex: 'quantity', width: 60 },
    { title: 'Rate', dataIndex: 'unit_price', align: 'right' as const, render: (p: number) => formatCurrency(p, currency) },
    { title: 'Amount', dataIndex: 'total', align: 'right' as const, render: (t: number) => <strong>{formatCurrency(t, currency)}</strong> },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ background: '#1a1a2e', padding: '16px 24px', display: 'flex', alignItems: 'center' }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>FieldForce Pro</div>
        <Tag color="blue" style={{ marginLeft: 'auto' }}>Invoice</Tag>
      </div>

      <div style={{ maxWidth: 800, margin: '32px auto', padding: '0 16px 64px' }}>
        {pageState === 'loading' && <Card><Skeleton active paragraph={{ rows: 8 }} /></Card>}

        {pageState === 'error' && (
          <Result status="error" icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            title="Unable to Load Invoice" subTitle={errorMsg} />
        )}

        {pageState === 'submitted' && (
          <Result status="success" icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            title="Payment Submitted!"
            subTitle="Your payment notification has been sent to the service team. They will verify and confirm your payment shortly." />
        )}

        {(pageState === 'idle' || pageState === 'submitting') && invoice && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Invoice summary */}
            <Card title={
              <Space>
                <span style={{ fontWeight: 600 }}>Invoice</span>
                <Tag color="blue">{invoice.invoice_number || invoice.id.slice(0, 8)}</Tag>
                <Tag color={outstanding === 0 ? 'green' : 'orange'}>
                  {outstanding === 0 ? 'Paid' : 'Payment Pending'}
                </Tag>
              </Space>
            }>
              <Row gutter={[16, 12]}>
                <Col xs={24} sm={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Customer</Text>
                  <div style={{ fontWeight: 600 }}>
                    {invoice.contact ? `${invoice.contact.first_name} ${invoice.contact.last_name}` : '—'}
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Due Date</Text>
                  <div>{invoice.due_date ? formatDateTime(invoice.due_date) : '—'}</div>
                </Col>
              </Row>
            </Card>

            {/* Line items */}
            <Card title="Services & Charges">
              <Table columns={lineItemCols} dataSource={invoice.line_items || []}
                rowKey="id" pagination={false} locale={{ emptyText: 'No items' }}
                summary={() => (
                  <Table.Summary>
                    {(invoice.tax || 0) > 0 && (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={3} align="right">Tax / GST</Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">{formatCurrency(invoice.tax || 0, currency)}</Table.Summary.Cell>
                      </Table.Summary.Row>
                    )}
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3} align="right"><strong style={{ fontSize: 15 }}>Total</strong></Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right"><strong style={{ fontSize: 15, color: '#1a1a2e' }}>{formatCurrency(invoice.total || 0, currency)}</strong></Table.Summary.Cell>
                    </Table.Summary.Row>
                    {(invoice.paid_amount || 0) > 0 && (
                      <>
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0} colSpan={3} align="right">Paid</Table.Summary.Cell>
                          <Table.Summary.Cell index={1} align="right"><span style={{ color: '#52c41a' }}>-{formatCurrency(invoice.paid_amount || 0, currency)}</span></Table.Summary.Cell>
                        </Table.Summary.Row>
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0} colSpan={3} align="right"><strong>Balance Due</strong></Table.Summary.Cell>
                          <Table.Summary.Cell index={1} align="right"><strong style={{ color: outstanding > 0 ? '#ff4d4f' : '#52c41a', fontSize: 15 }}>{formatCurrency(outstanding, currency)}</strong></Table.Summary.Cell>
                        </Table.Summary.Row>
                      </>
                    )}
                  </Table.Summary>
                )}
              />
            </Card>

            {/* Payment form — only if outstanding > 0 */}
            {outstanding > 0 ? (
              <Card title="Submit Payment Notification">
                <Alert
                  message="After submitting, our team will verify your payment and confirm it within a short time."
                  type="info" showIcon style={{ marginBottom: 16 }}
                />
                {submitError && <Alert message={submitError} type="error" showIcon closable style={{ marginBottom: 16 }} />}
                <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ method: 'upi' }}>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item name="amount" label="Amount Paid" rules={[{ required: true, message: 'Required' }]}>
                        <InputNumber style={{ width: '100%' }} size="large" min={0.01} max={outstanding} prefix="₹" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="method" label="Payment Method" rules={[{ required: true }]}>
                        <Select size="large" options={METHODS} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="reference" label="Transaction Reference / UTR Number (optional)">
                    <Input placeholder="e.g. UPI Ref: 4089234561 / Cheque No: 00123" />
                  </Form.Item>
                  <Form.Item name="notes" label="Notes (optional)">
                    <Input.TextArea rows={2} placeholder="Any additional information" />
                  </Form.Item>
                  <Divider />
                  <Button type="primary" size="large" htmlType="submit" block loading={pageState === 'submitting'}>
                    Submit Payment Notification
                  </Button>
                </Form>
              </Card>
            ) : (
              <Alert message="This invoice has been fully paid. Thank you!" type="success" showIcon />
            )}
          </Space>
        )}
      </div>
    </div>
  );
}
