import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Button, Space, Skeleton, Tag, Table, Modal,
  Form, InputNumber, Select, DatePicker, Input, Popconfirm, Alert,
  Typography, Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EditOutlined, DeleteOutlined, PlusOutlined, CopyOutlined,
  CheckCircleOutlined, CloseCircleOutlined, LinkOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useInvoice, useDeleteInvoice, useUpdateInvoiceStatus, useInvoiceLineItems,
  useGenerateInvoicePortalLink,
} from '@/hooks/use-invoices';
import {
  useInvoicePayments, useCreatePayment, useDeletePayment, useConfirmPayment, useRejectPayment,
} from '@/hooks/use-payments';
import { useAuthStore } from '@/store/auth.store';
import type { InvoiceLineItem, Payment } from '@/types/models.types';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';
import { formatCurrency } from '@/utils/format-currency';

const { Text } = Typography;

const statusColors: Record<string, string> = {
  draft: 'default', pending_approval: 'gold', approved: 'green', rejected: 'red',
  sent: 'blue', viewed: 'cyan',
  partially_paid: 'gold', paid: 'green', overdue: 'red', void: 'default',
};
const paymentStatusColors: Record<string, string> = {
  pending: 'blue', completed: 'green', confirmed: 'green',
  failed: 'red', refunded: 'orange',
  pending_verification: 'orange', rejected: 'red',
};
const statusTransitions: Record<string, string[]> = {
  draft: ['sent', 'void'], pending_approval: ['void'], approved: ['sent', 'void'], rejected: ['draft', 'void'],
  sent: ['viewed', 'void'], viewed: ['partially_paid', 'paid', 'overdue', 'void'],
  partially_paid: ['paid', 'overdue', 'void'], paid: [], overdue: ['partially_paid', 'paid', 'void'], void: [],
};
const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'online', label: 'Online' },
  { value: 'other', label: 'Other' },
];

