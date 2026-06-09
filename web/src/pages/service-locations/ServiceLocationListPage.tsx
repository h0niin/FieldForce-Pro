import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Table, Space, Tooltip, Badge, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';
import SearchFilter from '@/components/common/SearchFilter';
import { useServiceLocations, useDeleteServiceLocation } from '@/hooks/use-service-locations';
import type { ServiceLocation } from '@/types/models.types';

export default function ServiceLocationListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useServiceLocations({
    page,
    take: pageSize,
    search,
  });

  const deleteServiceLocation = useDeleteServiceLocation();

  const locations = data?.data || [];
  const meta = data?.meta;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = (location: ServiceLocation) => {
    showConfirmDialog({
      title: t('serviceLocations.deleteTitle'),
      content: t('serviceLocations.deleteConfirm', { address: location.address }),
      onOk: async () => {
        await deleteServiceLocation.mutateAsync(location.id);
      },
      danger: true,
    });
  };

  const columns: ColumnsType<ServiceLocation> = [
    {
      title: t('serviceLocations.columns.address'),
      dataIndex: 'address',
      key: 'address',
      render: (address: string, record: any) => (
        <Link to={`/service-locations/${record.id}`}>
          <Space>
            <EnvironmentOutlined style={{ color: '#5B8FF9' }} />
            <span style={{ fontWeight: 500 }}>{address}</span>
          </Space>
        </Link>
      ),
    },
    {
      title: t('serviceLocations.columns.accessNotes'),
      dataIndex: 'access_notes',
      key: 'access_notes',
      render: (notes: string | null, record: any) => notes || <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('serviceLocations.columns.gateCode'),
      dataIndex: 'gate_code',
      key: 'gate_code',
      render: (code: string | null, record: any) => code ? (
        <Badge count={code} style={{ backgroundColor: '#52c41a' }} />
      ) : <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('serviceLocations.columns.coordinates'),
      key: 'coordinates',
      render: (_, record) => {
        if (record.lat && record.lng) {
          return (
            <Tooltip title={t('serviceLocations.tooltips.viewOnMap')}>
              <a onClick={(e) => {
                e.preventDefault();
                window.open(`https://maps.google.com/?q=${record.lat},${record.lng}`, '_blank');
              }}>
                {Number(record.lat).toFixed(6)}, {Number(record.lng).toFixed(6)}
              </a>
            </Tooltip>
          );
        }
        return <span style={{ color: '#999' }}>{t('serviceLocations.notSet')}</span>;
      },
    },
    {
      title: t('serviceLocations.columns.territory', 'Territory'),
      key: 'territory',
      render: (_, record: any) => {
        const territory = record.custom_fields?.territory;
        if (territory && territory !== 'Out of Bounds') {
          return <Tag color="blue">{territory}</Tag>;
        } else if (territory === 'Out of Bounds') {
          return <Tag color="red">{territory}</Tag>;
        }
        return <span style={{ opacity: 0.5 }}>-</span>;
      },
    },
    {
      title: t('serviceLocations.columns.created'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string, record: any) => formatDateTime(date),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: t('serviceLocations.columns.actions'),
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          {/* removed view */}
          <PermissionGuard permission="service_locations:update">
            <Tooltip title={t('common.edit')}>
              <Button
                type="text"
                icon={<EditOutlined />}
                size="small"
                onClick={() => navigate(`/service-locations/${record.id}/edit`)}
              />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="service_locations:delete">
            <Tooltip title={t('common.delete')}>
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
        title={t('nav.serviceLocations')}
        subtitle="Maintain a centralized directory of standard client addresses and service points. Service locations ensure records remain uniform, reducing data entry errors and saving time when creating recurring service contracts or schedules."
        extra={
          <PermissionGuard permission="service_locations:create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/service-locations/new')}
            >
              {t('serviceLocations.addServiceLocation')}
            </Button>
          </PermissionGuard>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <SearchFilter
          placeholder={t('serviceLocations.searchPlaceholder')}
          allowClear
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ width: 400 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={locations}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: meta?.itemCount || 0,
          showSizeChanger: true,
          showTotal: (total) => t('serviceLocations.totalLocations', { total }),
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          },
        }}
      />
    </div>
  );
}