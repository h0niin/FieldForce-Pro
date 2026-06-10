import React from 'react';
import { Table, Button, Card, Space, Tag } from 'antd';
import { PlusOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { invoicesApi } from '@/api/invoices.api';
import { paymentsApi } from '@/api/payments.api';
import { formatCurrency } from '@/utils/format-currency';
import { formatDateTime } from '@/utils/format-date';

interface EntityBillingTabProps {
  companyId?: string;
  contactId?: string;
}

export const EntityBillingTab: React.FC<EntityBillingTabProps> = ({ companyId, contactId }) => {
  const navigate = useNavigate();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', { companyId, contactId }],
    queryFn: async () => {
      const response = await invoicesApi.getAll({ company_id: companyId, contact_id: contactId } as any);
      return response.data.data;
    },
    enabled: !!companyId || !!contactId,
  });

  const columns = [
    {
      title: 'Invoice #',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
      render: (text: string, record: any) => (
        <a onClick={() => navigate(`/invoices/${record.id}`)}>{text || 'Draft'}</a>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'paid') color = 'success';
        if (status === 'overdue') color = 'error';
        if (status === 'partially_paid') color = 'warning';
        if (status === 'sent') color = 'processing';
        return <Tag color={color}>{status.replace('_', ' ').toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (amount: number, record: any) => formatCurrency(amount, record.currency || 'USD'),
    },
    {
      title: 'Balance Due',
      key: 'balance',
      render: (_: any, record: any) => {
        const balance = Number(record.total) - Number(record.paid_amount || 0);
        return formatCurrency(balance, record.currency || 'USD');
      },
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="text"
            icon={<FilePdfOutlined />}
            onClick={() => window.open(`/api/invoices/${record.id}/pdf`, '_blank')}
          />
        </Space>
      ),
    },
  ];

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', { companyId, contactId }],
    queryFn: async () => {
      const response = await paymentsApi.getAll({ company_id: companyId, contact_id: contactId } as any);
      return response.data.data;
    },
    enabled: !!companyId || !!contactId,
  });

  const paymentColumns = [
    {
      title: 'Payment #',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <a onClick={() => navigate(`/payments/${id}`)}>{id.substring(0, 8)}</a>,
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      render: (m: string) => <Tag>{m}</Tag>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: any) => formatCurrency(amount, record.currency || 'USD'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'completed' || status === 'confirmed') color = 'success';
        if (status === 'pending') color = 'warning';
        if (status === 'failed' || status === 'rejected') color = 'error';
        return <Tag color={color}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'paid_at',
      key: 'paid_at',
      render: (date: string) => formatDateTime(date),
    },
  ];

  return (
    <Card title="Billing">
      <Table
        dataSource={invoices}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 5 }}
        title={() => (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold' }}>Invoices</span>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                const params = new URLSearchParams();
                if (companyId) params.append('company_id', companyId);
                if (contactId) params.append('contact_id', contactId);
                navigate(`/invoices/new?${params.toString()}`);
              }}
            >
              Create Invoice
            </Button>
          </div>
        )}
        style={{ marginBottom: 24 }}
      />

      <Table
        dataSource={payments}
        columns={paymentColumns}
        rowKey="id"
        loading={paymentsLoading}
        pagination={{ pageSize: 5 }}
        title={() => (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold' }}>Payments</span>
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                const params = new URLSearchParams();
                if (companyId) params.append('company_id', companyId);
                if (contactId) params.append('contact_id', contactId);
                navigate(`/payments/new?${params.toString()}`);
              }}
            >
              Record Payment
            </Button>
          </div>
        )}
      />
    </Card>
  );
};
