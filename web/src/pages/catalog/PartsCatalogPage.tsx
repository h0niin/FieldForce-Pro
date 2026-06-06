import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Space, Tooltip, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usePartsCatalog, useDeletePartsCatalog } from '@/hooks/use-parts-catalog';
import type { PartsCatalogItem } from '@/types/models.types';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatCurrency } from '@/utils/format-currency';
import SearchFilter from '@/components/common/SearchFilter';

export default function PartsCatalogPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = usePartsCatalog({ page, take: pageSize, search });
  const deletePart = useDeletePartsCatalog();

  const parts = data?.data || [];
  const meta = data?.meta;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = (part: PartsCatalogItem) => {
    showConfirmDialog({
      title: t('partsCatalog.deletePart'),
      content: t('partsCatalog.deleteConfirm', { name: part.name }),
      onOk: async () => {
        await deletePart.mutateAsync(part.id);
      },
      danger: true,
    });
  };

  const columns: ColumnsType<PartsCatalogItem> = [
    {
      title: t('partsCatalog.columns.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('partsCatalog.columns.sku'),
      dataIndex: 'sku',
      key: 'sku',
      render: (sku: string) => sku || <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('partsCatalog.columns.category'),
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => category ? <Tag>{category}</Tag> : <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('partsCatalog.columns.price'),
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price: number | null) =>
        price !== null && price !== undefined ? formatCurrency(price) : <span style={{ opacity: 0.5 }}>-</span>,
      sorter: (a, b) => (a.unit_price || 0) - (b.unit_price || 0),
    },
    {
      title: t('partsCatalog.columns.stockQty'),
      key: 'stock_qty',
      render: (_, record) => {
        const isLowStock = record.stock_qty <= record.reorder_level;
        return (
          <Space>
            <span>{record.stock_qty}</span>
            {isLowStock && <Tag color="red">{t('partsCatalog.lowStock')}</Tag>}
          </Space>
        );
      },
      sorter: (a, b) => a.stock_qty - b.stock_qty,
    },
    {
      title: t('partsCatalog.columns.supplier'),
      dataIndex: 'supplier',
      key: 'supplier',
      render: (supplier: string) => supplier || <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('partsCatalog.columns.active'),
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) =>
        active ? <Tag color="green">{t('partsCatalog.active')}</Tag> : <Tag color="red">{t('partsCatalog.inactive')}</Tag>,
    },
    {
      title: t('partsCatalog.columns.actions'),
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard permission="parts-catalog:read">
            <Tooltip title={t('partsCatalog.actions.view')}>
              <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => navigate(`/catalog/parts/${record.id}`)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="parts-catalog:update">
            <Tooltip title={t('partsCatalog.actions.edit')}>
              <Button type="text" icon={<EditOutlined />} size="small" onClick={() => navigate(`/catalog/parts/${record.id}/edit`)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="parts-catalog:delete">
            <Tooltip title={t('partsCatalog.actions.delete')}>
              <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record)} />
            </Tooltip>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('partsCatalog.title')}
        subtitle={t('partsCatalog.subtitle')}
        extra={
          <PermissionGuard permission="parts-catalog:create">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/catalog/parts/new')}>
              {t('partsCatalog.addPart')}
            </Button>
          </PermissionGuard>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <SearchFilter
          placeholder={t('partsCatalog.searchPlaceholder')}
          allowClear
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ width: 400 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={parts}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: meta?.itemCount || 0,
          showSizeChanger: true,
          showTotal: (total) => t('partsCatalog.paginationTotal', { total }),
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          },
        }}
      />
    </div>
  );
}