import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Tag, Tabs, Tooltip, Space, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useJobSheetInstances, useMyJobSheetDrafts, useMyJobSheetApprovals } from '@/hooks/use-job-sheets';
import { useDocumentApprovals, useProcessApproval } from '@/hooks/use-workflow';
import type { JobSheetInstance } from '@/types/models.types';
import PageHeader from '@/components/common/PageHeader';
import { formatDateTime } from '@/utils/format-date';
import SearchFilter from '@/components/common/SearchFilter';

const statusColors: Record<string, string> = {
  draft: 'default',
  pending: 'blue',
  approved: 'cyan',
  in_progress: 'orange',
  completed: 'green',
};

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function JobSheetListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all');

  // Per-tab pagination
  const [allPage, setAllPage] = useState(1);
  const [allPageSize, setAllPageSize] = useState(10);
  const [draftsPage, setDraftsPage] = useState(1);
  const [draftsPageSize, setDraftsPageSize] = useState(10);
  const [approvalsPage, setApprovalsPage] = useState(1);
  const [approvalsPageSize, setApprovalsPageSize] = useState(10);

  // Shared search
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Queries for each tab — only enabled when active
  const allQuery = useJobSheetInstances(
    { page: allPage, take: allPageSize, search },
    activeTab === 'all',
  );
  const draftsQuery = useMyJobSheetDrafts(
    { page: draftsPage, take: draftsPageSize, search },
    activeTab === 'drafts',
  );
  const approvalsQuery = useMyJobSheetApprovals(
    { page: approvalsPage, take: approvalsPageSize, search },
    activeTab === 'approvals',
  );

  // Fetch pending JOB_SHEET approval records to map document_id → approval_id
  const { data: pendingApprovals } = useDocumentApprovals(
    activeTab === 'approvals'
      ? { document_type: 'JOB_SHEET_APPROVAL', status: 'PENDING' }
      : undefined,
  );
  const processApproval = useProcessApproval();

  const approvalMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (pendingApprovals?.data) {
      for (const approval of pendingApprovals.data) {
        if (!map[approval.document_id]) {
          map[approval.document_id] = approval.id;
        }
      }
    }
    return map;
  }, [pendingApprovals]);

  // Pick active query
  const currentQuery = activeTab === 'all' ? allQuery : activeTab === 'drafts' ? draftsQuery : approvalsQuery;
  const instances = currentQuery.data?.data || [];
  const meta = currentQuery.data?.meta;
  const isLoading = currentQuery.isLoading;

  // Current pagination setters
  const currentPage = activeTab === 'all' ? allPage : activeTab === 'drafts' ? draftsPage : approvalsPage;
  const currentPageSize = activeTab === 'all' ? allPageSize : activeTab === 'drafts' ? draftsPageSize : approvalsPageSize;
  const setCurrentPage = activeTab === 'all' ? setAllPage : activeTab === 'drafts' ? setDraftsPage : setApprovalsPage;
  const setCurrentPageSize = activeTab === 'all' ? setAllPageSize : activeTab === 'drafts' ? setDraftsPageSize : setApprovalsPageSize;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setAllPage(1);
      setDraftsPage(1);
      setApprovalsPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSearchInput('');
    setSearch('');
  };

  const columns: ColumnsType<JobSheetInstance> = [
    {
      title: t('jobSheetList.workOrder'),
      key: 'work_order',
      render: (_, record) =>
        record.work_order?.wo_number
          ? <span>{record.work_order.wo_number}</span>
          : <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('jobSheetList.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {formatStatus(status)}
        </Tag>
      ),
    },
    {
      title: t('jobSheetList.created'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDateTime(date),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: t('jobSheetList.updated'),
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('jobSheetList.actions'),
      key: 'actions',
      fixed: 'right',
      width: activeTab === 'approvals' ? 200 : 120,
      render: (_, record) => (
        <Space>
          <Tooltip title={t('jobSheetList.view')}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => navigate(`/job-sheets/${record.id}`)}
            />
          </Tooltip>
          {record.status === 'draft' && (
            <Tooltip title={t('jobSheetList.completeDraft')}>
              <Button
                type="text"
                icon={<PlusOutlined />}
                size="small"
                style={{ color: '#1677ff' }}
                onClick={() => navigate(`/job-sheets/${record.id}/edit`)}
              />
            </Tooltip>
          )}
          {activeTab === 'approvals' && approvalMap[record.id] && (
            <>
              <Popconfirm
                title={t('jobSheetList.approveConfirm')}
                onConfirm={() =>
                  processApproval.mutateAsync({
                    id: approvalMap[record.id],
                    action: 'APPROVE',
                  })
                }
                okText={t('jobSheetList.approve')}
                cancelText={t('jobSheetList.cancel')}
              >
                <Tooltip title={t('jobSheetList.approve')}>
                  <Button
                    type="text"
                    icon={<CheckOutlined />}
                    size="small"
                    style={{ color: '#52c41a' }}
                    loading={processApproval.isPending}
                  />
                </Tooltip>
              </Popconfirm>
              <Popconfirm
                title={t('jobSheetList.rejectConfirm')}
                onConfirm={() =>
                  processApproval.mutateAsync({
                    id: approvalMap[record.id],
                    action: 'REJECT',
                  })
                }
                okText={t('jobSheetList.reject')}
                okButtonProps={{ danger: true }}
                cancelText={t('jobSheetList.cancel')}
              >
                <Tooltip title={t('jobSheetList.reject')}>
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    size="small"
                    style={{ color: '#ff4d4f' }}
                    loading={processApproval.isPending}
                  />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  const tabItems = [
    { key: 'all', label: t('jobSheetList.allJobSheets') },
    { key: 'drafts', label: t('jobSheetList.drafts') },
    { key: 'approvals', label: t('jobSheetList.approvals') },
  ];

  return (
    <div>
      <PageHeader
        title={t('jobSheetList.title')}
        subtitle={t('jobSheetList.subtitle')}
      />

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <SearchFilter
          placeholder={t('jobSheetList.searchPlaceholder')}
          allowClear
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ width: 400 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={instances}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: currentPage,
          pageSize: currentPageSize,
          total: meta?.itemCount || 0,
          showSizeChanger: true,
          showTotal: (total) => t('jobSheetList.totalItems', { total }),
          onChange: (newPage, newPageSize) => {
            setCurrentPage(newPage);
            setCurrentPageSize(newPageSize);
          },
        }}
      />
    </div>
  );
}