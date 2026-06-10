import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Table, Space, Tag, Tooltip, Select, Switch } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { usePricebookItems, useDeletePricebookItem, useUpdatePricebookItem } from '@/hooks/use-pricebook';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import SearchFilter from '@/components/common/SearchFilter';

interface PricebookRecord {
  id: string;
  name: string;
  service_id: string;
  tier: string;
  price: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const TIER_COLORS: Record<string, string> = {
  good: 'blue',
  better: 'cyan',
  best: 'gold',
};

export default function PricebookListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string | undefined>(undefined);

  const { data, isLoading } = usePricebookItems({ page, take: pageSize, search } as Record<string, unknown> & { page: number; take: number });
  const deletePricebookItem = useDeletePricebookItem();
  const updatePricebookItem = useUpdatePricebookItem();

  const pricebookItems = ((data?.data || []) as PricebookRecord[]).filter((item) => {
    if (tierFilter && item.tier !== tierFilter) return false;
    return true;
  });
  const meta = data?.meta;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = (record: PricebookRecord) => {
    showConfirmDialog({
      title: t('pricebook.deleteTitle'),
      content: t('pricebook.deleteContent', { name: record.name }),
      onOk: async () => {
        await deletePricebookItem.mutateAsync(record.id);
      },
      danger: true,
    });
  };

  const handleToggleActive = async (record: PricebookRecord, checked: boolean) => {
    await updatePricebookItem.mutateAsync({ id: record.id, is_active: checked });
  };

  const columns: ColumnsType<PricebookRecord> = [
    {
      title: t('pricebook.columns.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => <Link to={`/pricebook/${record.id}`}><span style={{ fontWeight: 500 }}>{name}</span></Link>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('pricebook.columns.tier'),
      dataIndex: 'tier',
      key: 'tier',
      render: (tier: string, record: any) => (
        <Tag color={TIER_COLORS[tier] || 'default'}>
          {tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : '-'}
        </Tag>
      ),
    },
    {
      title: t('pricebook.columns.price'),
      dataIndex: 'price',
      key: 'price',
      render: (price: number, record: any) => `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: t('pricebook.columns.description'),
      dataIndex: 'description',
      key: 'description',
      render: (desc: string, record: any) => (
        <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {desc || <span style={{ opacity: 0.5 }}>-</span>}
        </div>
      ),
    },
    {
      title: t('pricebook.columns.status'),
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean, record) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={isActive}
            onChange={(checked) => handleToggleActive(record, checked)}
            checkedChildren={t('pricebook.statusActive')}
            unCheckedChildren={t('pricebook.statusInactive')}
          />
        </div>
      ),
    },
    {
      title: t('pricebook.columns.actions'),
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard permission="pricebook:update">
            <Tooltip title={t('common.edit')}>
              <Button type="text" icon={<EditOutlined />} size="small" onClick={(e) => { e.stopPropagation(); navigate(`/pricebook/${record.id}/edit`); }} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="pricebook:delete">
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
        title={t('pricebook.title')}
        subtitle={t('pricebook.subtitle')}
        extra={
          <PermissionGuard permission="pricebook:create">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/pricebook/new')}>
              {t('pricebook.add')}
            </Button>
          </PermissionGuard>
        }
      />

      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <SearchFilter
          placeholder={t('pricebook.searchPlaceholder')}
          allowClear
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ width: 400 }}
        />
        <Select
          placeholder={t('pricebook.filterPlaceholder')}
          allowClear
          value={tierFilter}
          onChange={(value) => { setTierFilter(value); setPage(1); }}
          style={{ width: 200 }}
          options={[
            { value: 'good', label: t('pricebook.tiers.good') },
            { value: 'better', label: t('pricebook.tiers.better') },
            { value: 'best', label: t('pricebook.tiers.best') },
          ]}
        />
      </div>

      <Table
        columns={columns}
        dataSource={pricebookItems}
        rowKey="id"
        loading={isLoading}
        onRow={(record) => ({
          onClick: () => navigate(`/pricebook/${record.id}`),
          style: { cursor: 'pointer' },
        })}
        pagination={{
          current: page,
          pageSize,
          total: meta?.itemCount || 0,
          showSizeChanger: true,
          showTotal: (total) => t('pricebook.paginationTotal', { total }),
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            if (newPageSize !== pageSize) {
              setPageSize(newPageSize);
              setPage(1);
            }
          },
        }}
      />
    </div>
  );
}