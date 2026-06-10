import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Table, Space, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, GlobalOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useCompanies, useDeleteCompany } from '@/hooks/use-companies';
import type { Company } from '@/types/models.types';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';
import SearchFilter from '@/components/common/SearchFilter';
import { UploadOutlined, DownloadOutlined, UserSwitchOutlined, MergeCellsOutlined } from '@ant-design/icons';
import { CompanyImportModal, CompanyChangeOwnerModal, CompanyMergeModal } from './components/CompanyBulkModals';
import { companiesApi } from '@/api/companies.api';

export default function CompanyListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useCompanies({ page, take: pageSize, search });
  const deleteCompany = useDeleteCompany();

  const companies = data?.data || [];
  const meta = data?.meta;

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<Company[]>([]);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isChangeOwnerModalOpen, setIsChangeOwnerModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

  const handleExport = async (ids?: string[]) => {
    try {
      const response = await companiesApi.exportCsv(ids);
      const url = window.URL.createObjectURL(new Blob([response.data as any]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'companies.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export', error);
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // Reset to first page when search changes
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = (company: Company) => {
    showConfirmDialog({
      title: t('companies.deleteCompany'),
      content: t('companies.confirmDelete', { name: company.name }),
      onOk: async () => {
        await deleteCompany.mutateAsync(company.id);
      },
      danger: true,
    });
  };

  const columns: ColumnsType<Company> = [
    {
      title: t('companies.columns.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (<Link to={`/companies/${record.id}`}><span style={{ fontWeight: 500 }}>{name}</span></Link>),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('companies.columns.industry'),
      dataIndex: 'industry',
      key: 'industry',
      render: (industry: string, record: any) => industry || <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('companies.columns.taxId'),
      dataIndex: 'tax_id',
      key: 'tax_id',
      render: (tax_id: string, record: any) => tax_id || <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('companies.columns.website'),
      dataIndex: 'website',
      key: 'website',
      render: (website: string, record: any) =>
        website ? (
          <Space>
            <GlobalOutlined />
            <a href={website} target="_blank" rel="noopener noreferrer">
              {website}
            </a>
          </Space>
        ) : (
          <span style={{ opacity: 0.5 }}>-</span>
        ),
    },
    {
      title: t('companies.columns.created'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string, record: any) => formatDateTime(date),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: t('companies.columns.actions'),
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard permission="companies:read">
            <Tooltip title={t('common.view') || 'View'}>
              <Button
                type="text"
                icon={<EyeOutlined />}
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/companies/${record.id}`);
                }}
              />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="companies:update">
            <Tooltip title={t('common.edit')}>
              <Button
                type="text"
                icon={<EditOutlined />}
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/companies/${record.id}/edit`);
                }}
              />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="companies:delete">
            <Tooltip title={t('common.delete')}>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(record);
                }}
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
        title={t('nav.companies')}
        subtitle={t('companies.manageCompanies')}
        extra={
          <Space>
            <PermissionGuard permission="companies:create">
              <Button icon={<DownloadOutlined />} onClick={() => setIsImportModalOpen(true)}>
                Import
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="companies:read">
              <Button icon={<UploadOutlined />} onClick={() => handleExport()}>
                Export
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="companies:create">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/companies/new')}
              >
                {t('companies.addCompany')}
              </Button>
            </PermissionGuard>
          </Space>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <SearchFilter
          placeholder={t('companies.searchPlaceholder')}
          allowClear
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ width: 400 }}
        />
      </div>

      {selectedRowKeys.length > 0 && (
        <div style={{ marginBottom: 16, padding: '8px 16px', background: '#f0f5ff', border: '1px solid #adc6ff', borderRadius: 4 }}>
          <Space>
            <span style={{ marginRight: 8 }}>{selectedRowKeys.length} items selected</span>
            <PermissionGuard permission="companies:update">
              <Button size="small" icon={<UserSwitchOutlined />} onClick={() => setIsChangeOwnerModalOpen(true)}>
                Change Owner
              </Button>
            </PermissionGuard>
            {selectedRowKeys.length === 2 && (
              <PermissionGuard permission="companies:delete">
                <Button size="small" type="primary" danger icon={<MergeCellsOutlined />} onClick={() => setIsMergeModalOpen(true)}>
                  Merge Records
                </Button>
              </PermissionGuard>
            )}
            <PermissionGuard permission="companies:read">
              <Button size="small" icon={<UploadOutlined />} onClick={() => handleExport(selectedRowKeys as string[])}>
                Export Selected
              </Button>
            </PermissionGuard>
            <Button size="small" onClick={() => { setSelectedRowKeys([]); setSelectedRecords([]); }}>Clear</Button>
          </Space>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={companies}
        rowKey="id"
        loading={isLoading}
        rowSelection={{
          selectedRowKeys,
          onChange: (newSelectedRowKeys, newSelectedRecords) => {
            setSelectedRowKeys(newSelectedRowKeys);
            setSelectedRecords(newSelectedRecords as Company[]);
          },
        }}
        onRow={(record) => ({
          onClick: () => navigate(`/companies/${record.id}`),
          style: { cursor: 'pointer' },
        })}
        pagination={{
          current: page,
          pageSize,
          total: meta?.itemCount || 0,
          showSizeChanger: true,
          showTotal: (total) => t('companies.totalCompanies', { total }),
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          },
        }}
      />

      <CompanyImportModal open={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
      <CompanyChangeOwnerModal 
        open={isChangeOwnerModalOpen} 
        onClose={() => { setIsChangeOwnerModalOpen(false); setSelectedRowKeys([]); setSelectedRecords([]); }} 
        selectedIds={selectedRowKeys as string[]} 
      />
      <CompanyMergeModal 
        open={isMergeModalOpen} 
        onClose={() => { setIsMergeModalOpen(false); setSelectedRowKeys([]); setSelectedRecords([]); }} 
        selectedRecords={selectedRecords} 
      />
    </div>
  );
}