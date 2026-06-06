import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Table, Space, Tooltip, Tag, Tabs, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EyeOutlined, InfoCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { useTranslation } from 'react-i18next';
import { useEstimates, useMyEstimateDrafts, useMyEstimateApprovals, useEstimateAssignedCreator, useAdminApproveEstimate, useAdminRejectEstimate } from '@/hooks/use-estimates';
import EstimateInternalReviewCard from '@/components/estimates/EstimateInternalReviewCard';
import SendEstimateModal from '@/components/estimates/SendEstimateModal';
import { usePermission } from '@/components/permissions/usePermission';
import { useAuthStore } from '@/store/auth.store';
import type { Estimate } from '@/types/models.types';
import PageHeader from '@/components/common/PageHeader';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';
import { formatCurrency } from '@/utils/format-currency';
import SearchFilter from '@/components/common/SearchFilter';

const statusColors: Record<string, string> = {
  draft: 'default',
  pending_approval: 'orange',
  sent: 'blue',
  viewed: 'cyan',
  approved: 'green',
  rejected: 'red',
  expired: 'orange',
  converted_to_wo: 'purple',
  converted_to_invoice: 'geekblue',
};

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function EstimateListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = usePermission();
  const user = useAuthStore((s) => s.user);

  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    // Map old 'internal-review' to 'review' for backwards compat
    if (tabParam === 'internal-review') return 'review';
    return tabParam && ['all', 'drafts', 'review', 'pending-review'].includes(tabParam) ? tabParam : 'all';
  });

  // Sync tab from URL query params (e.g. navigated from notification)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const mapped = tabParam === 'internal-review' ? 'review' : tabParam;
    if (mapped && ['all', 'drafts', 'review', 'pending-review'].includes(mapped) && mapped !== activeTab) {
      setActiveTab(mapped);
    }
  }, [searchParams]);

  // Per-tab pagination
  const [allPage, setAllPage] = useState(1);
  const [allPageSize, setAllPageSize] = useState(10);
  const [draftsPage, setDraftsPage] = useState(1);
  const [draftsPageSize, setDraftsPageSize] = useState(10);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPageSize, setReviewPageSize] = useState(10);
  const [pendingReviewPage, setPendingReviewPage] = useState(1);
  const [pendingReviewPageSize, setPendingReviewPageSize] = useState(10);

  // Shared search (per-tab)
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Send modal — lives at page level so it survives card unmount after approval
  const [sendEstimateId, setSendEstimateId] = useState<string | null>(null);

  // Assigned creator
  const { data: assignedCreatorId } = useEstimateAssignedCreator();
  const canCreate = isAdmin || (user?.id != null && user.id === assignedCreatorId);

  // Queries for each tab — only enabled when active
  const allQuery = useEstimates(
    { page: allPage, take: allPageSize, search, excludeStatus: 'draft' },
    activeTab === 'all',
  );
  const draftsQuery = useMyEstimateDrafts(
    { page: draftsPage, take: draftsPageSize, search },
    activeTab === 'drafts',
  );
  const reviewQuery = useMyEstimateApprovals(
    { page: reviewPage, take: reviewPageSize, search },
    activeTab === 'review',
  );
  const pendingReviewQuery = useEstimates(
    { page: pendingReviewPage, take: pendingReviewPageSize, search, status: 'pending_approval' },
    activeTab === 'pending-review',
  );

  const adminApproveEstimate = useAdminApproveEstimate();
  const adminRejectEstimate = useAdminRejectEstimate();

  // Pick active query (for table-based tabs: all, drafts, pending-review)
  const currentQuery = activeTab === 'all' ? allQuery : activeTab === 'drafts' ? draftsQuery : activeTab === 'pending-review' ? pendingReviewQuery : reviewQuery;
  const estimates = currentQuery.data?.data || [];
  const meta = currentQuery.data?.meta;
  const isLoading = currentQuery.isLoading;

  // Review estimates (for Approve / Reject tab cards)
  const reviewEstimates = reviewQuery.data?.data || [];

  // Current pagination setters
  const currentPage = activeTab === 'all' ? allPage : activeTab === 'drafts' ? draftsPage : activeTab === 'pending-review' ? pendingReviewPage : reviewPage;
  const currentPageSize = activeTab === 'all' ? allPageSize : activeTab === 'drafts' ? draftsPageSize : activeTab === 'pending-review' ? pendingReviewPageSize : reviewPageSize;
  const setCurrentPage = activeTab === 'all' ? setAllPage : activeTab === 'drafts' ? setDraftsPage : activeTab === 'pending-review' ? setPendingReviewPage : setReviewPage;
  const setCurrentPageSize = activeTab === 'all' ? setAllPageSize : activeTab === 'drafts' ? setDraftsPageSize : activeTab === 'pending-review' ? setPendingReviewPageSize : setReviewPageSize;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      // Reset all pages on search
      setAllPage(1);
      setDraftsPage(1);
      setReviewPage(1);
      setPendingReviewPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSearchInput('');
    setSearch('');
  };

  // Shared data columns (no actions)
  const sharedColumns: ColumnsType<Estimate> = [
    {
      title: t('estimateList.columns.number'),
      dataIndex: 'estimate_number',
      key: 'estimate_number',
      render: (num: string) => <span style={{ fontWeight: 500 }}>{num || '-'}</span>,
    },
    {
      title: t('estimateList.columns.customer'),
      key: 'contact',
      render: (_, record) =>
        record.contact
          ? `${record.contact.first_name} ${record.contact.last_name}`
          : <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('estimateList.columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {formatStatus(status)}
        </Tag>
      ),
    },
    {
      title: t('estimateList.columns.subtotal'),
      dataIndex: 'subtotal',
      key: 'subtotal',
      render: (amount: number) => formatCurrency(amount || 0),
      sorter: (a, b) => (a.subtotal || 0) - (b.subtotal || 0),
    },
    {
      title: t('estimateList.columns.tax'),
      dataIndex: 'tax',
      key: 'tax',
      render: (amount: number) => formatCurrency(amount || 0),
    },
    {
      title: t('estimateList.columns.total'),
      dataIndex: 'total',
      key: 'total',
      render: (amount: number) => <span style={{ fontWeight: 500 }}>{formatCurrency(amount || 0)}</span>,
      sorter: (a, b) => (a.total || 0) - (b.total || 0),
    },
    {
      title: t('estimateList.columns.expiryDate'),
      dataIndex: 'expiry_date',
      key: 'expiry_date',
      render: (date: string) => date ? formatDateTime(date) : <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('estimateList.columns.created'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDateTime(date),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
  ];

  // View-only actions (All Estimates + Approve/Reject tabs)
  const viewOnlyAction: ColumnsType<Estimate>[number] = {
    title: t('estimateList.columns.actions'),
    key: 'actions',
    fixed: 'right',
    width: 80,
    render: (_, record) => (
      <Tooltip title={t('common.view')}>
        <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => navigate(`/estimates/${record.id}`)} />
      </Tooltip>
    ),
  };

  // Drafts tab actions — View + Create (continue working on draft)
  const draftsAction: ColumnsType<Estimate>[number] = {
    title: t('estimateList.columns.actions'),
    key: 'actions',
    fixed: 'right',
    width: 120,
    render: (_, record) => (
      <Space size="small">
        <Tooltip title={t('common.view')}>
          <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => navigate(`/estimates/${record.id}`)} />
        </Tooltip>
        <Tooltip title={t('estimateList.actions.edit')}>
          <Button type="text" icon={<PlusOutlined />} size="small" onClick={() => navigate(`/estimates/${record.id}/edit`)} />
        </Tooltip>
      </Space>
    ),
  };

  // Pending Review tab: inline Approve / Reject
  const pendingReviewAction: ColumnsType<Estimate>[number] = {
    title: t('estimateList.columns.actions'),
    key: 'actions',
    fixed: 'right',
    width: 200,
    render: (_, record) => (
      <Space size="small">
        <Tooltip title={t('common.view')}>
          <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => navigate(`/estimates/${record.id}`)} />
        </Tooltip>
        <Button
          size="small"
          type="primary"
          icon={<CheckCircleOutlined />}
          loading={adminApproveEstimate.isPending}
          onClick={() => {
            showConfirmDialog({
              title: t('estimateList.actions.approve'),
              content: t('estimateList.messages.confirmApprove', { number: record.estimate_number || record.id.slice(0, 8) }),
              onOk: async () => { await adminApproveEstimate.mutateAsync(record.id); },
            });
          }}
        >
          {t('estimateList.actions.approve')}
        </Button>
        <Button
          size="small"
          danger
          icon={<CloseCircleOutlined />}
          loading={adminRejectEstimate.isPending}
          onClick={() => {
            showConfirmDialog({
              title: t('estimateList.actions.reject'),
              content: t('estimateList.messages.confirmReject', { number: record.estimate_number || record.id.slice(0, 8) }),
              onOk: async () => { await adminRejectEstimate.mutateAsync({ id: record.id }); },
              danger: true,
            });
          }}
        >
          {t('estimateList.actions.reject')}
        </Button>
      </Space>
    ),
  };

  const columns: ColumnsType<Estimate> =
    activeTab === 'drafts'
      ? [...sharedColumns, draftsAction]
      : activeTab === 'pending-review'
      ? [...sharedColumns, pendingReviewAction]
      : [...sharedColumns, viewOnlyAction];

  const tabItems = [
    {
      key: 'all',
      label: t('estimateList.tabs.all'),
    },
    {
      key: 'drafts',
      label: t('estimateList.tabs.drafts'),
    },
    {
      key: 'pending-review',
      label: t('estimateList.tabs.pendingReview'),
    },
    {
      key: 'review',
      label: t('estimateList.tabs.approveReject'),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('nav.estimates')}
        subtitle={t('estimateList.pageDescription')}
        extra={
          activeTab === 'drafts' && canCreate ? (
            <PermissionGuard permission="estimates:create">
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/estimates/new')}>
                {t('estimateList.actions.create')}
              </Button>
            </PermissionGuard>
          ) : undefined
        }
      />

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />

      {activeTab === 'drafts' && !canCreate && (
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message={t('estimateList.messages.notAuthorizedToCreate')}
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <SearchFilter
          placeholder={t('estimateList.searchPlaceholder')}
          allowClear
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ width: 400 }}
        />
      </div>

      {activeTab === 'review' ? (
        reviewQuery.isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#999' }}>{t('common.loading')}</div>
        ) : reviewEstimates.length === 0 ? (
          <Alert
            type="info"
            showIcon
            message={t('estimateList.messages.noPendingReview')}
            style={{ marginBottom: 16 }}
          />
        ) : (
          <div>
            {reviewEstimates.map((est) => (
              <EstimateInternalReviewCard
                key={est.id}
                estimateId={est.id}
                estimateNumber={est.estimate_number}
                estimateStatus={est.status}
                estimateTotal={est.total}
                onAllApproved={(id) => setSendEstimateId(id)}
              />
            ))}
          </div>
        )
      ) : (
        <Table
          columns={columns}
          dataSource={estimates}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: currentPage,
            pageSize: currentPageSize,
            total: meta?.itemCount || 0,
            showSizeChanger: true,
            showTotal: (total) => t('estimateList.pagination.total', { total }),
            onChange: (newPage, newPageSize) => {
              setCurrentPage(newPage);
              setCurrentPageSize(newPageSize);
            },
          }}
        />
      )}

      {/* Send modal — rendered at page level so it persists after card unmounts */}
      <SendEstimateModal
        estimateId={sendEstimateId}
        onClose={() => setSendEstimateId(null)}
      />
    </div>
  );
}