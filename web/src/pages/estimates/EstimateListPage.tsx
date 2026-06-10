import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Button, Table, Space, Tooltip, Tag, Tabs, Alert, Row, Col, Card,
  Input, Select, Typography, Divider,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, InfoCircleOutlined, CheckCircleOutlined,
  CloseCircleOutlined, FilterOutlined,
} from '@ant-design/icons';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { useTranslation } from 'react-i18next';
import {
  useEstimates, useMyEstimateDrafts, useMyEstimateApprovals,
  useEstimateAssignedCreator, useAdminApproveEstimate, useAdminRejectEstimate,
  useCreateEstimateFromTemplate,
} from '@/hooks/use-estimates';
import EstimateInternalReviewCard from '@/components/estimates/EstimateInternalReviewCard';
import SendEstimateModal from '@/components/estimates/SendEstimateModal';
import { usePermission } from '@/components/permissions/usePermission';
import { useAuthStore } from '@/store/auth.store';
import { useAllCompanies } from '@/hooks/use-companies';
import type { Estimate } from '@/types/models.types';
import PageHeader from '@/components/common/PageHeader';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';

const { Text } = Typography;

const statusColors: Record<string, string> = {
  draft: 'default',
  pending_approval: 'orange',
  pending_internal_approval: 'orange',
  sent: 'blue',
  viewed: 'cyan',
  approved: 'green',
  customer_approved: 'green',
  rejected: 'red',
  customer_rejected: 'red',
  expired: 'orange',
  converted_to_wo: 'purple',
  converted_to_invoice: 'geekblue',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
  { value: 'converted_to_wo', label: 'Converted to WO' },
];

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function fmtInr(amount: number): string {
  return `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function EstimateListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = usePermission();
  const user = useAuthStore((s) => s.user);

  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'internal-review') return 'review';
    return tabParam && ['all', 'drafts', 'review', 'pending-review', 'templates'].includes(tabParam)
      ? tabParam
      : 'all';
  });

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const mapped = tabParam === 'internal-review' ? 'review' : tabParam;
    if (mapped && ['all', 'drafts', 'review', 'pending-review'].includes(mapped) && mapped !== activeTab) {
      setActiveTab(mapped);
    }
  }, [searchParams]);

  // ── Filter panel state ──────────────────────────────────────────
  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterContact, setFilterContact] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [showAdvancedMsg, setShowAdvancedMsg] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Per-tab pagination
  const [allPage, setAllPage] = useState(1);
  const [allPageSize, setAllPageSize] = useState(10);
  const [draftsPage, setDraftsPage] = useState(1);
  const [draftsPageSize, setDraftsPageSize] = useState(10);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPageSize, setReviewPageSize] = useState(10);
  const [pendingReviewPage, setPendingReviewPage] = useState(1);
  const [pendingReviewPageSize, setPendingReviewPageSize] = useState(10);
  const [templatesPage, setTemplatesPage] = useState(1);
  const [templatesPageSize, setTemplatesPageSize] = useState(10);

  const [sendEstimateId, setSendEstimateId] = useState<string | null>(null);

  const { data: assignedCreatorId } = useEstimateAssignedCreator();
  const canCreate = isAdmin || (user?.id != null && user.id === assignedCreatorId);

  const { data: allCompanies = [] } = useAllCompanies();

  // ── Queries ──────────────────────────────────────────────────────
  const allQuery = useEstimates(
    {
      page: allPage,
      take: allPageSize,
      search: filterName || undefined,
      status: filterStatus || undefined,
      isTemplate: false,
    },
    activeTab === 'all',
  );
  const draftsQuery = useMyEstimateDrafts(
    { page: draftsPage, take: draftsPageSize },
    activeTab === 'drafts',
  );
  const reviewQuery = useMyEstimateApprovals(
    { page: reviewPage, take: reviewPageSize },
    activeTab === 'review',
  );
  const pendingReviewQuery = useEstimates(
    { page: pendingReviewPage, take: pendingReviewPageSize, status: 'pending_approval', isTemplate: false },
    activeTab === 'pending-review',
  );
  const templatesQuery = useEstimates(
    { page: templatesPage, take: templatesPageSize, isTemplate: true },
    activeTab === 'templates',
  );

  const adminApproveEstimate = useAdminApproveEstimate();
  const adminRejectEstimate = useAdminRejectEstimate();
  const createFromTemplate = useCreateEstimateFromTemplate();

  const currentQuery =
    activeTab === 'all' ? allQuery :
    activeTab === 'drafts' ? draftsQuery :
    activeTab === 'pending-review' ? pendingReviewQuery :
    activeTab === 'templates' ? templatesQuery :
    reviewQuery;

  const rawEstimates = currentQuery.data?.data || [];
  const meta = currentQuery.data?.meta;
  const isLoading = currentQuery.isLoading;
  const reviewEstimates = reviewQuery.data?.data || [];

  // Client-side filters for email, contact, company
  const estimates = useMemo(() => {
    let result = rawEstimates;
    if (filterEmail) {
      result = result.filter((e) =>
        e.contact?.email?.toLowerCase().includes(filterEmail.toLowerCase()),
      );
    }
    if (filterContact) {
      result = result.filter((e) => {
        const name = `${e.contact?.first_name || ''} ${e.contact?.last_name || ''}`.toLowerCase();
        return name.includes(filterContact.toLowerCase());
      });
    }
    if (filterCompany) {
      result = result.filter((e) => {
        const co = allCompanies.find((c) => c.id === (e.contact as any)?.company_id);
        return co?.name?.toLowerCase().includes(filterCompany.toLowerCase());
      });
    }
    return result;
  }, [rawEstimates, filterEmail, filterContact, filterCompany, allCompanies]);

  const currentPage =
    activeTab === 'all' ? allPage :
    activeTab === 'drafts' ? draftsPage :
    activeTab === 'pending-review' ? pendingReviewPage :
    activeTab === 'templates' ? templatesPage : reviewPage;
  const currentPageSize =
    activeTab === 'all' ? allPageSize :
    activeTab === 'drafts' ? draftsPageSize :
    activeTab === 'pending-review' ? pendingReviewPageSize :
    activeTab === 'templates' ? templatesPageSize : reviewPageSize;
  const setCurrentPage =
    activeTab === 'all' ? setAllPage :
    activeTab === 'drafts' ? setDraftsPage :
    activeTab === 'pending-review' ? setPendingReviewPage :
    activeTab === 'templates' ? setTemplatesPage : setReviewPage;
  const setCurrentPageSize =
    activeTab === 'all' ? setAllPageSize :
    activeTab === 'drafts' ? setDraftsPageSize :
    activeTab === 'pending-review' ? setPendingReviewPageSize :
    activeTab === 'templates' ? setTemplatesPageSize : setReviewPageSize;

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setFilterName('');
    setFilterStatus('');
    setFilterEmail('');
    setFilterContact('');
    setFilterCompany('');
    setSelectedRowKeys([]);
  };

  // ── Columns ──────────────────────────────────────────────────────
  const sharedColumns: ColumnsType<Estimate> = [
    ...(activeTab === 'templates' ? [
      {
        title: 'Template Name',
        dataIndex: 'template_name',
        key: 'template_name',
        render: (name: string, record: any) => (
          <Link to={`/estimates/${record.id}`}>
            <span style={{ fontWeight: 500 }}>{name || 'Unnamed Template'}</span>
          </Link>
        ),
      },
    ] : [
      {
        title: 'Estimate #',
        dataIndex: 'estimate_number',
        key: 'estimate_number',
        sorter: (a: Estimate, b: Estimate) =>
          (a.estimate_number || '').localeCompare(b.estimate_number || ''),
        render: (num: string, record: any) => (
          <Link to={`/estimates/${record.id}`}>
            <span style={{ fontWeight: 500 }}>{num || '-'}</span>
          </Link>
        ),
      },
    ]),
    {
      title: 'Summary',
      key: 'summary',
      render: (_: unknown, record: any) =>
        (record.custom_fields as any)?.title || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'} style={{ borderRadius: 12, fontSize: 11 }}>
          {formatStatus(status)}
        </Tag>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_: unknown, record: Estimate) =>
        record.contact
          ? `${record.contact.first_name} ${(record.contact as any).last_name || ''}`.trim()
          : <span style={{ opacity: 0.4 }}>-</span>,
    },
    {
      title: 'Company',
      key: 'company',
      render: (_: unknown, record: Estimate) => {
        const companyId = (record.contact as any)?.company_id;
        if (!companyId) return <span style={{ opacity: 0.4 }}>-</span>;
        const co = allCompanies.find((c) => c.id === companyId);
        return co?.name || <span style={{ opacity: 0.4 }}>-</span>;
      },
    },
    {
      title: 'Grand Total (₹)',
      dataIndex: 'total',
      key: 'total',
      align: 'right' as const,
      sorter: (a: Estimate, b: Estimate) => (a.total || 0) - (b.total || 0),
      render: (amount: number) => <span style={{ fontWeight: 500 }}>{fmtInr(amount)}</span>,
    },
    {
      title: 'Estimate Owner',
      key: 'owner',
      render: () => <span style={{ opacity: 0.4 }}>-</span>,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      defaultSortOrder: 'descend' as const,
      sorter: (a: Estimate, b: Estimate) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      render: (date: string) => formatDateTime(date),
    },
  ];

  const draftsAction: ColumnsType<Estimate>[number] = {
    title: 'Actions',
    key: 'actions',
    fixed: 'right' as const,
    width: 80,
    render: (_: unknown, record: Estimate) => (
      <Button type="text" size="small" icon={<PlusOutlined />}
        onClick={() => navigate(`/estimates/${record.id}/edit`)} />
    ),
  };

  const templatesAction: ColumnsType<Estimate>[number] = {
    title: 'Actions',
    key: 'actions',
    fixed: 'right' as const,
    width: 160,
    render: (_: unknown, record: Estimate) => (
      <Space size="small">
        <Button type="text" size="small" icon={<PlusOutlined />}
          onClick={() => navigate(`/estimates/${record.id}/edit`)} />
        <Button size="small" type="primary" loading={createFromTemplate.isPending}
          onClick={async () => {
            const res = await createFromTemplate.mutateAsync({ templateId: record.id });
            const newId = (res.data?.data as { id?: string })?.id;
            if (newId) navigate(`/estimates/${newId}/edit`);
          }}>
          Use
        </Button>
      </Space>
    ),
  };

  const pendingReviewAction: ColumnsType<Estimate>[number] = {
    title: 'Actions',
    key: 'actions',
    fixed: 'right' as const,
    width: 180,
    render: (_: unknown, record: Estimate) => (
      <Space size="small">
        <Button size="small" type="primary" icon={<CheckCircleOutlined />}
          loading={adminApproveEstimate.isPending}
          onClick={() => showConfirmDialog({
            title: 'Approve Estimate',
            content: `Approve estimate ${record.estimate_number || record.id.slice(0, 8)}?`,
            onOk: async () => { await adminApproveEstimate.mutateAsync(record.id); },
          })}>
          Approve
        </Button>
        <Button size="small" danger icon={<CloseCircleOutlined />}
          loading={adminRejectEstimate.isPending}
          onClick={() => showConfirmDialog({
            title: 'Reject Estimate',
            content: `Reject estimate ${record.estimate_number || record.id.slice(0, 8)}?`,
            onOk: async () => { await adminRejectEstimate.mutateAsync({ id: record.id }); },
            danger: true,
          })}>
          Reject
        </Button>
      </Space>
    ),
  };

  const columns: ColumnsType<Estimate> =
    activeTab === 'drafts' ? [...sharedColumns, draftsAction] :
    activeTab === 'pending-review' ? [...sharedColumns, pendingReviewAction] :
    activeTab === 'templates' ? [...sharedColumns, templatesAction] :
    sharedColumns;

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  const tabItems = [
    { key: 'all', label: 'All Estimates' },
    { key: 'drafts', label: 'Drafts' },
    { key: 'pending-review', label: 'Pending Review' },
    { key: 'review', label: 'Approve / Reject' },
    { key: 'templates', label: 'Templates' },
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

      <Row gutter={16} align="top">
        {/* ── Left Filter Panel ── */}
        <Col xs={24} lg={5} xl={4}>
          <Card
            size="small"
            title={<Space size={6}><FilterOutlined style={{ fontSize: 12 }} /><span style={{ fontSize: 13, fontWeight: 600 }}>Filter Estimates</span></Space>}
            style={{ marginBottom: 16 }}
            bodyStyle={{ padding: '12px 14px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Estimate Name</div>
                <Input
                  size="small"
                  placeholder="Search by name..."
                  value={filterName}
                  onChange={(e) => { setFilterName(e.target.value); setAllPage(1); }}
                  allowClear
                />
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Status</div>
                <Select
                  size="small"
                  style={{ width: '100%' }}
                  value={filterStatus}
                  onChange={(v) => { setFilterStatus(v); setAllPage(1); }}
                  options={STATUS_OPTIONS}
                />
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Email</div>
                <Input
                  size="small"
                  placeholder="Contact email..."
                  value={filterEmail}
                  onChange={(e) => setFilterEmail(e.target.value)}
                  allowClear
                />
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Contact</div>
                <Input
                  size="small"
                  placeholder="Contact name..."
                  value={filterContact}
                  onChange={(e) => setFilterContact(e.target.value)}
                  allowClear
                />
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Company</div>
                <Input
                  size="small"
                  placeholder="Company name..."
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                  allowClear
                />
              </div>

              <Divider style={{ margin: '6px 0' }} />

              <Button
                type="link"
                size="small"
                style={{ padding: 0, fontSize: 12, textAlign: 'left', color: '#2563eb' }}
                onClick={() => setShowAdvancedMsg((v) => !v)}
              >
                Switch to Advanced Filter &gt;&gt;
              </Button>

              {showAdvancedMsg && (
                <div style={{
                  background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6,
                  padding: '8px 10px', fontSize: 12, color: '#1d4ed8',
                }}>
                  Advanced Filter coming soon
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* ── Main Content ── */}
        <Col xs={24} lg={19} xl={20}>
          {activeTab === 'drafts' && !canCreate && (
            <Alert
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              message={t('estimateList.messages.notAuthorizedToCreate')}
              style={{ marginBottom: 16 }}
            />
          )}

          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            items={tabItems}
            style={{ marginBottom: 12 }}
          />

          {activeTab === 'review' ? (
            reviewQuery.isLoading ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#999' }}>Loading…</div>
            ) : reviewEstimates.length === 0 ? (
              <Alert type="info" showIcon message={t('estimateList.messages.noPendingReview')} />
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
              rowSelection={rowSelection}
              columns={columns}
              dataSource={estimates}
              rowKey="id"
              loading={isLoading}
              scroll={{ x: 900 }}
              onRow={(record) => ({
                onClick: () => navigate(`/estimates/${record.id}`),
                style: { cursor: 'pointer' },
              })}
              pagination={{
                current: currentPage,
                pageSize: currentPageSize,
                total: meta?.itemCount || 0,
                showSizeChanger: true,
                showTotal: (total) => `${total} estimates`,
                onChange: (newPage, newPageSize) => {
                  setCurrentPage(newPage);
                  setCurrentPageSize(newPageSize);
                },
              }}
            />
          )}
        </Col>
      </Row>

      <SendEstimateModal
        estimateId={sendEstimateId}
        onClose={() => setSendEstimateId(null)}
      />
    </div>
  );
}
