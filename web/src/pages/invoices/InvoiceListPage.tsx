import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Space, Tooltip, Tag, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useInvoices, useDeleteInvoice } from '@/hooks/use-invoices';
import type { Invoice } from '@/types/models.types';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import SearchFilter from '@/components/common/SearchFilter';
import { formatDateTime } from '@/utils/format-date';
import { formatCurrency } from '@/utils/format-currency';

const statusColors: Record<string, string> = {
  draft: 'default',
  pending_approval: 'gold',
  approved: 'green',
  rejected: 'red',
  sent: 'blue',
  viewed: 'cyan',
  partially_paid: 'gold',
  paid: 'green',
  overdue: 'red',
  void: 'default',
};

export default function InvoiceListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const statusOptions = [
    { value: 'draft', label: t('invoiceList.status.draft') },
    { value: 'sent', label: t('invoiceList.status.sent') },
    { value: 'viewed', label: t('invoiceList.status.viewed') },
    { value: 'partially_paid', label: t('invoiceList.status.partiallyPaid') },
    { value: 'paid', label: t('invoiceList.status.paid') },
    { value: 'overdue', label: t('invoiceList.status.overdue') },
    { value: 'void', label: t('invoiceList.status.void') },
  ];

  function formatStatus(status: string): string {
    return t(`invoiceList.status.${status.toLowerCase().replace(/_/g, '')}`);
  }

  const { data, isLoading } = useInvoices({ page, take: pageSize, search });
  const deleteInvoice = useDeleteInvoice();

  const invoices = data?.data || [];
  const meta = data?.meta;

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter && inv.status !== statusFilter) return false;
    return true;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = (invoice: Invoice) => {
    showConfirmDialog({
      title: t('invoiceList.actions.deleteTitle'),
      content: t('invoiceList.actions.deleteConfirm', { number: invoice.invoice_number || invoice.id }),
      onOk: async () => {
        await deleteInvoice.mutateAsync(invoice.id);
      },
      danger: true,
    });
  };

  const columns: ColumnsType<Invoice> = [
    {
      title: t('invoiceList.columns.invoiceNumber'),
      dataIndex: 'invoice_number',
      key: 'invoice_number',
      render: (num: string, record: any) => <span style={{ fontWeight: 500 }}>{num || '-'}</span>,
    },
    {
      title: t('invoiceList.columns.customer'),
      key: 'contact',
      render: (_, record) =>
        record.contact
          ? `${record.contact.first_name} ${record.contact.last_name}`
          : <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('invoiceList.columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: any) => (
        <Tag color={statusColors[status] || 'default'}>
          {formatStatus(status)}
        </Tag>
      ),
    },
    {
      title: t('invoiceList.columns.subtotal'),
      dataIndex: 'subtotal',
      key: 'subtotal',
      render: (amount: number, record) => formatCurrency(amount || 0, record.currency),
    },
    {
      title: t('invoiceList.columns.tax'),
      dataIndex: 'tax',
      key: 'tax',
      render: (amount: number, record) => formatCurrency(amount || 0, record.currency),
    },
    {
      title: t('invoiceList.columns.total'),
      dataIndex: 'total',
      key: 'total',
      render: (amount: number, record) => (
        <span style={{ fontWeight: 500 }}>{formatCurrency(amount || 0, record.currency)}</span>
      ),
      sorter: (a, b) => (a.total || 0) - (b.total || 0),
    },
    {
      title: t('invoiceList.columns.dueDate'),
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date: string, record: any) => date ? formatDateTime(date) : <span style={{ opacity: 0.5 }}>-</span>,
      sorter: (a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      },
    },
    {
      title: t('invoiceList.columns.paidAmount'),
      dataIndex: 'paid_amount',
      key: 'paid_amount',
      render: (amount: number, record) => formatCurrency(amount || 0, record.currency),
    },
    {
      title: t('invoiceList.columns.currency'),
      dataIndex: 'currency',
      key: 'currency',
      render: (currency: string, record: any) => <Tag>{currency || 'USD'}</Tag>,
    },
    {
      title: t('invoiceList.columns.actions'),
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard permission="invoices:update">
            <Tooltip title={t('common.edit')}>
              <Button type="text" icon={<EditOutlined />} size="small" onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${record.id}/edit`); }} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="invoices:delete">
            <Tooltip title={t('common.delete')}>
              <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={(e) => { e.stopPropagation(); handleDelete(record); }} />
            </Tooltip>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('nav.invoices')}
        subtitle={t('invoiceList.manageInvoices')}
      />

      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <SearchFilter
          placeholder={t('invoiceList.searchPlaceholder')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Select
          placeholder={t('invoiceList.filterStatus')}
          allowClear
          value={statusFilter}
          onChange={(value) => setStatusFilter(value)}
          options={statusOptions}
          style={{ width: 180 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredInvoices}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 1600 }}
        onRow={(record) => ({
          onClick: () => navigate(`/invoices/${record.id}`),
          style: { cursor: 'pointer' },
        })}
        pagination={{
          current: page,
          pageSize,
          total: meta?.itemCount || 0,
          showSizeChanger: true,
          showTotal: (total) => t('invoiceList.paginationTotal', { total }),
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          },
        }}
      />
    </div>
  );
}