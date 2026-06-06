import { useMemo } from 'react';
import {
  Col,
  Row,
  Typography,
  Button,
  Card,
  Tag,
  Progress,
  Empty,
  Spin,
  Flex,
} from 'antd';
import {
  ToolOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  RightOutlined,
  CreditCardOutlined,
  WalletOutlined,
  AlertOutlined,
  ScheduleOutlined,
  FundOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useTranslation } from 'react-i18next';
import { useAllWorkOrders } from '@/hooks/use-work-orders';
import { useAllInvoices } from '@/hooks/use-invoices';
import { useAllPayments } from '@/hooks/use-payments';
import { useAllEstimates, usePendingInternalApprovals } from '@/hooks/use-estimates';
import { usePendingVerificationPayments } from '@/hooks/use-payments';
import { useDashboardStats, useDashboardActivityFeed, useDashboardPrioritySummary } from '@/hooks/use-dashboards';
import type { Invoice } from '@/types/models.types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';

const { Title, Text } = Typography;

const PIE_COLORS = ['#1677ff', '#13c2c2', '#722ed1', '#2f54eb', '#52c41a', '#fa8c16', '#f5222d', '#8c8c8c', '#eb2f96'];

const invoiceStatusColors: Record<string, string> = {
  draft: '#8c8c8c',
  sent: '#1677ff',
  viewed: '#13c2c2',
  partially_paid: '#fa8c16',
  paid: '#52c41a',
  overdue: '#f5222d',
  void: '#d9d9d9',
};

const estimateStatusColors: Record<string, string> = {
  draft: '#8c8c8c',
  sent: '#1677ff',
  viewed: '#13c2c2',
  approved: '#52c41a',
  rejected: '#f5222d',
  expired: '#fa8c16',
  converted_to_wo: '#722ed1',
};

function getGreeting(t: (key: string) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return t('dashboard.goodMorning');
  if (hour < 17) return t('dashboard.goodAfternoon');
  return t('dashboard.goodEvening');
}

function formatCurrency(value: unknown): string {
  const num = Number(value) || 0;
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}

