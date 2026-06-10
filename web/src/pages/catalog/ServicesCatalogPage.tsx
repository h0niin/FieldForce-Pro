import { useState, useEffect } from 'react';
import { Button, Table, Space, Tooltip, Tag, Switch } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  useServicesCatalog,
  useUpdateServiceCatalog,
  useDeleteServiceCatalog,
} from '@/hooks/use-services-catalog';
import type { ServiceCatalogItem } from '@/types/models.types';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import SearchFilter from '@/components/common/SearchFilter';
import ServiceQuickCreateDrawer from '@/components/estimates/ServiceQuickCreateDrawer';

export default function ServicesCatalogPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceCatalogItem | null>(null);

  const { data, isLoading } = useServicesCatalog({ page, take: pageSize, search });
  const updateService = useUpdateServiceCatalog();
  const deleteService = useDeleteServiceCatalog();

  const services = data?.data || [];
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

  const openEdit = (record: ServiceCatalogItem) => {
    setEditingItem(record);
    setDrawerOpen(true);
  };

  const handleToggleActive = (record: ServiceCatalogItem) => {
    updateService.mutate({ id: record.id, is_active: !record.is_active });
  };

  const handleDelete = (service: ServiceCatalogItem) => {
    showConfirmDialog({
      title: 'Delete Service',
      content: `Are you sure you want to delete "${service.name}"?`,
      onOk: async () => {
        await deleteService.mutateAsync(service.id);
      },
      danger: true,
    });
  };

  const columns: ColumnsType<ServiceCatalogItem> = [
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
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) =>
        category ? <Tag>{category}</Tag> : <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: 'Default Price',
      dataIndex: 'default_price',
      key: 'default_price',
      render: (price: number | null) =>
        price !== null && price !== undefined
          ? `₹${Number(price).toFixed(2)}`
          : <span style={{ opacity: 0.5 }}>-</span>,
      sorter: (a, b) => (a.default_price || 0) - (b.default_price || 0),
    },
    {
      title: 'Tax Rate',
      dataIndex: 'tax_rate',
      key: 'tax_rate',
      render: (rate: number | null) =>
        rate !== null && rate !== undefined
          ? `${rate}%`
          : <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: 'Duration',
      dataIndex: 'duration_minutes',
      key: 'duration_minutes',
      render: (duration: number | null) =>
        duration !== null && duration !== undefined
          ? `${duration} min`
          : <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: 'Active',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean, record) => (
        <Switch
          checked={active}
          size="small"
          loading={updateService.isPending}
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
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => openEdit(record)}
            />
          </Tooltip>
          <PermissionGuard permission="services-catalog:delete">
            <Tooltip title="Delete">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
                onClick={() => handleDelete(record)}
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
        title="Services Catalog"
        subtitle="Manage your service offerings and pricing"
        extra={
          <PermissionGuard permission="services-catalog:create">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              New Service
            </Button>
          </PermissionGuard>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <SearchFilter
          placeholder="Search services..."
          allowClear
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ width: 400 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={services}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 800 }}
        onRow={(record) => ({
          onClick: () => openEdit(record),
          style: { cursor: 'pointer' },
        })}
        pagination={{
          current: page,
          pageSize,
          total: meta?.itemCount || 0,
          showSizeChanger: true,
          showTotal: (total) => `${total} services`,
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          },
        }}
      />

      <ServiceQuickCreateDrawer
        open={drawerOpen}
        editItem={editingItem}
        onClose={() => { setDrawerOpen(false); setEditingItem(null); }}
        onSuccess={() => { setDrawerOpen(false); setEditingItem(null); }}
      />
    </div>
  );
}
