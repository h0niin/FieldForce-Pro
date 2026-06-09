import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Table, Space, Tooltip, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useServicesCatalog, useDeleteServiceCatalog } from '@/hooks/use-services-catalog';
import type { ServiceCatalogItem } from '@/types/models.types';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatCurrency } from '@/utils/format-currency';
import SearchFilter from '@/components/common/SearchFilter';

export default function ServicesCatalogPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useServicesCatalog({ page, take: pageSize, search });
  const deleteService = useDeleteServiceCatalog();

  const services = data?.data || [];
  const meta = data?.meta;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = (service: ServiceCatalogItem) => {
    showConfirmDialog({
      title: t('servicesCatalog.deleteService'),
      content: t('servicesCatalog.confirmDelete', { name: service.name }),
      onOk: async () => {
        await deleteService.mutateAsync(service.id);
      },
      danger: true,
    });
  };

  const columns: ColumnsType<ServiceCatalogItem> = [
    {
      title: t('servicesCatalog.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => <Link to={`/catalog/services/${record.id}`}><span style={{ fontWeight: 500 }}>{name}</span></Link>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('servicesCatalog.category'),
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => category ? <Tag>{category}</Tag> : <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('servicesCatalog.price'),
      dataIndex: 'default_price',
      key: 'default_price',
      render: (price: number | null) =>
        price !== null && price !== undefined ? formatCurrency(price) : <span style={{ opacity: 0.5 }}>-</span>,
      sorter: (a, b) => (a.default_price || 0) - (b.default_price || 0),
    },
    {
      title: t('servicesCatalog.duration'),
      dataIndex: 'duration_minutes',
      key: 'duration_minutes',
      render: (duration: number | null) =>
        duration !== null && duration !== undefined ? t('servicesCatalog.durationUnit', { duration }) : <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('servicesCatalog.taxRate'),
      dataIndex: 'tax_rate',
      key: 'tax_rate',
      render: (rate: number | null) =>
        rate !== null && rate !== undefined ? `${rate}%` : <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('servicesCatalog.active'),
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) =>
        active ? <Tag color="green">{t('servicesCatalog.statusActive')}</Tag> : <Tag color="red">{t('servicesCatalog.statusInactive')}</Tag>,
    },
    {
      title: t('servicesCatalog.actions'),
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard permission="services-catalog:update">
            <Tooltip title={t('servicesCatalog.edit')}>
              <Button type="text" icon={<EditOutlined />} size="small" onClick={() => navigate(`/catalog/services/${record.id}/edit`)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="services-catalog:delete">
            <Tooltip title={t('servicesCatalog.delete')}>
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
        title={t('servicesCatalog.title')}
        subtitle={t('servicesCatalog.subtitle')}
        extra={
          <PermissionGuard permission="services-catalog:create">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/catalog/services/new')}>
              {t('servicesCatalog.addService')}
            </Button>
          </PermissionGuard>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <SearchFilter
          placeholder={t('servicesCatalog.searchPlaceholder')}
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
        pagination={{
          current: page,
          pageSize,
          total: meta?.itemCount || 0,
          showSizeChanger: true,
          showTotal: (total) => t('servicesCatalog.totalServices', { total }),
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          },
        }}
      />
    </div>
  );
}