function getMonthlyRevenue(invoices: Invoice[]): Array<{ name: string; revenue: number; collected: number }> {
  const months: Record<string, { revenue: number; collected: number }> = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Last 6 months
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months[key] = { revenue: 0, collected: 0 };
  }

  invoices.forEach((inv) => {
    const d = new Date(inv.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (months[key]) {
      months[key].revenue += Number(inv.total) || 0;
      months[key].collected += Number(inv.paid_amount) || 0;
    }
  });

  return Object.entries(months).map(([key, val]) => {
    const [, m] = key.split('-');
    return {
      name: monthNames[parseInt(m, 10) - 1],
      revenue: val.revenue,
      collected: val.collected,
    };
  });
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  // Fetch all data
  const { data: workOrders = [], isLoading: woLoading } = useAllWorkOrders();
  const { data: invoices = [], isLoading: invLoading } = useAllInvoices();
  const { data: payments = [], isLoading: payLoading } = useAllPayments();
  const { data: estimates = [], isLoading: estLoading } = useAllEstimates();
  const { data: pendingInternalApprovals } = usePendingInternalApprovals();
  const { data: pendingPayments = [] } = usePendingVerificationPayments();

  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { data: activityFeed, isLoading: feedLoading } = useDashboardActivityFeed();
  const { data: prioritySummary, isLoading: priorityLoading } = useDashboardPrioritySummary();

  const isLoading = woLoading || invLoading || payLoading || estLoading || statsLoading;

  // ──────── Financial KPIs ────────
  const financialStats = useMemo(() => {
    const totalRevenue = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

    const paymentsCollected = payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const outstandingInvoices = invoices.filter((inv) =>
      ['sent', 'viewed', 'partially_paid', 'overdue'].includes(inv.status),
    );
    const outstandingAmount = outstandingInvoices.reduce(
      (sum, inv) => sum + ((Number(inv.total) || 0) - (Number(inv.paid_amount) || 0)),
      0,
    );

    const overdueInvoices = invoices.filter((inv) => inv.status === 'overdue');
    const overdueAmount = overdueInvoices.reduce(
      (sum, inv) => sum + ((Number(inv.total) || 0) - (Number(inv.paid_amount) || 0)),
      0,
    );

    return {
      totalRevenue,
      paymentsCollected,
      outstandingAmount,
      outstandingCount: outstandingInvoices.length,
      overdueAmount,
      overdueCount: overdueInvoices.length,
    };
  }, [invoices, payments]);

  // ──────── Operations KPIs ────────
  const opsStats = useMemo(() => {
    return {
      activeWOs: dashboardStats?.unassignedRequests || 0, // Fallback mapping for demo
      completedWOs: dashboardStats?.openRequests || 0,
      completionRate: 100, // Placeholder
      todayAppointments: dashboardStats?.criticalRequests || 0,
      totalAppointments: 0,
      pendingSRs: dashboardStats?.openRequests || 0,
    };
  }, [dashboardStats]);

  // ──────── WO Status Distribution ────────
  const woStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    workOrders.forEach((wo) => {
      counts[wo.status] = (counts[wo.status] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([status, count]) => ({
        name: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        value: count,
        status,
      }))
      .filter((d) => d.value > 0);
  }, [workOrders]);

  // ──────── Revenue Chart Data ────────
  const revenueChartData = useMemo(() => getMonthlyRevenue(invoices), [invoices]);

  // ──────── Invoice Status Breakdown ────────
  const invoiceBreakdown = useMemo(() => {
    const counts: Record<string, { count: number; amount: number }> = {};
    invoices.forEach((inv) => {
      if (!counts[inv.status]) counts[inv.status] = { count: 0, amount: 0 };
      counts[inv.status].count += 1;
      counts[inv.status].amount += Number(inv.total) || 0;
    });
    return Object.entries(counts).map(([status, data]) => ({
      status,
      label: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      ...data,
      color: invoiceStatusColors[status] || '#8c8c8c',
    }));
  }, [invoices]);

  // ──────── Estimate Pipeline ────────
  const estimatePipeline = useMemo(() => {
    const counts: Record<string, { count: number; amount: number }> = {};
    estimates.forEach((est) => {
      if (!counts[est.status]) counts[est.status] = { count: 0, amount: 0 };
      counts[est.status].count += 1;
      counts[est.status].amount += Number(est.total) || 0;
    });

    const totalEstimates = estimates.length;
    const approvedCount = counts['approved']?.count || 0;
    const convertedCount = counts['converted_to_wo']?.count || 0;
    const wonCount = approvedCount + convertedCount;
    const winRate = totalEstimates > 0 ? Math.round((wonCount / totalEstimates) * 100) : 0;
    const pipelineValue = estimates
      .filter((e) => ['draft', 'sent', 'viewed'].includes(e.status))
      .reduce((sum, e) => sum + (Number(e.total) || 0), 0);

    return {
      counts,
      totalEstimates,
      wonCount,
      winRate,
      pipelineValue,
    };
  }, [estimates]);



  return (
    <div style={{ maxWidth: 1440, margin: '0 auto' }}>
      {/* ═══════════ HEADER ═══════════ */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
            {t('dashboard.title')}
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            {getGreeting(t)}, {user?.first_name || 'User'} &middot;{' '}
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </div>
      </Flex>

      {/* ═══════════ FINANCIAL KPIs ═══════════ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{ borderRadius: 12, cursor: 'pointer' }}
            styles={{ body: { padding: '20px 24px' } }}
            hoverable
            onClick={() => navigate('/invoices')}
          >
            <Flex justify="space-between" align="flex-start">
              <div>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>{t('dashboard.totalRevenue')}</Text>
                <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, lineHeight: 1.2 }}>
                  {isLoading ? <Spin size="small" /> : formatCurrency(financialStats.totalRevenue)}
                </div>
                <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                  {t('dashboard.fromPaidInvoices', { count: invoices.filter((i) => i.status === 'paid').length })}
                </Text>
              </div>
              <div
                style={{
                  width: 48, height: 48, borderRadius: 12,
                  backgroundColor: 'rgba(82, 196, 26, 0.1)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: '#52c41a', fontSize: 22,
                }}
              >
                <FundOutlined />
              </div>
            </Flex>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{ borderRadius: 12, cursor: 'pointer' }}
            styles={{ body: { padding: '20px 24px' } }}
            hoverable
            onClick={() => navigate('/invoices')}
          >
            <Flex justify="space-between" align="flex-start">
              <div>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>{t('dashboard.paymentsCollected')}</Text>
                <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, lineHeight: 1.2 }}>
                  {isLoading ? <Spin size="small" /> : formatCurrency(financialStats.paymentsCollected)}
                </div>
                <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                  {t('dashboard.completedPayments', { count: payments.filter((p) => p.status === 'completed').length })}
                </Text>
              </div>
              <div
                style={{
                  width: 48, height: 48, borderRadius: 12,
                  backgroundColor: 'rgba(22, 119, 255, 0.08)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: '#1677ff', fontSize: 22,
                }}
              >
                <CreditCardOutlined />
              </div>
            </Flex>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{ borderRadius: 12, cursor: 'pointer' }}
            styles={{ body: { padding: '20px 24px' } }}
            hoverable
            onClick={() => navigate('/invoices')}
          >
            <Flex justify="space-between" align="flex-start">
              <div>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>{t('dashboard.outstanding')}</Text>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#fa8c16', marginTop: 4, lineHeight: 1.2 }}>
                  {isLoading ? <Spin size="small" /> : formatCurrency(financialStats.outstandingAmount)}
                </div>
                <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                  {t('dashboard.unpaidInvoices', { count: financialStats.outstandingCount })}
                </Text>
              </div>
              <div
                style={{
                  width: 48, height: 48, borderRadius: 12,
                  backgroundColor: 'rgba(250, 173, 20, 0.1)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: '#fa8c16', fontSize: 22,
                }}
              >
                <WalletOutlined />
              </div>
            </Flex>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 12,
              border: financialStats.overdueAmount > 0 ? '1px solid rgba(255, 77, 79, 0.25)' : undefined,
              cursor: 'pointer',
              background: financialStats.overdueAmount > 0 ? 'rgba(255, 77, 79, 0.1)' : undefined,
            }}
            styles={{ body: { padding: '20px 24px' } }}
            hoverable
            onClick={() => navigate('/invoices')}
          >
            <Flex justify="space-between" align="flex-start">
              <div>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>{t('dashboard.overdueLabel')}</Text>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#f5222d', marginTop: 4, lineHeight: 1.2 }}>
                  {isLoading ? <Spin size="small" /> : formatCurrency(financialStats.overdueAmount)}
                </div>
                <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                  {t('dashboard.overdueInvoices', { count: financialStats.overdueCount })}
                </Text>
              </div>
              <div
                style={{
                  width: 48, height: 48, borderRadius: 12,
                  backgroundColor: 'rgba(255, 77, 79, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#f5222d', fontSize: 22,
                }}
              >
                <AlertOutlined />
              </div>
            </Flex>
          </Card>
        </Col>
      </Row>

      {/* ═══════════ OPERATIONS KPIs ═══════════ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{ borderRadius: 12, cursor: 'pointer' }}
            styles={{ body: { padding: '20px 24px' } }}
            hoverable
            onClick={() => navigate('/work-orders')}
          >
            <Flex justify="space-between" align="flex-start">
              <div>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>{t('dashboard.activeJobs')}</Text>
                <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, lineHeight: 1.2 }}>
                  {woLoading ? <Spin size="small" /> : opsStats.activeWOs}
                </div>
                <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                  {t('dashboard.ofTotalWorkOrders', { count: workOrders.length })}
                </Text>
              </div>
              <div
                style={{
                  width: 48, height: 48, borderRadius: 12,
                  backgroundColor: 'rgba(22, 119, 255, 0.08)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: '#1677ff', fontSize: 22,
                }}
              >
                <ToolOutlined />
              </div>
            </Flex>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{ borderRadius: 12, cursor: 'pointer' }}
            styles={{ body: { padding: '20px 24px' } }}
            hoverable
            onClick={() => navigate('/work-orders')}
          >
            <Flex justify="space-between" align="flex-start">
              <div>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>{t('dashboard.completionRate')}</Text>
                <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, lineHeight: 1.2 }}>
                  {woLoading ? <Spin size="small" /> : `${opsStats.completionRate}%`}
                </div>
                <Progress
                  percent={opsStats.completionRate}
                  showInfo={false}
                  size="small"
                  strokeColor="#52c41a"
                  style={{ marginTop: 8 }}
                />
              </div>
              <div
                style={{
                  width: 48, height: 48, borderRadius: 12,
                  backgroundColor: 'rgba(82, 196, 26, 0.1)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: '#52c41a', fontSize: 22,
                }}
              >
                <CheckCircleOutlined />
              </div>
            </Flex>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{ borderRadius: 12, cursor: 'pointer' }}
            styles={{ body: { padding: '20px 24px' } }}
            hoverable
            onClick={() => navigate('/scheduling')}
          >
            <Flex justify="space-between" align="flex-start">
              <div>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>{t('dashboard.todaysAppointments')}</Text>
                <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, lineHeight: 1.2 }}>
                  {statsLoading ? <Spin size="small" /> : opsStats.todayAppointments}
                </div>
                <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                  {t('dashboard.totalScheduled', { count: opsStats.totalAppointments })}
                </Text>
              </div>
              <div
                style={{
                  width: 48, height: 48, borderRadius: 12,
                  backgroundColor: 'rgba(47, 84, 235, 0.08)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: '#2f54eb', fontSize: 22,
                }}
              >
                <ScheduleOutlined />
              </div>
            </Flex>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{ borderRadius: 12, cursor: 'pointer' }}
            styles={{ body: { padding: '20px 24px' } }}
            hoverable
            onClick={() => navigate('/service-requests?status=new')}
          >
            <Flex justify="space-between" align="flex-start">
              <div>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>{t('dashboard.pendingRequests')}</Text>
                <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, lineHeight: 1.2 }}>
                  {statsLoading ? <Spin size="small" /> : opsStats.pendingSRs}
                </div>
                <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                  {t('dashboard.totalRequests', { count: 0 })}
                </Text>
              </div>
              <div
                style={{
                  width: 48, height: 48, borderRadius: 12,
                  backgroundColor: 'rgba(114, 46, 209, 0.1)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: '#722ed1', fontSize: 22,
                }}
              >
                <ExclamationCircleOutlined />
              </div>
            </Flex>
          </Card>
        </Col>
      </Row>

      {/* ═══════════ PENDING PAYMENT VERIFICATIONS ═══════════ */}
      {(pendingPayments as any[]).length > 0 && (
        <Card
          style={{ marginBottom: 20, borderColor: '#faad14' }}
          title={
            <Flex align="center" gap={8}>
              <AlertOutlined style={{ color: '#d48806' }} />
              <Text strong style={{ color: '#d48806' }}>
                {(pendingPayments as any[]).length} Payment{(pendingPayments as any[]).length > 1 ? 's' : ''} Awaiting Verification
              </Text>
            </Flex>
          }
          extra={<Button size="small" onClick={() => navigate('/payments')}>View All</Button>}
        >
          <Row gutter={[12, 12]}>
            {(pendingPayments as any[]).slice(0, 4).map((p: any) => (
              <Col xs={24} sm={12} lg={6} key={p.id}>
                <Card size="small" hoverable onClick={() => navigate(`/invoices/${p.invoice_id}`)}
                  style={{ borderLeft: '3px solid #faad14', cursor: 'pointer' }}>
                  <Text strong style={{ display: 'block' }}>
                    {p.invoice?.invoice_number || 'Invoice'}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {p.invoice?.contact ? `${p.invoice.contact.first_name} ${p.invoice.contact.last_name}` : 'Customer'}
                  </Text>
                  <div style={{ marginTop: 6, fontWeight: 700, fontSize: 15 }}>
                    {formatCurrency(p.amount || 0)}
                  </div>
                  <Tag color="orange" style={{ marginTop: 4 }}>{p.method?.toUpperCase()}</Tag>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* ═══════════ PENDING ON-SITE ESTIMATES (managers only) ═══════════ */}
      {Array.isArray(pendingInternalApprovals) && (pendingInternalApprovals as any[]).length > 0 && (
        <Card
          style={{ marginBottom: 20, borderColor: '#faad14' }}
          title={
            <Flex align="center" gap={8}>
              <ExclamationCircleOutlined style={{ color: '#d48806' }} />
              <Text strong style={{ color: '#d48806' }}>
                {(pendingInternalApprovals as any[]).length} On-Site Estimate{(pendingInternalApprovals as any[]).length > 1 ? 's' : ''} Awaiting Your Review
              </Text>
            </Flex>
          }
          extra={
            <Button size="small" onClick={() => navigate('/estimates')}>View All</Button>
          }
        >
          <Row gutter={[12, 12]}>
            {((pendingInternalApprovals as any[]) as any[]).slice(0, 4).map((est: any) => (
              <Col xs={24} sm={12} lg={6} key={est.id}>
                <Card
                  size="small"
                  hoverable
                  onClick={() => navigate(`/estimates/${est.id}`)}
                  style={{ borderLeft: '3px solid #faad14', cursor: 'pointer' }}
                >
                  <Text strong style={{ display: 'block' }}>{est.estimate_number || est.id.slice(0, 8)}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {est.contact ? `${est.contact.first_name} ${est.contact.last_name}` : 'No customer'}
                  </Text>
                  <div style={{ marginTop: 6, fontWeight: 700, fontSize: 15 }}>
                    {formatCurrency(est.total || 0)}
                  </div>
                  <Tag color="orange" style={{ marginTop: 4 }}>Pending Review</Tag>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* ═══════════ CHARTS ROW: Revenue + WO Status ═══════════ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {/* Revenue Trend */}
        <Col xs={24} lg={14}>
          <Card
            title={<Text strong style={{ fontSize: 15 }}>{t('dashboard.revenueCollections')}</Text>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>{t('dashboard.last6Months')}</Text>}
            style={{ borderRadius: 12, border: '1px solid #f0f0f0', height: '100%' }}
            styles={{ body: { padding: '16px 24px 24px' } }}
          >
            {invLoading ? (
              <Flex justify="center" align="center" style={{ height: 280 }}><Spin /></Flex>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#52c41a" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#52c41a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1677ff" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#1677ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8c8c8c', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8c8c8c', fontSize: 12 }} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <RTooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #f0f0f0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={((value: number) => `$${value.toLocaleString()}`) as any}
                  />
                  <Area type="monotone" dataKey="revenue" name={t('dashboard.invoiced')} stroke="#52c41a" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="collected" name={t('dashboard.collected')} stroke="#1677ff" strokeWidth={2} fillOpacity={1} fill="url(#colorCollected)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
            <Flex gap={24} justify="center" style={{ marginTop: 8 }}>
              <Flex align="center" gap={6}>
                <div style={{ width: 12, height: 3, backgroundColor: '#52c41a', borderRadius: 2 }} />
                <Text type="secondary" style={{ fontSize: 12 }}>{t('dashboard.invoiced')}</Text>
              </Flex>
              <Flex align="center" gap={6}>
                <div style={{ width: 12, height: 3, backgroundColor: '#1677ff', borderRadius: 2 }} />
                <Text type="secondary" style={{ fontSize: 12 }}>{t('dashboard.collected')}</Text>
              </Flex>
            </Flex>
          </Card>
        </Col>

        {/* Work Order Status Distribution */}
        <Col xs={24} lg={10}>
          <Card
            title={<Text strong style={{ fontSize: 15 }}>{t('dashboard.workOrderPipeline')}</Text>}
            extra={
              <Button type="link" size="small" onClick={() => navigate('/work-orders')} style={{ padding: 0 }}>
                {t('common.viewAll')} <RightOutlined style={{ fontSize: 10 }} />
              </Button>
            }
            style={{ borderRadius: 12, border: '1px solid #f0f0f0', height: '100%' }}
            styles={{ body: { padding: '16px 24px 24px' } }}
          >
            {woLoading ? (
              <Flex justify="center" align="center" style={{ height: 280 }}><Spin /></Flex>
            ) : woStatusData.length === 0 ? (
              <Empty description={t('dashboard.noWorkOrders')} image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ paddingTop: 60 }} />
            ) : (
              <Flex vertical>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={woStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {woStatusData.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RTooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #f0f0f0' }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={((value: number) => `${value}`) as any}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', justifyContent: 'center' }}>
                  {woStatusData.map((d, i) => (
                    <Flex key={d.status} align="center" gap={4}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <Text style={{ fontSize: 12, color: '#595959' }}>{d.name} ({d.value})</Text>
                    </Flex>
                  ))}
                </div>
              </Flex>
            )}
          </Card>
        </Col>
      </Row>

      {/* ═══════════ INVOICE & ESTIMATE ROW ═══════════ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {/* Invoice Breakdown + AR Aging */}
        <Col xs={24} lg={12}>
          <Card
            title={<Text strong style={{ fontSize: 15 }}>{t('dashboard.invoiceOverview')}</Text>}
            extra={
              <Button type="link" size="small" onClick={() => navigate('/invoices')} style={{ padding: 0 }}>
                {t('common.viewAll')} <RightOutlined style={{ fontSize: 10 }} />
              </Button>
            }
            style={{ borderRadius: 12, border: '1px solid #f0f0f0', height: '100%' }}
            styles={{ body: { padding: '16px 24px 24px' } }}
          >
            {invLoading ? (
              <Flex justify="center" align="center" style={{ height: 200 }}><Spin /></Flex>
            ) : invoices.length === 0 ? (
              <Empty description={t('dashboard.noInvoices')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <>
                {/* Invoice status bars */}
                <div style={{ marginBottom: 20 }}>
                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('dashboard.byStatus')}
                  </Text>
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {invoiceBreakdown.map((item) => (
                      <div key={item.status}>
                        <Flex justify="space-between" style={{ marginBottom: 4 }}>
                          <Flex align="center" gap={6}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color }} />
                            <Text style={{ fontSize: 13 }}>{item.label}</Text>
                          </Flex>
                          <Text strong style={{ fontSize: 13 }}>
                            {item.count} &middot; ${item.amount.toLocaleString()}
                          </Text>
                        </Flex>
                        <Progress
                          percent={invoices.length > 0 ? (item.count / invoices.length) * 100 : 0}
                          showInfo={false}
                          size="small"
                          strokeColor={item.color}
                          trailColor="#f5f5f5"
                        />
                      </div>
                    ))}
                  </div>
                </div>

              </>
            )}
          </Card>
        </Col>

        {/* Estimate Pipeline + Payment Methods */}
        <Col xs={24} lg={12}>
          <Card
            title={<Text strong style={{ fontSize: 15 }}>{t('dashboard.estimatePipeline')}</Text>}
            style={{ borderRadius: 12, border: '1px solid #f0f0f0', height: '100%' }}
            styles={{ body: { padding: '16px 24px 24px' } }}
          >
            {/* Estimate Pipeline */}
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('dashboard.estimatePipeline')}
            </Text>
            {estLoading ? (
              <Flex justify="center" style={{ padding: 20 }}><Spin size="small" /></Flex>
            ) : estimates.length === 0 ? (
              <Empty description={t('dashboard.noEstimates')} image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '12px 0' }} />
            ) : (
              <div style={{ marginTop: 12, marginBottom: 20 }}>
                <Row gutter={[12, 12]}>
                  <Col span={8}>
                    <div style={{ background: 'rgba(82, 196, 26, 0.1)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#52c41a' }}>{estimatePipeline.winRate}%</div>
                      <Text type="secondary" style={{ fontSize: 11 }}>{t('dashboard.winRate')}</Text>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ background: 'rgba(22, 119, 255, 0.08)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#1677ff' }}>{estimatePipeline.totalEstimates}</div>
                      <Text type="secondary" style={{ fontSize: 11 }}>{t('common.total')}</Text>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ background: 'rgba(114, 46, 209, 0.1)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#722ed1' }}>{formatCurrency(estimatePipeline.pipelineValue)}</div>
                      <Text type="secondary" style={{ fontSize: 11 }}>{t('dashboard.pipeline')}</Text>
                    </div>
                  </Col>
                </Row>
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {Object.entries(estimatePipeline.counts).map(([status, data]) => (
                    <Tag
                      key={status}
                      color={estimateStatusColors[status]}
                      style={{ fontSize: 12, borderRadius: 4, margin: 0 }}
                    >
                      {status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}: {data.count}
                    </Tag>
                  ))}
                </div>
              </div>
            )}

          </Card>
        </Col>
      </Row>

    </div>
  );
}
