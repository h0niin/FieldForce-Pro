import { useState, useEffect } from 'react';
import { Button, Table, Space, Tooltip, Tag, Switch } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  usePartsCatalog,
  useUpdatePartsCatalog,
  useDeletePartsCatalog,
} from '@/hooks/use-parts-catalog';
import type { PartsCatalogItem } from '@/types/models.types';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import SearchFilter from '@/components/common/SearchFilter';
import PartQuickCreateDrawer from '@/components/estimates/PartQuickCreateDrawer';

export default function PartsCatalogPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PartsCatalogItem | null>(null);

  const { data, isLoading } = usePartsCatalog({ page, take: pageSize, search });
  const updatePart = useUpdatePartsCatalog();
  const deletePart = useDeletePartsCatalog();

  const parts = data?.data || [];
  const meta = data?.meta;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const openCreate = () => {
    setEditingItem(null);
    setDrawerOpen(true);
  };

  const openEdit = (record: PartsCatalogItem) => {
    setEditingItem(record);
    setDrawerOpen(true);
  };

  const handleToggleActive = (record: PartsCatalogItem) => {
    updatePart.mutate({ id: record.id, is_active: !record.is_active });
  };

  const handleDelete = (part: PartsCatalogItem) => {
    showConfirmDialog({
      title: 'Delete Part',
      content: `Are you sure you want to delete "${part.name}"?`,
      onOk: async () => {
        await deletePart.mutateAsync(part.id);
      },
      danger: true,
    });
  };

  const columns: ColumnsType<PartsCatalogItem> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <span
          style={{ fontWeight: 500, color: '#1890ff', cursor: 'pointer' }}
          onClick={() => openEdit(record)}
        >
          {name}
        </span>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      render: (sku: string) => sku || <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) =>
        category ? <Tag>{category}</Tag> : <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: 'Unit Price',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price: number | null) =>
        price !== null && price !== undefined
          ? `₹${Number(price).toFixed(2)}`
          : <span style={{ opacity: 0.5 }}>-</span>,
      sorter: (a, b) => (a.unit_price || 0) - (b.unit_price || 0),
    },
    {
      title: 'Stock Qty',
      key: 'stock_qty',
      render: (_, record) => {
        const isLow = record.stock_qty <= record.reorder_level;
        return (
          <span style={{ color: isLow ? '#ef4444' : undefined, fontWeight: isLow ? 600 : undefined }}>
            {record.stock_qty}
            {isLow && (
              <Tag color="red" style={{ marginLeft: 6, fontSize: 11 }}>
                Low
              </Tag>
            )}
          </span>
        );
      },
      sorter: (a, b) => a.stock_qty - b.stock_qty,
    },
    {
      title: 'Reorder Level',
      dataIndex: 'reorder_level',
      key: 'reorder_level',
      render: (level: number) =>
        level !== null && level !== undefined ? level : <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
      render: (supplier: string) => supplier || <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: 'Active',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean, record) => (
        <Switch
          checked={active}
          size="small"
          loading={updatePart.isPending}
          onChange={() => handleToggleActive(record)}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard permission="parts-catalog:update">
            <Tooltip title="Edit">
              <Button
                type="text"
                icon={<EditOutlined />}
                size="small"
                onClick={(e) => { e.stopPropagation(); openEdit(record); }}
              />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="parts-catalog:delete">
            <Tooltip title="Delete">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
                onClick={(e) => { e.stopPropagation(); handleDelete(record); }}
              />
            </Tooltip>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Parts Catalog"
        subtitle="Manage your parts inventory and pricing"
        extra={
          <PermissionGuard permission="parts-catalog:create">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              New Part
            </Button>
          </PermissionGuard>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <SearchFilter
          placeholder="Search parts..."
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
        scroll={{ x: 900 }}
        onRow={(record) => ({
          onClick: () => openEdit(record),
          style: { cursor: 'pointer' },
        })}
        pagination={{
          current: page,
          pageSize,
          total: meta?.itemCount || 0,
          showSizeChanger: true,
          showTotal: (total) => `${total} parts`,
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          },
        }}
      />

      <PartQuickCreateDrawer
        open={drawerOpen}
        editItem={editingItem}
        onClose={() => { setDrawerOpen(false); setEditingItem(null); }}
        onSuccess={() => { setDrawerOpen(false); setEditingItem(null); }}
      />
    </div>
  );
}