function formatStatus(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data: invoice, isLoading } = useInvoice(id!);
  const { data: lineItems, isLoading: lineItemsLoading } = useInvoiceLineItems(id!);
  const { data: payments = [], isLoading: paymentsLoading } = useInvoicePayments(id!);

  const deleteInvoice = useDeleteInvoice();
  const updateStatus = useUpdateInvoiceStatus();
  const createPayment = useCreatePayment();
  const deletePayment = useDeletePayment();
  const confirmPayment = useConfirmPayment();
  const rejectPayment = useRejectPayment();
  const generatePortalLink = useGenerateInvoicePortalLink();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [portalUrl, setPortalUrl] = useState('');
  const [form] = Form.useForm();

  const handleDelete = () => {
    if (!invoice) return;
    showConfirmDialog({
      title: 'Delete Invoice',
      content: `Delete invoice ${invoice.invoice_number || invoice.id}?`,
      onOk: async () => { await deleteInvoice.mutateAsync(invoice.id); navigate('/invoices'); },
      danger: true,
    });
  };

  const handleRecordPayment = async () => {
    const values = await form.validateFields();
    const outstanding = (invoice!.total || 0) - (invoice!.paid_amount || 0);
    if (values.amount > outstanding) {
      form.setFields([{ name: 'amount', errors: [`Cannot exceed outstanding balance of ${formatCurrency(outstanding, invoice!.currency)}`] }]);
      return;
    }
    await createPayment.mutateAsync({
      invoice_id: invoice!.id,
      amount: values.amount,
      method: values.method,
      gateway_transaction_id: values.reference || undefined,
      paid_at: values.paid_at ? values.paid_at.toISOString() : new Date().toISOString(),
      notes: values.notes || undefined,
      received_by: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Staff',
    });
    setPaymentModalOpen(false);
    form.resetFields();
  };

  const handleGeneratePortalLink = () => {
    generatePortalLink.mutate(invoice!.id, {
      onSuccess: (res) => {
        const url = res.data.data?.portal_url || '';
        setPortalUrl(url);
        Modal.success({
          title: 'Customer Portal Link Generated',
          content: (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>Share this link with the customer so they can view the invoice and submit payment:</Text>
              <Text copyable code style={{ wordBreak: 'break-all', fontSize: 12 }}>{url}</Text>
            </Space>
          ),
          okText: 'Copy Link',
          onOk: () => navigator.clipboard.writeText(url),
        });
      },
    });
  };

  if (isLoading) return <div><PageHeader title="Invoice Details" /><Card><Skeleton active /></Card></div>;
  if (!invoice) return <div><PageHeader title="Invoice Not Found" /><Card>Invoice not found</Card></div>;

  const currency = invoice.currency || 'INR';
  const outstanding = Math.max(0, (invoice.total || 0) - (invoice.paid_amount || 0));
  const availableTransitions = statusTransitions[invoice.status] || [];

  const lineItemColumns: ColumnsType<InvoiceLineItem> = [
    { title: 'Type', dataIndex: 'type', render: (t: string) => <Tag>{t.charAt(0).toUpperCase() + t.slice(1)}</Tag> },
    { title: 'Name', dataIndex: 'name', render: (n: string) => <span style={{ fontWeight: 500 }}>{n}</span> },
    { title: 'Description', dataIndex: 'description', render: (d: string) => d || '—' },
    { title: 'Qty', dataIndex: 'quantity' },
    { title: 'Unit Price', dataIndex: 'unit_price', render: (p: number) => formatCurrency(p, currency) },
    { title: 'Tax', dataIndex: 'tax_rate', render: (r: number) => `${r || 0}%` },
    {
      title: 'Discount', dataIndex: 'discount', render: (d: number, r: InvoiceLineItem) => {
        if (!d) return '—';
        return r.discount_type === 'percentage' ? `${d}%` : formatCurrency(d, currency);
      }
    },
    { title: 'Total', dataIndex: 'total', render: (t: number) => <strong>{formatCurrency(t, currency)}</strong> },
  ];

  const paymentColumns: ColumnsType<Payment> = [
    {
      title: 'Amount', dataIndex: 'amount',
      render: (a: number) => <strong style={{ color: '#1a1a2e' }}>{formatCurrency(a, currency)}</strong>,
    },
    {
      title: 'Method', dataIndex: 'method',
      render: (m: string) => <Tag>{PAYMENT_METHODS.find((x) => x.value === m)?.label || formatStatus(m)}</Tag>,
    },
    {
      title: 'Status', dataIndex: 'status',
      render: (s: string) => (
        <Tag color={paymentStatusColors[s] || 'default'}>{formatStatus(s)}</Tag>
      ),
    },
    {
      title: 'Reference / Notes', key: 'ref',
      render: (_: any, r: Payment) => (
        <Space direction="vertical" size={0}>
          {r.gateway_transaction_id && <Text style={{ fontSize: 12 }}>{r.gateway_transaction_id}</Text>}
          {r.notes && <Text type="secondary" style={{ fontSize: 12 }}>{r.notes}</Text>}
        </Space>
      ),
    },
    { title: 'Received By', dataIndex: 'received_by', render: (n: string) => n || <Text type="secondary">—</Text> },
    { title: 'Date', dataIndex: 'paid_at', render: (d: string) => d ? formatDateTime(d) : '—' },
    { title: 'Source', dataIndex: 'source', render: (s: string) => <Tag color={s === 'portal' ? 'blue' : 'default'}>{s === 'portal' ? 'Customer Portal' : 'Manual'}</Tag> },
    {
      title: 'Actions', key: 'actions',
      render: (_: any, r: Payment) => (
        <Space size="small">
          {r.status === 'pending_verification' && (
            <>
              <Tooltip title="Confirm payment">
                <Popconfirm title="Confirm this payment?" onConfirm={() => confirmPayment.mutate(r.id)} okText="Confirm">
                  <Button size="small" type="primary" icon={<CheckCircleOutlined />} />
                </Popconfirm>
              </Tooltip>
              <Tooltip title="Reject payment">
                <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => { setRejectModalOpen(r.id); setRejectReason(''); }} />
              </Tooltip>
            </>
          )}
          {r.status === 'confirmed' && r.source === 'manual' && (
            <Tooltip title="Delete payment record">
              <Popconfirm title="Delete this payment?" description="This will update the invoice balance." onConfirm={() => deletePayment.mutate(r.id)} okText="Delete" okButtonProps={{ danger: true }}>
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Invoice ${invoice.invoice_number || ''}`}
        onBack={() => navigate('/invoices')}
        extra={
          <Space>
            {outstanding > 0 && (
              <PermissionGuard permission="payments:create">
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setPaymentModalOpen(true)}>
                  Record Payment
                </Button>
              </PermissionGuard>
            )}
            <PermissionGuard permission="invoices:update">
              <Button icon={<LinkOutlined />} loading={generatePortalLink.isPending} onClick={handleGeneratePortalLink}>
                Share Invoice
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="invoices:update">
              <Button icon={<EditOutlined />} onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>Edit</Button>
            </PermissionGuard>
            <PermissionGuard permission="invoices:delete">
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>Delete</Button>
            </PermissionGuard>
          </Space>
        }
      />

      {availableTransitions.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <span style={{ fontWeight: 500 }}>Transition to:</span>
            {availableTransitions.map((s) => (
              <Button key={s} type="primary" size="small" loading={updateStatus.isPending}
                onClick={() => updateStatus.mutate({ id: invoice.id, status: s })}>
                {formatStatus(s)}
              </Button>
            ))}
          </Space>
        </Card>
      )}

      {/* Outstanding balance alert */}
      {outstanding > 0 && invoice.status !== 'void' && (
        <Alert
          message={`Outstanding Balance: ${formatCurrency(outstanding, currency)}`}
          description={`Total: ${formatCurrency(invoice.total || 0, currency)} · Paid: ${formatCurrency(invoice.paid_amount || 0, currency)}`}
          type={invoice.status === 'overdue' ? 'error' : 'warning'}
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <PermissionGuard permission="payments:create">
              <Button size="small" type="primary" onClick={() => setPaymentModalOpen(true)}>Record Payment</Button>
            </PermissionGuard>
          }
        />
      )}
      {outstanding === 0 && invoice.status === 'paid' && (
        <Alert message="Invoice Fully Paid" type="success" showIcon style={{ marginBottom: 16 }} />
      )}

      <Card title="Invoice Information">
        <Descriptions column={2} bordered>
          <Descriptions.Item label="Invoice Number">{invoice.invoice_number || '—'}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={statusColors[invoice.status] || 'default'}>{formatStatus(invoice.status)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Customer">
            {invoice.contact ? `${invoice.contact.first_name} ${invoice.contact.last_name}` : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Work Order">
            {invoice.work_order ? invoice.work_order.wo_number || invoice.work_order.summary : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Due Date">{invoice.due_date ? formatDateTime(invoice.due_date) : '—'}</Descriptions.Item>
          <Descriptions.Item label="Currency"><Tag>{currency}</Tag></Descriptions.Item>
          <Descriptions.Item label="Subtotal">{formatCurrency(invoice.subtotal || 0, currency)}</Descriptions.Item>
          <Descriptions.Item label="Tax">{formatCurrency(invoice.tax || 0, currency)}</Descriptions.Item>
          <Descriptions.Item label="Discount">-{formatCurrency(invoice.discount || 0, currency)}</Descriptions.Item>
          <Descriptions.Item label="Total">
            <strong style={{ fontSize: 16 }}>{formatCurrency(invoice.total || 0, currency)}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Paid Amount">
            <span style={{ fontWeight: 500, color: outstanding === 0 ? '#52c41a' : '#faad14' }}>
              {formatCurrency(invoice.paid_amount || 0, currency)}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Balance Due">
            <strong style={{ color: outstanding > 0 ? '#ff4d4f' : '#52c41a' }}>
              {formatCurrency(outstanding, currency)}
            </strong>
          </Descriptions.Item>
          <Descriptions.Item label="Notes" span={2}>{invoice.notes || '—'}</Descriptions.Item>
          <Descriptions.Item label="Created">{formatDateTime(invoice.created_at)}</Descriptions.Item>
          <Descriptions.Item label="Updated">{formatDateTime(invoice.updated_at)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Line Items" style={{ marginTop: 16 }}>
        <Table columns={lineItemColumns} dataSource={lineItems || invoice.line_items || []} rowKey="id"
          loading={lineItemsLoading} pagination={false} locale={{ emptyText: 'No line items' }}
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={7} align="right"><strong>Subtotal</strong></Table.Summary.Cell>
                <Table.Summary.Cell index={1}><strong>{formatCurrency(invoice.subtotal || 0, currency)}</strong></Table.Summary.Cell>
              </Table.Summary.Row>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={7} align="right">Tax</Table.Summary.Cell>
                <Table.Summary.Cell index={1}>{formatCurrency(invoice.tax || 0, currency)}</Table.Summary.Cell>
              </Table.Summary.Row>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={7} align="right">Discount</Table.Summary.Cell>
                <Table.Summary.Cell index={1}>-{formatCurrency(invoice.discount || 0, currency)}</Table.Summary.Cell>
              </Table.Summary.Row>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={7} align="right"><strong style={{ fontSize: 15 }}>Total</strong></Table.Summary.Cell>
                <Table.Summary.Cell index={1}><strong style={{ fontSize: 15 }}>{formatCurrency(invoice.total || 0, currency)}</strong></Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      <Card
        title="Payment History"
        style={{ marginTop: 16 }}
        extra={
          outstanding > 0 && (
            <PermissionGuard permission="payments:create">
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setPaymentModalOpen(true)}>
                Record Payment
              </Button>
            </PermissionGuard>
          )
        }
      >
        <Table columns={paymentColumns} dataSource={payments} rowKey="id" loading={paymentsLoading}
          pagination={false} locale={{ emptyText: 'No payments recorded yet' }}
          rowClassName={(r: Payment) => r.status === 'pending_verification' ? 'ant-table-row-warning' : ''}
        />
      </Card>

      {/* Record Payment Modal */}
      <Modal
        title="Record Payment"
        open={paymentModalOpen}
        onCancel={() => { setPaymentModalOpen(false); form.resetFields(); }}
        onOk={handleRecordPayment}
        confirmLoading={createPayment.isPending}
        okText="Record Payment"
        width={480}
      >
        <Form form={form} layout="vertical" initialValues={{ method: 'cash', paid_at: dayjs() }}>
          <Form.Item name="amount" label="Amount Paid" rules={[{ required: true, message: 'Amount is required' }]}>
            <InputNumber
              style={{ width: '100%' }} size="large" min={0.01}
              max={outstanding}
              prefix="₹"
              placeholder={`Max: ${formatCurrency(outstanding, currency)}`}
            />
          </Form.Item>
          <Form.Item name="method" label="Payment Method" rules={[{ required: true }]}>
            <Select size="large" options={PAYMENT_METHODS} />
          </Form.Item>
          <Form.Item name="paid_at" label="Payment Date">
            <DatePicker style={{ width: '100%' }} size="large" />
          </Form.Item>
          <Form.Item name="reference" label="Reference / Notes (optional)">
            <Input placeholder="e.g. Cheque no. 001234 / UPI Ref TXN456" />
          </Form.Item>
          <Form.Item name="notes" label="Internal Notes (optional)">
            <Input.TextArea rows={2} placeholder="Any additional notes" />
          </Form.Item>
          <div style={{ fontSize: 13, color: '#888' }}>
            Recorded by: <strong>{user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Staff'}</strong>
          </div>
        </Form>
      </Modal>

      {/* Reject Payment Modal */}
      <Modal
        title="Reject Payment"
        open={!!rejectModalOpen}
        onCancel={() => setRejectModalOpen(null)}
        onOk={async () => {
          if (!rejectModalOpen) return;
          await rejectPayment.mutateAsync({ id: rejectModalOpen, reason: rejectReason });
          setRejectModalOpen(null);
        }}
        confirmLoading={rejectPayment.isPending}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <p>Enter the reason for rejecting this payment. The customer will be notified.</p>
        <Input.TextArea rows={3} placeholder="e.g. Payment reference not found, amount mismatch"
          value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
      </Modal>
    </div>
  );
}
